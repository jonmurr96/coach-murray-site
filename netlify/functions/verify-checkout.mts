import type { Context } from "@netlify/functions";
import { checkoutSessionIdSchema } from "../../shared/contracts";
import {
  errorResponse,
  HttpError,
  json,
  requireMethod,
  verifiedCheckout,
} from "./_shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    const parsed = checkoutSessionIdSchema.safeParse(
      new URL(request.url).searchParams.get("session_id")
    );
    if (!parsed.success)
      throw new HttpError(400, "A valid checkout session is required.");
    const { email, packageName } = await verifiedCheckout(parsed.data);
    return json(200, { verified: true, email, packageName });
  } catch (error) {
    return errorResponse(error);
  }
}
