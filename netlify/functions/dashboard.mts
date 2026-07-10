import type { Context } from "@netlify/functions";
import type { PortalPayload } from "../../shared/contracts";
import {
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  requireClientProfile,
  requireMethod,
} from "../lib/shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    const { profile } = await requireClientProfile(request);
    const supabase = getSupabaseAdmin();
    const [
      programResult,
      workoutResult,
      nutritionResult,
      checkInResult,
      messageResult,
      progressResult,
      libraryResult,
      purchaseResult,
    ] = await Promise.all([
      supabase
        .from("programs")
        .select("id,title,summary,status,weeks")
        .eq("client_id", profile.id)
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("workouts")
        .select("id,title,scheduled_day,duration_minutes,status")
        .eq("client_id", profile.id)
        .order("sort_order")
        .limit(20),
      supabase
        .from("nutrition_plans")
        .select("calories,protein_grams,carb_grams,fat_grams,notes")
        .eq("client_id", profile.id)
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("check_ins")
        .select("id,submitted_at,adherence,energy,weight")
        .eq("client_id", profile.id)
        .order("submitted_at", { ascending: false })
        .limit(12),
      supabase
        .from("messages")
        .select("id,sender_role,body,sent_at,read_at")
        .eq("client_id", profile.id)
        .order("sent_at", { ascending: true })
        .limit(100),
      supabase
        .from("progress_entries")
        .select("recorded_at,weight,adherence")
        .eq("client_id", profile.id)
        .order("recorded_at")
        .limit(52),
      supabase
        .from("client_resources")
        .select("resource:library_resources(id,title,kind,url)")
        .eq("client_id", profile.id)
        .limit(50),
      supabase
        .from("purchases")
        .select("subscription_status,package_name,current_period_end")
        .eq("email", profile.email)
        .order("purchased_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const failure = [
      programResult,
      workoutResult,
      nutritionResult,
      checkInResult,
      messageResult,
      progressResult,
      libraryResult,
      purchaseResult,
    ].find(result => result.error);
    if (failure?.error)
      throw new HttpError(500, "Dashboard data could not be loaded.");

    const resources = (libraryResult.data ?? []).flatMap(row => {
      const resource = row.resource as unknown as {
        id: string;
        title: string;
        kind: string;
        url?: string;
      } | null;
      return resource ? [resource] : [];
    });
    const payload: PortalPayload = {
      preview: false,
      profile: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        primaryGoal: profile.primary_goal ?? "Build consistency",
        weekNumber: profile.week_number ?? 0,
        totalWeeks: profile.total_weeks ?? 12,
        currentWeight: profile.current_weight ?? undefined,
        goalWeight: profile.goal_weight ?? undefined,
      },
      program: programResult.data
        ? {
            id: programResult.data.id,
            title: programResult.data.title,
            summary: programResult.data.summary ?? "",
            status: programResult.data.status,
            weeks: programResult.data.weeks,
          }
        : null,
      workouts: (workoutResult.data ?? []).map(row => ({
        id: row.id,
        title: row.title,
        day: row.scheduled_day ?? "Assigned",
        durationMinutes: row.duration_minutes ?? 0,
        status: row.status,
      })),
      nutrition: nutritionResult.data
        ? {
            calories: nutritionResult.data.calories,
            protein: nutritionResult.data.protein_grams,
            carbs: nutritionResult.data.carb_grams,
            fat: nutritionResult.data.fat_grams,
            notes: nutritionResult.data.notes ?? "",
          }
        : null,
      checkIns: (checkInResult.data ?? []).map(row => ({
        id: row.id,
        submittedAt: row.submitted_at,
        adherence: row.adherence,
        energy: row.energy,
        weight: row.weight ?? undefined,
      })),
      messages: (messageResult.data ?? []).map(row => ({
        id: row.id,
        sender: row.sender_role === "client" ? "client" : "coach",
        body: row.body,
        sentAt: row.sent_at,
        read: Boolean(row.read_at),
      })),
      progress: (progressResult.data ?? []).map(row => ({
        recordedAt: row.recorded_at,
        weight: row.weight ?? undefined,
        adherence: row.adherence ?? undefined,
      })),
      library: resources,
      subscription: purchaseResult.data
        ? {
            status: purchaseResult.data.subscription_status ?? "paid",
            packageName: purchaseResult.data.package_name,
            renewsAt: purchaseResult.data.current_period_end ?? undefined,
          }
        : null,
    };
    return json(200, payload);
  } catch (error) {
    return errorResponse(error);
  }
}
