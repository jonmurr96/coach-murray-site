import { describe, expect, it } from "vitest";
import {
  expectedCheckoutRedirect,
  extractStripeUrls,
  isConfigured,
  parseEnv,
  paymentLinkIsProductionReady,
  releaseSummary,
  senderDomain,
} from "../scripts/release-readiness.mjs";

describe("release readiness helpers", () => {
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
