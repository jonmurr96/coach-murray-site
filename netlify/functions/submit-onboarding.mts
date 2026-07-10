import type { Context } from "@netlify/functions";
import { Resend } from "resend";
import { onboardingSchema } from "../../shared/contracts";
import {
  assertTrustedOrigin,
  env,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  readJson,
  requireMethod,
  siteUrl,
  verifiedCheckout,
} from "../lib/shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    assertTrustedOrigin(request);
    const parsed = onboardingSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        422,
        parsed.error.issues[0]?.message ?? "The intake form is incomplete."
      );
    if (parsed.data.website) throw new HttpError(400, "Submission rejected.");

    const { session, email, packageName } = await verifiedCheckout(
      parsed.data.checkoutSessionId
    );
    if (email !== parsed.data.email)
      throw new HttpError(403, "Use the email address from checkout.");

    const {
      checkoutSessionId: _checkoutSessionId,
      website: _website,
      ...intake
    } = parsed.data;
    const supabase = getSupabaseAdmin();
    const { data: completion, error } = await supabase.rpc(
      "complete_client_onboarding",
      {
        p_checkout_session_id: session.id,
        p_stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        p_stripe_subscription_id:
          typeof session.subscription === "string"
            ? session.subscription
            : null,
        p_package_name: packageName,
        p_amount_total: session.amount_total ?? 0,
        p_currency: session.currency ?? "usd",
        p_email: email,
        p_profile: {
          first_name: intake.firstName,
          last_name: intake.lastName,
          phone: intake.phone,
          primary_goal: intake.primaryGoal,
          current_weight: intake.currentWeight,
          goal_weight: intake.goalWeight,
        },
        p_intake: intake,
      }
    );
    if (error)
      throw new HttpError(
        500,
        "Your intake could not be saved. Nothing was marked complete."
      );

    const result = Array.isArray(completion) ? completion[0] : completion;
    const warnings: string[] = [];
    let portalReady = Boolean(result?.portal_ready);

    if (!portalReady) {
      const invite = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${siteUrl()}/dashboard`,
      });
      if (invite.error) {
        const alreadyRegistered = /already|registered|exists/i.test(
          invite.error.message
        );
        if (!alreadyRegistered)
          warnings.push(
            "Your secure portal invitation needs to be sent manually."
          );
      } else {
        portalReady = true;
      }
    }

    const resendKey = env("RESEND_API_KEY");
    const notifyTo = env("ONBOARDING_NOTIFY_EMAIL");
    const from = env("TRANSACTIONAL_FROM_EMAIL");
    if (resendKey && notifyTo && from) {
      const { error: emailError } = await new Resend(resendKey).emails.send({
        from,
        to: notifyTo,
        subject: `New verified intake: ${intake.firstName} ${intake.lastName}`,
        text: `${intake.firstName} ${intake.lastName} (${email}) completed verified onboarding for ${packageName}. Review the secure Coach OS intake record; sensitive answers are intentionally excluded from this email.`,
      });
      if (emailError)
        warnings.push(
          "Coach notification email could not be delivered, but the intake is saved."
        );
    } else {
      warnings.push(
        "Coach notification email is not configured, but the intake is saved."
      );
    }

    return json(200, { saved: true, portalReady, warnings });
  } catch (error) {
    return errorResponse(error);
  }
}
