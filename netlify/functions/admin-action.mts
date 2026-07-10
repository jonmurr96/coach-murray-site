import type { Context } from "@netlify/functions";
import { adminActionSchema } from "../../shared/contracts";
import {
  assertTrustedOrigin,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  readJson,
  requireCoach,
  requireMethod,
} from "./_shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    assertTrustedOrigin(request);
    const action = adminActionSchema.safeParse(await readJson(request, 20_000));
    if (!action.success)
      throw new HttpError(
        422,
        action.error.issues[0]?.message ?? "The request is incomplete."
      );
    const coach = await requireCoach(request);
    const supabase = getSupabaseAdmin();
    if (action.data.kind === "send-message") {
      const { error } = await supabase
        .from("messages")
        .insert({
          client_id: action.data.clientId,
          sender_role: "coach",
          sender_user_id: coach.id,
          body: action.data.body,
        });
      if (error) throw new HttpError(500, "The message could not be sent.");
    } else if (action.data.kind === "publish-program") {
      const { error } = await supabase.rpc("publish_client_program", {
        p_client_id: action.data.clientId,
        p_coach_user_id: coach.id,
        p_title: action.data.title,
        p_summary: action.data.summary,
        p_weeks: action.data.weeks,
      });
      if (error)
        throw new HttpError(500, "The program could not be published.");
    } else {
      const { error } = await supabase
        .from("leads")
        .update({
          status: action.data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", action.data.leadId);
      if (error) throw new HttpError(500, "Lead status could not be updated.");
    }
    return json(200, { saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}
