import type { Context } from "@netlify/functions";
import { Resend } from "resend";
import { leadSubmissionSchema } from "../../shared/contracts";
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
} from "../lib/shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    assertTrustedOrigin(request);
    const parsed = leadSubmissionSchema.safeParse(
      await readJson(request, 20_000)
    );
    if (!parsed.success)
      throw new HttpError(
        422,
        parsed.error.issues[0]?.message ?? "The form is incomplete."
      );
    if (parsed.data.website) throw new HttpError(400, "Submission rejected.");
    const { error } = await getSupabaseAdmin().rpc("record_lead_submission", {
      p_first_name: parsed.data.firstName,
      p_last_name: parsed.data.lastName,
      p_email: parsed.data.email,
      p_source: parsed.data.source,
      p_kind: parsed.data.kind,
      p_marketing_consent: parsed.data.marketingConsent,
      p_metadata: { ...parsed.data.metadata, kind: parsed.data.kind },
    });
    if (error) {
      if (error.code === "P0001" && /lead_rate_limit/i.test(error.message))
        throw new HttpError(
          429,
          "Too many recent submissions. Please wait before trying again."
        );
      throw new HttpError(500, "Your information could not be saved.");
    }

    const resendKey = env("RESEND_API_KEY");
    const from = env("TRANSACTIONAL_FROM_EMAIL");
    const coachEmail = env("ONBOARDING_NOTIFY_EMAIL");
    let emailSent = false;
    try {
      if (resendKey && from) {
        const resend = new Resend(resendKey);
        if (parsed.data.kind === "quiz" && parsed.data.marketingConsent) {
          const recommendation =
            parsed.data.metadata.recommended_package ?? "coaching";
          const delivery = await resend.emails.send({
            from,
            to: parsed.data.email,
            subject: "Your Coach Murray recommendation",
            text: `Hi ${parsed.data.firstName},\n\nYour coaching quiz recommendation is ${recommendation}. Review the package details before purchasing, and use the free cutting blueprint here: ${siteUrl()}/5-day-cutting-blueprint.pdf\n\nCoach Murray`,
          });
          emailSent = !delivery.error;
        } else if (parsed.data.kind === "application" && coachEmail) {
          const delivery = await resend.emails.send({
            from,
            to: coachEmail,
            subject:
              `New coaching application: ${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
            text:
              `${parsed.data.firstName} ${parsed.data.lastName}`.trim() +
              ` (${parsed.data.email}) submitted a coaching application from ${parsed.data.source}. Review it in Coach OS.`,
          });
          emailSent = !delivery.error;
        }
      }
    } catch (emailError) {
      console.error(
        "Lead email delivery failed",
        emailError instanceof Error ? emailError.message : "Unknown error"
      );
    }
    return json(200, { saved: true, emailSent });
  } catch (error) {
    return errorResponse(error);
  }
}
