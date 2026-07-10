import type { Context } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  sha256Hex,
  siteUrl,
  verifiedCheckout,
} from "../lib/shared.mts";

export type ClientAccountState =
  "existing" | "invited" | "setup-pending" | "invite-failed";

export async function ensureClientAccountInvitation(
  supabase: SupabaseClient,
  input: {
    clientId: string;
    email: string;
    portalOrigin: string;
    intakeCreated: boolean;
    portalReady: boolean;
    now?: Date;
  }
): Promise<{ accountState: ClientAccountState; warnings: string[] }> {
  if (input.portalReady) return { accountState: "existing", warnings: [] };
  if (!input.intakeCreated)
    return {
      accountState: "setup-pending",
      warnings: [
        "Your intake was already saved. Use the original account invitation, or contact Coach Murray for a new one.",
      ],
    };

  const invitedAt = (input.now ?? new Date()).toISOString();
  let claimed = false;
  try {
    const claim = await supabase
      .from("client_profiles")
      .update({ account_invited_at: invitedAt })
      .eq("id", input.clientId)
      .is("account_setup_completed_at", null)
      .is("account_invited_at", null)
      .select("id")
      .maybeSingle();
    if (claim.error) throw new Error("Invitation state could not be reserved.");
    if (!claim.data)
      return {
        accountState: "setup-pending",
        warnings: [
          "An account invitation has already been sent. Use that email, or contact Coach Murray for a new one.",
        ],
      };
    claimed = true;

    const invite = await supabase.auth.admin.inviteUserByEmail(input.email, {
      redirectTo: `${input.portalOrigin}/account/setup`,
    });
    if (!invite.error) return { accountState: "invited", warnings: [] };

    await supabase
      .from("client_profiles")
      .update({ account_invited_at: null })
      .eq("id", input.clientId)
      .eq("account_invited_at", invitedAt)
      .is("account_setup_completed_at", null);
    claimed = false;
    const alreadyRegistered =
      ["email_exists", "user_already_exists"].includes(
        String(invite.error.code ?? "")
      ) || /already|registered|exists/i.test(invite.error.message);
    return {
      accountState: alreadyRegistered ? "existing" : "invite-failed",
      warnings: [
        alreadyRegistered
          ? "An account already exists for this email. Sign in or reset its password."
          : "Your intake is saved, but the account invitation could not be sent. Contact Coach Murray.",
      ],
    };
  } catch {
    if (claimed) {
      try {
        await supabase
          .from("client_profiles")
          .update({ account_invited_at: null })
          .eq("id", input.clientId)
          .eq("account_invited_at", invitedAt)
          .is("account_setup_completed_at", null);
      } catch {
        // A conservative stale cooldown is safer than duplicate delivery.
      }
    }
    return {
      accountState: "invite-failed",
      warnings: [
        "Your intake is saved, but the account invitation could not be sent. Contact Coach Murray.",
      ],
    };
  }
}

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
    const portalOrigin = siteUrl();
    if (email !== parsed.data.email)
      throw new HttpError(403, "Use the email address from checkout.");

    const {
      checkoutSessionId: _checkoutSessionId,
      website: _website,
      ...intake
    } = parsed.data;
    const signatureEvidence = intake.signatureData
      ? intake.signatureData
      : `typed:${intake.typedSignature}`;
    const signatureSha256 = await sha256Hex(signatureEvidence);
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
        p_terms_version: intake.termsVersion,
        p_signature_sha256: signatureSha256,
      }
    );
    if (error)
      throw new HttpError(
        500,
        "Your intake could not be saved. Nothing was marked complete."
      );

    const result = Array.isArray(completion) ? completion[0] : completion;
    if (!result?.client_id)
      throw new HttpError(
        500,
        "Your intake was saved without a client reference. Contact support."
      );
    const intakeCreated = Boolean(result?.intake_created);
    // The RPC identifies the one immutable intake creator. The profile update
    // then acts as an atomic delivery claim, so retries and concurrent paid
    // sessions cannot send duplicate account invitations.
    const invitation = await ensureClientAccountInvitation(supabase, {
      clientId: result.client_id,
      email,
      portalOrigin,
      intakeCreated,
      portalReady: Boolean(result.portal_ready),
    });
    const { accountState } = invitation;
    const warnings = [...invitation.warnings];

    const resendKey = env("RESEND_API_KEY");
    const notifyTo = env("ONBOARDING_NOTIFY_EMAIL");
    const from = env("TRANSACTIONAL_FROM_EMAIL");
    try {
      if (intakeCreated && resendKey && from && notifyTo) {
        const coachDelivery = await new Resend(resendKey).emails.send({
          from,
          to: notifyTo,
          subject: `New verified intake: ${intake.firstName} ${intake.lastName}`,
          text: `${intake.firstName} ${intake.lastName} (${email}) completed verified onboarding for ${packageName}. Review the secure Coach OS intake record; sensitive answers are intentionally excluded from this email.`,
        });
        if (coachDelivery.error)
          warnings.push(
            "Coach notification email could not be delivered, but the intake is saved."
          );
      } else if (intakeCreated) {
        warnings.push(
          "Coach notification email is not configured, but the intake is saved."
        );
      }
    } catch {
      warnings.push(
        "Coach notification email is temporarily unavailable, but the intake is saved."
      );
    }

    return json(200, {
      saved: true,
      accountState,
      email,
      warnings,
      alreadySaved: !intakeCreated,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
