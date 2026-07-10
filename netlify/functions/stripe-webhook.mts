import type { Context } from "@netlify/functions";
import type Stripe from "stripe";
import {
  env,
  errorResponse,
  getStripe,
  getSupabaseAdmin,
  HttpError,
  json,
  packageNameFromSession,
  requireMethod,
  requiredEnv,
} from "./_shared.mts";

async function recordCheckout(session: Stripe.Checkout.Session) {
  const email = session.customer_details?.email ?? session.customer_email;
  if (!email) throw new HttpError(422, "Checkout customer email is missing.");
  const { error } = await getSupabaseAdmin()
    .from("purchases")
    .upsert(
      {
        stripe_checkout_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : null,
        email: email.toLowerCase(),
        package_name: packageNameFromSession(session),
        amount_total: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        payment_status: session.payment_status,
        checkout_status: session.status,
        purchased_at: new Date(
          (session.created ?? Math.floor(Date.now() / 1000)) * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_checkout_session_id" }
    );
  if (error) throw new HttpError(500, "Purchase could not be recorded.");
}

async function updateSubscription(subscription: Stripe.Subscription) {
  const { error } = await getSupabaseAdmin()
    .from("purchases")
    .update({
      subscription_status: subscription.status,
      current_period_end: new Date(
        subscription.items.data[0]?.current_period_end
          ? subscription.items.data[0].current_period_end * 1000
          : Date.now()
      ).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
  if (error)
    throw new HttpError(500, "Subscription status could not be recorded.");
}

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    const signature = request.headers.get("stripe-signature");
    if (!signature) throw new HttpError(400, "Stripe signature is missing.");
    const payload = await request.text();
    let event: Stripe.Event;
    try {
      event = await getStripe().webhooks.constructEventAsync(
        payload,
        signature,
        requiredEnv("STRIPE_WEBHOOK_SECRET")
      );
    } catch {
      throw new HttpError(400, "Stripe signature is invalid.");
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      await recordCheckout(event.data.object as Stripe.Checkout.Session);
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await updateSubscription(event.data.object as Stripe.Subscription);
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSubscription =
        invoice.parent?.subscription_details?.subscription;
      const subscriptionId =
        typeof parentSubscription === "string"
          ? parentSubscription
          : parentSubscription?.id;
      if (subscriptionId) {
        await getSupabaseAdmin()
          .from("purchases")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (env("NODE_ENV") !== "test")
      console.info("Processed Stripe event", event.id, event.type);
    return json(200, { received: true });
  } catch (error) {
    return errorResponse(error);
  }
}
