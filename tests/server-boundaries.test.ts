import type Stripe from "stripe";
import { afterEach, describe, expect, it } from "vitest";
import {
  approvedCheckout,
  authLookupHttpError,
  billingPortalConfigurationId,
  checkoutLookupHttpError,
  HttpError,
  paymentLinkIdFromSession,
  siteUrl,
} from "../netlify/lib/shared.mts";

function expectHttpStatus(run: () => unknown, status: number) {
  try {
    run();
    throw new Error("Expected an HttpError");
  } catch (error) {
    expect(error).toBeInstanceOf(HttpError);
    expect((error as HttpError).status).toBe(status);
  }
}

function checkout(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: "cs_test_1234567890abcdefghijkl",
    object: "checkout.session",
    mode: "subscription",
    status: "complete",
    payment_status: "paid",
    payment_link: "plink_approved",
    ...overrides,
  } as Stripe.Checkout.Session;
}

afterEach(() => {
  delete process.env.SITE_URL;
  delete process.env.STRIPE_ALLOWED_PAYMENT_LINK_IDS;
  delete process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID;
});

describe("server configuration boundaries", () => {
  it("accepts only paid Checkout sessions from an approved Payment Link", () => {
    process.env.STRIPE_ALLOWED_PAYMENT_LINK_IDS = "plink_other, plink_approved";
    expect(approvedCheckout(checkout())).toBe(true);
    expect(
      approvedCheckout(checkout({ payment_link: "plink_unapproved" }))
    ).toBe(false);
    expect(
      approvedCheckout(checkout({ payment_status: "no_payment_required" }))
    ).toBe(false);
    expect(approvedCheckout(checkout({ mode: "setup" }))).toBe(false);
  });

  it("extracts expanded and unexpanded Payment Link identifiers", () => {
    expect(paymentLinkIdFromSession(checkout())).toBe("plink_approved");
    expect(
      paymentLinkIdFromSession(
        checkout({ payment_link: { id: "plink_expanded" } as never })
      )
    ).toBe("plink_expanded");
  });

  it("fails closed when the approved offer list is absent", () => {
    expectHttpStatus(() => approvedCheckout(checkout()), 503);
  });

  it("requires SITE_URL to be an HTTPS origin", () => {
    expectHttpStatus(() => siteUrl(), 503);
    process.env.SITE_URL = "https://coach.example/path";
    expectHttpStatus(() => siteUrl(), 503);
    process.env.SITE_URL = "https://coach.example/";
    expect(siteUrl()).toBe("https://coach.example");
    process.env.SITE_URL = "http://localhost:8888";
    expect(siteUrl()).toBe("http://localhost:8888");
  });

  it("requires a concrete Stripe Billing Portal configuration", () => {
    expectHttpStatus(() => billingPortalConfigurationId(), 503);
    process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID = "not-a-portal";
    expectHttpStatus(() => billingPortalConfigurationId(), 503);
    process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID = "bpc_liveportal123";
    expect(billingPortalConfigurationId()).toBe("bpc_liveportal123");
  });

  it("distinguishes invalid credentials from upstream outages", () => {
    expect(authLookupHttpError({ status: 401 }).status).toBe(401);
    expect(authLookupHttpError({ status: 503 }).status).toBe(502);
    expect(checkoutLookupHttpError({ code: "resource_missing" }).status).toBe(
      404
    );
    expect(checkoutLookupHttpError({ statusCode: 401 }).status).toBe(503);
    expect(checkoutLookupHttpError({ statusCode: 429 }).status).toBe(502);
  });
});
