import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import Stripe from "stripe";

declare const Netlify:
  { env: { get(name: string): string | undefined } } | undefined;

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function env(name: string) {
  if (typeof Netlify !== "undefined") return Netlify.env.get(name)?.trim();
  return process.env[name]?.trim();
}

export function requiredEnv(name: string) {
  const value = env(name);
  if (!value) throw new HttpError(503, `${name} is not configured.`);
  return value;
}

export function json(status: number, body: unknown, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return json(error.status, { error: error.message });
  if (error instanceof SyntaxError)
    return json(400, { error: "The request body is not valid JSON." });
  console.error(
    "Unhandled function error",
    error instanceof Error ? error.message : "Unknown error"
  );
  return json(500, { error: "The request could not be completed." });
}

export function requireMethod(request: Request, method: "GET" | "POST") {
  if (request.method !== method)
    throw new HttpError(405, `Use ${method} for this endpoint.`);
}

export function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = env("SITE_URL");
  const allowed = new Set(
    [
      requestOrigin,
      configuredOrigin,
      "http://localhost:8888",
      "http://127.0.0.1:8888",
    ].filter(Boolean)
  );
  if (!allowed.has(origin))
    throw new HttpError(403, "Request origin is not allowed.");
}

export async function readJson(request: Request, maxBytes = 600_000) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes)
    throw new HttpError(413, "The request is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes)
    throw new HttpError(413, "The request is too large.");
  return JSON.parse(text) as unknown;
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

let stripe: Stripe | null = null;
export function getStripe() {
  if (!stripe)
    stripe = new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
      maxNetworkRetries: 2,
    });
  return stripe;
}

let supabaseAdmin: SupabaseClient | null = null;
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return supabaseAdmin;
}

export function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new HttpError(401, "Sign in is required.");
  return match[1];
}

export function authLookupHttpError(error: { status?: number }) {
  if (error.status === 400 || error.status === 401 || error.status === 403)
    return new HttpError(401, "Your session is invalid or expired.");
  return new HttpError(502, "Authentication could not be verified.");
}

export async function requireUser(request: Request): Promise<User> {
  const token = bearerToken(request);
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error) throw authLookupHttpError(error);
  if (!data.user)
    throw new HttpError(401, "Your session is invalid or expired.");
  return data.user;
}

const COACH_ROLES = new Set(["owner", "coach", "admin"]);

export function userHasCoachRole(user: Pick<User, "app_metadata">) {
  return COACH_ROLES.has(String(user.app_metadata?.role ?? "").toLowerCase());
}

export async function requireCoach(request: Request): Promise<User> {
  const user = await requireUser(request);
  if (!userHasCoachRole(user))
    throw new HttpError(403, "Coach access is required.");
  return user;
}

export type ClientProfileRecord = {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  primary_goal: string | null;
  current_weight: number | null;
  goal_weight: number | null;
  week_number: number;
  total_weeks: number;
  stripe_customer_id: string | null;
  account_invited_at: string | null;
  account_setup_completed_at: string | null;
};

export function clientProfileIsReady(
  profile:
    Pick<ClientProfileRecord, "account_setup_completed_at"> | null | undefined
) {
  return Boolean(profile?.account_setup_completed_at);
}

export async function loadClientProfile(userId: string) {
  const result = await getSupabaseAdmin()
    .from("client_profiles")
    .select(
      "id,user_id,first_name,last_name,email,primary_goal,current_weight,goal_weight,week_number,total_weeks,stripe_customer_id,account_invited_at,account_setup_completed_at"
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (result.error)
    throw new HttpError(500, "Client profile could not be loaded.");
  return (result.data as ClientProfileRecord | null) ?? null;
}

export async function getClientProfileContext(request: Request) {
  const user = await requireUser(request);
  const profile = await loadClientProfile(user.id);
  return { user, profile };
}

export async function requireClientProfile(request: Request) {
  const { user, profile } = await getClientProfileContext(request);
  if (!profile)
    throw new HttpError(404, "No client profile is linked to this account.");
  if (!clientProfileIsReady(profile))
    throw new HttpError(
      403,
      "Finish account setup before opening the client portal."
    );
  return { user, profile };
}

export function siteUrl() {
  const configured = requiredEnv("SITE_URL");
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new HttpError(503, "SITE_URL must be a valid absolute URL.");
  }
  const local =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:"))
    throw new HttpError(503, "SITE_URL must use HTTPS.");
  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "")
  )
    throw new HttpError(503, "SITE_URL must be an origin without a path.");
  return parsed.origin;
}

export function billingPortalConfigurationId() {
  const value = requiredEnv("STRIPE_BILLING_PORTAL_CONFIGURATION_ID");
  if (!/^bpc_[A-Za-z0-9]+$/.test(value))
    throw new HttpError(
      503,
      "STRIPE_BILLING_PORTAL_CONFIGURATION_ID is not valid."
    );
  return value;
}

export function centsToUnits(value: number | null | undefined) {
  return typeof value === "number" ? value / 100 : 0;
}

export function packageNameFromSession(session: Stripe.Checkout.Session) {
  const metadataName = session.metadata?.package_name?.trim();
  if (metadataName) return metadataName.slice(0, 160);
  const firstLine = session.line_items?.data[0];
  const product = firstLine?.price?.product;
  if (
    product &&
    typeof product !== "string" &&
    !product.deleted &&
    product.name
  )
    return product.name.slice(0, 160);
  return "Coach Murray Coaching";
}

export function paymentLinkIdFromSession(session: Stripe.Checkout.Session) {
  const paymentLink = session.payment_link;
  if (typeof paymentLink === "string") return paymentLink;
  return paymentLink?.id ?? "";
}

export function approvedCheckout(session: Stripe.Checkout.Session) {
  const allowedPaymentLinks = requiredEnv("STRIPE_ALLOWED_PAYMENT_LINK_IDS")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
  if (!allowedPaymentLinks.length)
    throw new HttpError(
      503,
      "STRIPE_ALLOWED_PAYMENT_LINK_IDS is not configured."
    );
  const approvedMode =
    session.mode === "payment" || session.mode === "subscription";
  return (
    approvedMode &&
    session.status === "complete" &&
    session.payment_status === "paid" &&
    allowedPaymentLinks.includes(paymentLinkIdFromSession(session))
  );
}

export function checkoutLookupHttpError(error: unknown) {
  const stripeError = error as { code?: string; statusCode?: number };
  if (stripeError.code === "resource_missing" || stripeError.statusCode === 404)
    return new HttpError(404, "Checkout session was not found.");
  if (stripeError.statusCode === 401 || stripeError.statusCode === 403)
    return new HttpError(503, "Stripe credentials could not be verified.");
  return new HttpError(502, "Stripe could not verify checkout right now.");
}

export async function verifiedCheckout(sessionId: string) {
  const stripeClient = getStripe();
  let session: Stripe.Checkout.Session;
  try {
    session = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price.product"],
    });
  } catch (error) {
    throw checkoutLookupHttpError(error);
  }
  if (!approvedCheckout(session))
    throw new HttpError(
      403,
      "Checkout is not a completed payment for an approved coaching offer."
    );
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email)
    throw new HttpError(
      422,
      "The checkout session does not include a customer email."
    );
  return {
    session,
    email: email.toLowerCase(),
    packageName: packageNameFromSession(session),
  };
}
