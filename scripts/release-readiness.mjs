#!/usr/bin/env node

import { promises as dns } from "node:dns";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const PRODUCTION_ORIGIN = "https://coach-murray.netlify.app";
const CANDIDATE_ORIGIN = "https://coachmurray.netlify.app";
const REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.async_payment_succeeded",
  "checkout.session.completed",
  "customer.subscription.deleted",
  "customer.subscription.updated",
  "invoice.payment_failed",
];
const REQUIRED_RESEND_RECORDS = ["DKIM:TXT", "SPF:MX", "SPF:TXT"];
const REQUIRED_TABLES = [
  "audit_logs",
  "client_check_ins",
  "client_consents",
  "client_goals",
  "client_metrics",
  "client_profiles",
  "client_programs",
  "client_tasks",
  "coach_notes",
  "lead_submissions",
  "onboarding_submissions",
  "payment_events",
  "stripe_customers",
];
const REQUIRED_PRIVATE_ROUTES = [
  "/sign-in",
  "/coach/sign-in",
  "/account/confirm",
  "/account/reset",
  "/onboarding",
  "/dashboard",
  "/admin",
];

export function parseEnv(source) {
  const result = {};
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    result[key] = value;
  }
  return result;
}

export function isConfigured(value) {
  return Boolean(
    value &&
    !/REPLACE_ME|YOUR_|example\.com|localhost/i.test(value) &&
    !/^\s*$/u.test(value)
  );
}

export function senderDomain(value) {
  const match = String(value ?? "").match(/<[^@<>]+@([^<>]+)>|@([^\s<>]+)/);
  return (match?.[1] ?? match?.[2] ?? "").toLowerCase();
}

export function expectedCheckoutRedirect(origin = PRODUCTION_ORIGIN) {
  return `${origin}/onboarding?session_id={CHECKOUT_SESSION_ID}`;
}

export function paymentLinkIsProductionReady(
  paymentLink,
  origin = PRODUCTION_ORIGIN
) {
  return (
    paymentLink?.active === true &&
    paymentLink?.after_completion?.type === "redirect" &&
    paymentLink?.after_completion?.redirect?.url ===
      expectedCheckoutRedirect(origin)
  );
}

export function extractStripeUrls(html) {
  return [...String(html).matchAll(/data-stripe-url=["']([^"']+)["']/g)].map(
    match => match[1]
  );
}

export function releaseSummary(checks, phase) {
  const blocking = checks.filter(
    check => check.requiredIn.includes(phase) && !check.ok
  );
  return { ready: blocking.length === 0, blocking };
}

function safeCheck(checks, id, label, ok, detail, requiredIn) {
  checks.push({ id, label, ok: Boolean(ok), detail, requiredIn });
}

async function jsonRequest(url, init = {}) {
  const response = await request(url, init);
  const text = await response.text();
  let body = {};
  try {
    body = JSON.parse(text);
  } catch {
    // Status and response headers are sufficient for release checks.
  }
  return { response, body };
}

function request(url, init = {}) {
  return fetch(url, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(10_000),
  });
}

async function checkHttpBoundary(
  checks,
  id,
  label,
  url,
  expectedStatus,
  phase
) {
  try {
    const response = await request(url, { redirect: "manual" });
    safeCheck(
      checks,
      id,
      label,
      response.status === expectedStatus,
      `HTTP ${response.status}; expected ${expectedStatus}`,
      [phase]
    );
  } catch {
    safeCheck(checks, id, label, false, "request failed", [phase]);
  }
}

async function checkPrivateRoutes(checks, origin, phase, label) {
  let passing = 0;
  await Promise.all(
    REQUIRED_PRIVATE_ROUTES.map(async path => {
      try {
        const response = await request(`${origin}${path}`, {
          redirect: "manual",
        });
        const cacheControl = response.headers.get("cache-control") ?? "";
        const robots = response.headers.get("x-robots-tag") ?? "";
        const referrer = response.headers.get("referrer-policy") ?? "";
        const csp = response.headers.get("content-security-policy") ?? "";
        if (
          response.status === 200 &&
          cacheControl.includes("no-store") &&
          robots.includes("noindex") &&
          referrer === "no-referrer" &&
          csp.includes("script-src 'self'")
        ) {
          passing += 1;
        }
      } catch {
        // Counted in the route summary below.
      }
    })
  );
  safeCheck(
    checks,
    `netlify.${phase}_private_routes`,
    label,
    passing === REQUIRED_PRIVATE_ROUTES.length,
    `${passing}/${REQUIRED_PRIVATE_ROUTES.length} private routes and headers ready`,
    [phase]
  );
}

