import type { Context } from "@netlify/functions";
import { clientActionSchema } from "../../shared/contracts";
import {
  assertTrustedOrigin,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  readJson,
  requireClientProfile,
  requireMethod,
} from "../lib/shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "POST");
    assertTrustedOrigin(request);
    const action = clientActionSchema.safeParse(
      await readJson(request, 20_000)
    );
    if (!action.success)
      throw new HttpError(
        422,
        action.error.issues[0]?.message ?? "The request is incomplete."
      );
    const { user, profile } = await requireClientProfile(request);
    const supabase = getSupabaseAdmin();
    if (action.data.kind === "message") {
      const { error } = await supabase.from("messages").insert({
        client_id: profile.id,
        sender_role: "client",
        sender_user_id: user.id,
        body: action.data.body,
      });
      if (error) throw new HttpError(500, "Your message could not be saved.");
    } else if (action.data.kind === "check-in") {
      const { error } = await supabase.rpc("submit_client_check_in", {
        p_client_id: profile.id,
        p_weight: action.data.weight ?? null,
        p_energy: action.data.energy,
        p_adherence: action.data.adherence,
        p_wins: action.data.wins,
        p_challenges: action.data.challenges,
      });
      if (error) throw new HttpError(500, "Your check-in could not be saved.");
    } else if (action.data.kind === "update-workout") {
      const { data, error } = await supabase.rpc(
        "update_client_workout_status",
        {
          p_client_id: profile.id,
          p_workout_id: action.data.workoutId,
          p_status: action.data.status,
        }
      );
      if (error) throw new HttpError(500, "Workout status could not be saved.");
      if (!data) throw new HttpError(404, "Workout was not found.");
    } else {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("client_id", profile.id)
        .eq("sender_role", "coach")
        .is("read_at", null);
      if (error)
        throw new HttpError(500, "Message read status could not be saved.");
    }
    return json(200, { saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}
