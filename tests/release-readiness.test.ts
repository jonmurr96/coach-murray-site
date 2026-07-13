import { describe, expect, it } from "vitest";
import {
  authEmailSmtpEnabled,
  authEmailTemplatesEnabled,
  expectedCheckoutRedirect,
  extractStripeUrls,
  isConfigured,
  parseEnv,
  paymentLinkIsProductionReady,
  REQUIRED_PRIVATE_ROUTES,
  REQUIRED_TABLES,
  releaseSummary,
  senderDomain,
} from "../scripts/release-readiness.mjs";

describe("release readiness helpers", () => {
  it("checks the canonical app schema and every private account route", () => {
    expect(REQUIRED_TABLES).toEqual([
      "check_ins",
      "client_profiles",
      "client_resources",
      "intake_submissions",
      "lead_submissions",
      "leads",
      "library_resources",
      "messages",
      "nutrition_plans",
      "programs",
      "progress_entries",
      "purchases",
      "workouts",
    ]);
    expect(REQUIRED_PRIVATE_ROUTES).toContain("/account/setup");
  });

  it("parses dotenv values without treating comments as configuration", () => {
    expect(
      parseEnv('# comment\nA=one\nB="two words"\nC=three=parts\n')
    ).toEqual({ A: "one", B: "two words", C: "three=parts" });
  });

  it("extracts the four public Stripe destinations without exposing other markup", () => {
    expect(
      extractStripeUrls(`
        <button data-stripe-url="https://buy.stripe.com/one"></button>
        <button data-stripe-url='https://buy.stripe.com/two'></button>
      `)
    ).toEqual(["https://buy.stripe.com/one", "https://buy.stripe.com/two"]);
  });

  it("rejects placeholder configuration and extracts a branded sender domain", () => {
    expect(isConfigured("re_REPLACE_ME")).toBe(false);
    expect(isConfigured("Coach Murray <coaching@YOUR_VERIFIED_DOMAIN>")).toBe(
      false
    );
    expect(isConfigured("configured-value")).toBe(true);
    expect(senderDomain("Coach Murray <coaching@jonmurr.fit>")).toBe(
      "jonmurr.fit"
    );
  });

  it("requires active scanner-safe invite and recovery template configuration", () => {
    const active = `
      [auth.email.template.invite]
      subject = "Create your account"
      content_path = "./supabase/templates/invite.html"

      [auth.email.template.recovery]
      subject = "Reset your password"
      content_path = "./supabase/templates/recovery.html"
    `;
    const commented = active
      .split("\n")
      .map(line => `# ${line}`)
      .join("\n");
    expect(authEmailTemplatesEnabled(active)).toBe(true);
    expect(authEmailTemplatesEnabled(commented)).toBe(false);
  });

  it("requires active Resend SMTP configuration for the verified sender domain", () => {
    const active = `
      [auth.email.smtp]
      enabled = true
      host = "smtp.resend.com"
      port = 465
      user = "resend"
      pass = "env(RESEND_API_KEY)"
      admin_email = "coaching@jonmurr.fit"
      sender_name = "Coach Murray"
    `;
    expect(authEmailSmtpEnabled(active, "jonmurr.fit")).toBe(true);
    expect(authEmailSmtpEnabled(active, "another-domain.com")).toBe(false);
    const commented = active
      .split("\n")
      .map(line => `# ${line}`)
      .join("\n");
    expect(authEmailSmtpEnabled(commented, "jonmurr.fit")).toBe(false);
  });

  it("requires the exact post-payment redirect including the session placeholder", () => {
    const expected = expectedCheckoutRedirect();
    expect(expected).toContain("{CHECKOUT_SESSION_ID}");
    expect(
      paymentLinkIsProductionReady({
        active: true,
        after_completion: { type: "redirect", redirect: { url: expected } },
      })
    ).toBe(true);
    expect(
      paymentLinkIsProductionReady({
        active: true,
        after_completion: {
          type: "redirect",
          redirect: {
            url: "https://coach-murray.netlify.app/onboarding?package=coaching",
          },
        },
      })
    ).toBe(false);
  });

  it("only blocks checks required by the selected release phase", () => {
    const checks = [
      {
        id: "candidate",
        label: "candidate",
        ok: true,
        detail: "ready",
        requiredIn: ["candidate"],
      },
      {
        id: "production",
        label: "production",
        ok: false,
        detail: "pending",
        requiredIn: ["production"],
      },
    ];
    expect(releaseSummary(checks, "candidate")).toEqual({
      ready: true,
      blocking: [],
    });
    expect(releaseSummary(checks, "production").ready).toBe(false);
  });
});