export async function runReadiness({
  env,
  phase = "production",
  resolveNs = dns.resolveNs,
}) {
  const checks = [];
  const always = ["candidate", "production"];
  const productionOnly = ["production"];
  const candidateOnly = ["candidate"];
  const serverKeys = [
    "SITE_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_ALLOWED_PAYMENT_LINK_IDS",
    "RESEND_API_KEY",
    "ONBOARDING_NOTIFY_EMAIL",
  ];
  const publicKeys = [
    "VITE_SITE_URL",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ];

  safeCheck(
    checks,
    "env.server",
    "Server environment contract",
    serverKeys.every(key => isConfigured(env[key])),
    `${serverKeys.filter(key => isConfigured(env[key])).length}/${serverKeys.length} configured`,
    always
  );
  safeCheck(
    checks,
    "env.public",
    "Public build environment contract",
    publicKeys.every(key => isConfigured(env[key])),
    `${publicKeys.filter(key => isConfigured(env[key])).length}/${publicKeys.length} configured`,
    always
  );
  safeCheck(
    checks,
    "env.origin",
    "Canonical production origin",
    env.SITE_URL === PRODUCTION_ORIGIN &&
      env.VITE_SITE_URL === PRODUCTION_ORIGIN,
    env.SITE_URL === PRODUCTION_ORIGIN
      ? "production origin configured"
      : "production origin mismatch",
    always
  );

  const fromConfigured = isConfigured(env.TRANSACTIONAL_FROM_EMAIL);
  safeCheck(
    checks,
    "email.sender",
    "Transactional sender",
    fromConfigured,
    fromConfigured ? "configured" : "missing or placeholder",
    always
  );

  let resendDomains = [];
  if (isConfigured(env.RESEND_API_KEY)) {
    try {
      const { response, body } = await jsonRequest(
        "https://api.resend.com/domains",
        { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } }
      );
      if (response.ok && Array.isArray(body.data)) resendDomains = body.data;
    } catch {
      // Reported by the status check below.
    }
  }
  const configuredDomain = fromConfigured
    ? senderDomain(env.TRANSACTIONAL_FROM_EMAIL)
    : "";
  const selectedDomain = resendDomains.find(
    domain => domain.name === configuredDomain
  );
  const inspectedDomain = selectedDomain ?? resendDomains[0];
  let resendRecords = [];
  if (inspectedDomain?.id && isConfigured(env.RESEND_API_KEY)) {
    try {
      const { response, body } = await jsonRequest(
        `https://api.resend.com/domains/${encodeURIComponent(inspectedDomain.id)}`,
        { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } }
      );
      if (response.ok && Array.isArray(body.records)) {
        resendRecords = body.records;
      }
    } catch {
      // Reported by the record check below.
    }
  }
  safeCheck(
    checks,
    "email.resend_domain",
    "Resend sending domain",
    Boolean(configuredDomain) && selectedDomain?.status === "verified",
    selectedDomain
      ? `${selectedDomain.name}: ${selectedDomain.status}`
      : configuredDomain
        ? `${configuredDomain}: not found in Resend`
        : inspectedDomain
          ? `sender unset; available domain ${inspectedDomain.name}: ${inspectedDomain.status}`
          : "sender unset; no Resend domain found",
    always
  );
  const resendRecordKeys = resendRecords.map(
    record => `${record.record}:${record.type}`
  );
  safeCheck(
    checks,
    "email.resend_records",
    "Resend DKIM/SPF records",
    Boolean(selectedDomain) &&
      REQUIRED_RESEND_RECORDS.every(key => resendRecordKeys.includes(key)) &&
      resendRecords.every(record => record.status === "verified"),
    resendRecords.length
      ? `${resendRecords.filter(record => record.status === "verified").length}/${resendRecords.length} verified`
      : "records unavailable",
    always
  );
  let dnsReady = false;
  if (configuredDomain) {
    try {
      dnsReady = (await resolveNs(configuredDomain)).length > 0;
    } catch {
      dnsReady = false;
    }
  }
  safeCheck(
    checks,
    "email.dns",
    "Sending-domain DNS",
    dnsReady,
    configuredDomain
      ? `${configuredDomain}: ${dnsReady ? "delegated" : "NXDOMAIN or undelegated"}`
      : "sender domain is not configured",
    always
  );

  const allowedIds = String(env.STRIPE_ALLOWED_PAYMENT_LINK_IDS ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  safeCheck(
    checks,
    "stripe.allowlist",
    "Stripe Payment Link allowlist",
    allowedIds.length === 4 && new Set(allowedIds).size === 4,
    `${new Set(allowedIds).size}/4 unique IDs`,
    always
  );
  const paymentLinks = [];
  if (isConfigured(env.STRIPE_SECRET_KEY)) {
    for (const id of allowedIds) {
      try {
        const { response, body } = await jsonRequest(
          `https://api.stripe.com/v1/payment_links/${encodeURIComponent(id)}`,
          { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
        );
        if (response.ok) paymentLinks.push(body);
      } catch {
        // Counted as a missing link below.
      }
    }
  }
  safeCheck(
    checks,
    "stripe.links_active",
    "Allowlisted live Stripe links",
    paymentLinks.length === 4 &&
      paymentLinks.every(link => link.active && link.livemode),
    `${paymentLinks.filter(link => link.active && link.livemode).length}/4 active and live`,
    always
  );
  let candidateHtml = "";
  try {
    const response = await request(CANDIDATE_ORIGIN);
    if (response.ok) candidateHtml = await response.text();
  } catch {
    // Reported by the public mapping check below.
  }
  const publicStripeUrls = extractStripeUrls(candidateHtml);
  const apiStripeUrls = paymentLinks.map(link => link.url).filter(Boolean);
  safeCheck(
    checks,
    "netlify.candidate_entrypoints",
    "Candidate authentication entry points",
    candidateHtml.includes('href="/sign-in"') &&
      candidateHtml.includes('href="/coach/sign-in"'),
    "client and coach sign-in links",
    candidateOnly
  );
  safeCheck(
    checks,
    "stripe.public_mapping",
    "Candidate pricing-to-Stripe mapping",
    publicStripeUrls.length === 4 &&
      apiStripeUrls.length === 4 &&
      publicStripeUrls.every(url => apiStripeUrls.includes(url)),
    `${publicStripeUrls.filter(url => apiStripeUrls.includes(url)).length}/4 mapped`,
    always
  );
  safeCheck(
    checks,
    "stripe.redirects",
    "Stripe post-payment redirects",
    paymentLinks.length === 4 &&
      paymentLinks.every(link => paymentLinkIsProductionReady(link)),
    `${paymentLinks.filter(link => paymentLinkIsProductionReady(link)).length}/4 production-ready`,
    productionOnly
  );

  let webhook = null;
  if (
    isConfigured(env.STRIPE_SECRET_KEY) &&
    isConfigured(env.STRIPE_WEBHOOK_ENDPOINT_ID)
  ) {
    try {
      const { response, body } = await jsonRequest(
        `https://api.stripe.com/v1/webhook_endpoints/${encodeURIComponent(env.STRIPE_WEBHOOK_ENDPOINT_ID)}`,
        { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } }
      );
      if (response.ok) webhook = body;
    } catch {
      // Reported below.
    }
  }
  const webhookEvents = [...(webhook?.enabled_events ?? [])].sort();
  safeCheck(
    checks,
    "stripe.webhook_config",
    "Stripe webhook configuration",
    webhook?.livemode === true &&
      webhook?.url ===
        `${PRODUCTION_ORIGIN}/.netlify/functions/stripe-webhook` &&
      JSON.stringify(webhookEvents) === JSON.stringify(REQUIRED_WEBHOOK_EVENTS),
    webhook ? `${webhookEvents.length}/5 events` : "endpoint unavailable",
    always
  );
  safeCheck(
    checks,
    "stripe.webhook_candidate",
    "Candidate webhook safety",
    webhook?.status === "disabled",
    webhook?.status ?? "endpoint unavailable",
    candidateOnly
  );
  safeCheck(
    checks,
    "stripe.webhook_production",
    "Production webhook activation",
    webhook?.status === "enabled",
    webhook?.status ?? "endpoint unavailable",
    productionOnly
  );

  if (
    isConfigured(env.SUPABASE_URL) &&
    isConfigured(env.VITE_SUPABASE_ANON_KEY)
  ) {
    try {
      const { response, body } = await jsonRequest(
        `${env.SUPABASE_URL}/auth/v1/settings`,
        { headers: { apikey: env.VITE_SUPABASE_ANON_KEY } }
      );
      safeCheck(
        checks,
        "supabase.auth",
        "Supabase Auth boundary",
        response.ok &&
          body.disable_signup === true &&
          body.mailer_autoconfirm === false &&
          body.external?.email === true,
        response.ok
          ? "invite-only email/password Auth"
          : `HTTP ${response.status}`,
        always
      );
    } catch {
      safeCheck(
        checks,
        "supabase.auth",
        "Supabase Auth boundary",
        false,
        "request failed",
        always
      );
    }
  }

  let owner = null;
  let databaseReady = false;
  let tableCount = 0;
  if (
    isConfigured(env.SUPABASE_URL) &&
    isConfigured(env.SUPABASE_SERVICE_ROLE_KEY)
  ) {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    try {
      const tableResults = await Promise.all(
        REQUIRED_TABLES.map(table =>
          supabase.from(table).select("*", { count: "exact", head: true })
        )
      );
      tableCount = tableResults.filter(result => !result.error).length;
      databaseReady = tableCount === REQUIRED_TABLES.length;
      for (let page = 1; !owner; page += 1) {
        const users = await supabase.auth.admin.listUsers({
          page,
          perPage: 200,
        });
        owner = users.data?.users.find(
          user =>
            user.email?.toLowerCase() ===
            env.ONBOARDING_NOTIFY_EMAIL?.toLowerCase()
        );
        if ((users.data?.users.length ?? 0) < 200 || page >= 50) break;
      }
    } catch {
      databaseReady = false;
    }
  }
  safeCheck(
    checks,
    "supabase.database",
    "Supabase data boundary",
    databaseReady,
    `${tableCount}/${REQUIRED_TABLES.length} required tables queryable`,
    always
  );
  safeCheck(
    checks,
    "supabase.owner",
    "Coach OS owner role",
    owner?.app_metadata?.role === "owner" && Boolean(owner.email_confirmed_at),
    owner ? "confirmed owner exists" : "owner missing",
    always
  );
  safeCheck(
    checks,
    "supabase.owner_sign_in",
    "Owner acceptance sign-in",
    Boolean(owner?.last_sign_in_at),
    owner?.last_sign_in_at ? "owner has signed in" : "awaiting owner sign-in",
    always
  );

  await checkHttpBoundary(
    checks,
    "netlify.candidate_session",
    "Candidate anonymous session boundary",
    `${CANDIDATE_ORIGIN}/.netlify/functions/session-context`,
    401,
    "candidate"
  );
  await checkHttpBoundary(
    checks,
    "netlify.candidate_checkout",
    "Candidate checkout boundary",
    `${CANDIDATE_ORIGIN}/.netlify/functions/verify-checkout`,
    400,
    "candidate"
  );
  await checkHttpBoundary(
    checks,
    "netlify.production_session",
    "Production anonymous session boundary",
    `${PRODUCTION_ORIGIN}/.netlify/functions/session-context`,
    401,
    "production"
  );
  await checkHttpBoundary(
    checks,
    "netlify.production_checkout",
    "Production checkout boundary",
    `${PRODUCTION_ORIGIN}/.netlify/functions/verify-checkout`,
    400,
    "production"
  );
  await checkPrivateRoutes(
    checks,
    CANDIDATE_ORIGIN,
    "candidate",
    "Candidate private-route security headers"
  );
  await checkPrivateRoutes(
    checks,
    PRODUCTION_ORIGIN,
    "production",
    "Production private-route security headers"
  );

  return checks;
}

