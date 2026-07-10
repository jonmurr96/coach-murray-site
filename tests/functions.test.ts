import { describe, expect, it } from "vitest";
import verifyCheckout from "../netlify/functions/verify-checkout.mts";
import submitOnboarding from "../netlify/functions/submit-onboarding.mts";
import clientAction from "../netlify/functions/client-action.mts";
import adminData from "../netlify/functions/admin-data.mts";
import billingPortal from "../netlify/functions/billing-portal.mts";
import stripeWebhook from "../netlify/functions/stripe-webhook.mts";

const context = {} as never;

describe("Netlify function boundaries", () => {
  it("rejects malformed checkout IDs before contacting Stripe", async () => {
    const response = await verifyCheckout(
      new Request(
        "https://coach.example/.netlify/functions/verify-checkout?session_id=forged"
      ),
      context
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A valid checkout session is required.",
    });
  });

  it("reports missing Stripe configuration instead of a false 404 or signature error", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const checkoutResponse = await verifyCheckout(
      new Request(
        "https://coach.example/.netlify/functions/verify-checkout?session_id=cs_test_1234567890abcdefghijkl"
      ),
      context
    );
    const webhookResponse = await stripeWebhook(
      new Request("https://coach.example/.netlify/functions/stripe-webhook", {
        method: "POST",
        headers: { "stripe-signature": "test-signature" },
        body: "{}",
      }),
      context
    );
    expect(checkoutResponse.status).toBe(503);
    expect(webhookResponse.status).toBe(503);
    await expect(checkoutResponse.json()).resolves.toEqual({
      error: "STRIPE_SECRET_KEY is not configured.",
    });
    await expect(webhookResponse.json()).resolves.toEqual({
      error: "STRIPE_SECRET_KEY is not configured.",
    });
  });

  it("enforces mutation methods", async () => {
    const response = await submitOnboarding(
      new Request("https://coach.example/.netlify/functions/submit-onboarding"),
      context
    );
    expect(response.status).toBe(405);
  });

  it("requires an authenticated user for client mutations", async () => {
    const response = await clientAction(
      new Request("https://coach.example/.netlify/functions/client-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://coach.example",
        },
        body: JSON.stringify({
          kind: "message",
          body: "Question for my coach",
        }),
      }),
      context
    );
    expect(response.status).toBe(401);
  });

  it("requires authentication for Coach OS and billing", async () => {
    const adminResponse = await adminData(
      new Request("https://coach.example/.netlify/functions/admin-data"),
      context
    );
    const billingResponse = await billingPortal(
      new Request("https://coach.example/.netlify/functions/billing-portal", {
        method: "POST",
        headers: { Origin: "https://coach.example" },
        body: "{}",
      }),
      context
    );
    expect(adminResponse.status).toBe(401);
    expect(billingResponse.status).toBe(401);
  });
});
