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
    const { profile } = await requireClientProfile(request);
    const supabase = getSupabaseAdmin();
    if (action.data.kind === "message") {
      const { error } = await supabase
        .from("messages")
        .insert({
          client_id: profile.id,
          sender_role: "client",
          body: action.data.body,
        });
      if (error) throw new HttpError(500, "Your message could not be saved.");
    } else {
      const { error } = await supabase.rpc("submit_client_check_in", {
        p_client_id: profile.id,
        p_weight: action.data.weight ?? null,
        p_energy: action.data.energy,
        p_adherence: action.data.adherence,
        p_wins: action.data.wins,
        p_challenges: action.data.challenges,
      });
      if (error) throw new HttpError(500, "Your check-in could not be saved.");
    }
    return json(200, { saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}