function parseArgs(argv) {
  const phaseIndex = argv.indexOf("--phase");
  const phase = phaseIndex >= 0 ? argv[phaseIndex + 1] : "production";
  return {
    phase,
    json: argv.includes("--json"),
    help: argv.includes("--help"),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(
      "Usage: node scripts/release-readiness.mjs [--phase candidate|production] [--json]\n"
    );
    return;
  }
  if (args.phase !== "candidate" && args.phase !== "production") {
    process.stderr.write("--phase must be candidate or production\n");
    process.exitCode = 2;
    return;
  }
  let env;
  try {
    env = parseEnv(await readFile(new URL("../.env", import.meta.url), "utf8"));
  } catch {
    process.stderr.write("Ignored .env file is required for release checks.\n");
    process.exitCode = 2;
    return;
  }
  const checks = await runReadiness({ env, phase: args.phase });
  const summary = releaseSummary(checks, args.phase);
  if (args.json) {
    process.stdout.write(
      `${JSON.stringify({ phase: args.phase, ...summary, checks }, null, 2)}\n`
    );
  } else {
    for (const check of checks) {
      const required = check.requiredIn.includes(args.phase);
      const marker = check.ok ? "PASS" : required ? "FAIL" : "INFO";
      process.stdout.write(`[${marker}] ${check.label}: ${check.detail}\n`);
    }
    process.stdout.write(
      `Release phase ${args.phase}: ${summary.ready ? "READY" : `BLOCKED (${summary.blocking.length})`}\n`
    );
  }
  if (!summary.ready) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) await main();
