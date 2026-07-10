import type { Context } from "@netlify/functions";
import { leadSubmissionSchema } from "../../shared/contracts";
import {
  assertTrustedOrigin,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  readJson,
  requireMethod,
} from "./_shared.mts";

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
    const { error } = await getSupabaseAdmin()
      .from("leads")
      .upsert(
        {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName || null,
          email: parsed.data.email,
          source: parsed.data.source,
          marketing_consent: parsed.data.marketingConsent,
          consent_at: parsed.data.marketingConsent
            ? new Date().toISOString()
            : null,
          metadata: { kind: parsed.data.kind, ...parsed.data.metadata },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    if (error) throw new HttpError(500, "Your information could not be saved.");
    return json(200, { saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}
