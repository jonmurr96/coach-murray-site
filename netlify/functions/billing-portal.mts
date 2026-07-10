import type { Context } from "@netlify/functions";
import {
  assertTrustedOrigin,
  errorResponse,
  getStripe,
  HttpError,
  json,
  requireClientProfile,
  requireMethod,
  siteUrl,
} from "../lib/shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    assertTrustedOrigin(request);
    const { profile } = await requireClientProfile(request);
    if (!profile.stripe_customer_id)
      throw new HttpError(404, "No Stripe customer is linked to this account.");
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl()}/dashboard`,
    });
    return json(200, { url: session.url });
  } catch (error) {
    return errorResponse(error);
  }
}
