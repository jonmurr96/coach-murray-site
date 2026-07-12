import type { Context } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { adminActionSchema, type AdminAction } from "../../shared/contracts";
import {
  assertTrustedOrigin,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  readJson,
  requireCoach,
  requireMethod,
  siteUrl,
} from "../lib/shared.mts";

export const CLIENT_INVITE_COOLDOWN_MS = 15 * 60 * 1_000;

type ClientInviteRecord = {
  id: string;
  email: string;
  account_setup_completed_at: string | null;
  account_invited_at: string | null;
};

type ClientInviteIntake = { purchase_id: string };
type ClientInvitePurchase = {
  id: string;
  payment_status: string;
  checkout_status: string;
};

function inviteDeliveryError(error: {
  code?: string;
  message?: string;
  status?: number;
}) {
  const code = String(error.code ?? "").toLowerCase();
  const message = String(error.message ?? "");
  if (error.status === 429 || /rate.?limit|too many/i.test(message))
    return new HttpError(
      429,
      "Account invitations are temporarily rate-limited. Wait before retrying."
    );
  if (
    ["email_exists", "user_already_exists"].includes(code) ||
    /already|registered|exists/i.test(message)
  )
    return new HttpError(
      409,
      "An account already exists for this email. Ask the client to sign in or reset their password."
    );
  return new HttpError(
    502,
    "The account setup invitation could not be delivered. Try again later."
  );
}

function resourceWriteError(error: { code?: string }) {
  if (error.code === "23503")
    return new HttpError(404, "The selected client or resource was not found.");
  if (error.code === "23514" || error.code === "23502")
    return new HttpError(422, "The resource details are invalid.");
  return new HttpError(500, "The resource change could not be saved.");
}

type CreateResourceAction = Extract<AdminAction, { kind: "create-resource" }>;
type UpdateResourceAction = Extract<AdminAction, { kind: "update-resource" }>;

export async function createLibraryResource(
  supabase: SupabaseClient,
  resource: CreateResourceAction["resource"]
) {
  const { data, error } = await supabase
    .from("library_resources")
    .insert(resource)
    .select("id")
    .single();
  if (error) throw resourceWriteError(error);
  if (!data)
    throw new HttpError(500, "The created resource was not confirmed.");
  return data.id as string;
}

export async function updateLibraryResource(
  supabase: SupabaseClient,
  action: UpdateResourceAction
) {
  const { data, error } = await supabase
    .from("library_resources")
    .update(action.resource)
    .eq("id", action.resourceId)
    .eq("updated_at", action.expectedUpdatedAt)
    .select("id")
    .maybeSingle();
  if (error) throw resourceWriteError(error);
  if (!data)
    throw new HttpError(
      409,
      "This resource changed after you opened it. Refresh and try again."
    );
  return data.id as string;
}

export async function deleteLibraryResource(
  supabase: SupabaseClient,
  resourceId: string
) {
  const { data, error } = await supabase
    .from("library_resources")
    .delete()
    .eq("id", resourceId)
    .select("id")
    .maybeSingle();
  if (error) throw resourceWriteError(error);
  if (!data) throw new HttpError(404, "The resource was not found.");
}

export async function setLibraryResourceAssignment(
  supabase: SupabaseClient,
  resourceId: string,
  clientId: string,
  assigned: boolean
) {
  if (assigned) {
    const { data, error } = await supabase
      .from("client_resources")
      .upsert(
        { client_id: clientId, resource_id: resourceId },
        { onConflict: "client_id,resource_id" }
      )
      .select("resource_id")
      .single();
    if (error) throw resourceWriteError(error);
    if (!data)
      throw new HttpError(500, "The resource assignment was not confirmed.");
    return;
  }

  const { error } = await supabase
    .from("client_resources")
    .delete()
    .eq("client_id", clientId)
    .eq("resource_id", resourceId);
  if (error) throw resourceWriteError(error);
}

export function clientInviteCooldownRemaining(
  invitedAt: string | null,
  now = new Date()
) {
  if (!invitedAt) return 0;
  const timestamp = Date.parse(invitedAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, timestamp + CLIENT_INVITE_COOLDOWN_MS - now.getTime());
}

export async function resendClientSetupInvite(
  supabase: SupabaseClient,
  clientId: string,
  portalOrigin: string,
  now = new Date()
) {
  const profileResult = await supabase
    .from("client_profiles")
    .select("id,email,account_setup_completed_at,account_invited_at")
    .eq("id", clientId)
    .maybeSingle<ClientInviteRecord>();

  if (profileResult.error)
    throw new HttpError(500, "Client account setup state could not be loaded.");
  const profile = profileResult.data;
  if (!profile) throw new HttpError(404, "Client record was not found.");
  if (profile.account_setup_completed_at)
    throw new HttpError(
      409,
      "This client has already completed account setup."
    );

  const intakeResult = await supabase
    .from("intake_submissions")
    .select("purchase_id")
    .eq("client_id", clientId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle<ClientInviteIntake>();
  if (intakeResult.error)
    throw new HttpError(500, "Verified client onboarding could not be loaded.");
  if (!intakeResult.data)
    throw new HttpError(
      409,
      "Account setup is available only after verified onboarding is complete."
    );

  const purchaseResult = await supabase
    .from("purchases")
    .select("id,payment_status,checkout_status")
    .eq("id", intakeResult.data.purchase_id)
    .eq("client_id", clientId)
    .maybeSingle<ClientInvitePurchase>();
  if (purchaseResult.error)
    throw new HttpError(500, "Verified client payment could not be loaded.");
  if (
    !purchaseResult.data ||
    purchaseResult.data.payment_status !== "paid" ||
    purchaseResult.data.checkout_status !== "complete"
  )
    throw new HttpError(
      409,
      "Account setup is available only after a verified payment is complete."
    );

  const emailResult = z
    .string()
    .trim()
    .email()
    .max(254)
    .safeParse(profile.email);
  if (!emailResult.success)
    throw new HttpError(
      500,
      "The client record does not have a valid email address."
    );

  const cooldownRemaining = clientInviteCooldownRemaining(
    profile.account_invited_at,
    now
  );
  if (cooldownRemaining > 0) {
    const minutes = Math.max(1, Math.ceil(cooldownRemaining / 60_000));
    throw new HttpError(
      429,
      `A setup invitation was sent recently. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
    );
  }

  const invitedAt = now.toISOString();
  let claimQuery = supabase
    .from("client_profiles")
    .update({ account_invited_at: invitedAt })
    .eq("id", clientId)
    .is("account_setup_completed_at", null);
  claimQuery = profile.account_invited_at
    ? claimQuery.eq("account_invited_at", profile.account_invited_at)
    : claimQuery.is("account_invited_at", null);
  const claimResult = await claimQuery.select("id").maybeSingle();
  if (claimResult.error)
    throw new HttpError(
      500,
      "The invitation could not be reserved. No setup email was sent."
    );
  if (!claimResult.data)
    throw new HttpError(
      409,
      "The client invitation state changed or another invitation is already in progress. Refresh before trying again."
    );

  const releaseClaim = async () => {
    try {
      await supabase
        .from("client_profiles")
        .update({ account_invited_at: profile.account_invited_at })
        .eq("id", clientId)
        .eq("account_invited_at", invitedAt)
        .is("account_setup_completed_at", null)
        .select("id")
        .maybeSingle();
    } catch {
      // A conservative cooldown is safer than allowing duplicate delivery.
    }
  };

  let invite: Awaited<
    ReturnType<SupabaseClient["auth"]["admin"]["inviteUserByEmail"]>
  >;
  try {
    invite = await supabase.auth.admin.inviteUserByEmail(emailResult.data, {
      redirectTo: `${portalOrigin}/account/confirm`,
    });
  } catch {
    await releaseClaim();
    throw new HttpError(
      502,
      "The account setup invitation service is unavailable. Try again later."
    );
  }
  if (invite.error) {
    await releaseClaim();
    throw inviteDeliveryError(invite.error);
  }
  if (!invite.data.user) {
    await releaseClaim();
    throw new HttpError(
      502,
      "The account setup invitation was not confirmed by the authentication service."
    );
  }

  return { invitedAt };
}

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
      const { data, error } = await supabase
        .from("messages")
        .insert({
          client_id: action.data.clientId,
          sender_role: "coach",
          sender_user_id: coach.id,
          body: action.data.body,
        })
        .select("id")
        .single();
      if (error) throw new HttpError(500, "The message could not be sent.");
      if (!data) throw new HttpError(500, "The message was not confirmed.");
    } else if (action.data.kind === "publish-program") {
      const { data, error } = await supabase.rpc("publish_client_program", {
        p_client_id: action.data.clientId,
        p_coach_user_id: coach.id,
        p_title: action.data.title,
        p_summary: action.data.summary,
        p_weeks: action.data.weeks,
        p_workouts: action.data.workouts,
        p_nutrition: action.data.nutrition,
      });
      if (error)
        throw new HttpError(500, "The program could not be published.");
      if (!data)
        throw new HttpError(500, "The published program was not confirmed.");
    } else if (action.data.kind === "update-lead") {
      const { data, error } = await supabase
        .from("leads")
        .update({
          status: action.data.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", action.data.leadId)
        .select("id")
        .maybeSingle();
      if (error) throw new HttpError(500, "Lead status could not be updated.");
      if (!data) throw new HttpError(404, "Lead was not found.");
    } else if (action.data.kind === "review-check-in") {
      const { data, error } = await supabase
        .from("check_ins")
        .update({ reviewed_at: new Date().toISOString() })
        .eq("id", action.data.checkInId)
        .select("id")
        .maybeSingle();
      if (error)
        throw new HttpError(500, "Check-in review could not be saved.");
      if (!data) throw new HttpError(404, "Check-in was not found.");
    } else if (action.data.kind === "resend-client-invite") {
      const invitation = await resendClientSetupInvite(
        supabase,
        action.data.clientId,
        siteUrl()
      );
      return json(200, { saved: true, ...invitation });
    } else if (action.data.kind === "create-resource") {
      const resourceId = await createLibraryResource(
        supabase,
        action.data.resource
      );
      return json(200, { saved: true, resourceId });
    } else if (action.data.kind === "update-resource") {
      const resourceId = await updateLibraryResource(supabase, action.data);
      return json(200, { saved: true, resourceId });
    } else if (action.data.kind === "delete-resource") {
      await deleteLibraryResource(supabase, action.data.resourceId);
      return json(200, { saved: true });
    } else if (action.data.kind === "set-resource-assignment") {
      await setLibraryResourceAssignment(
        supabase,
        action.data.resourceId,
        action.data.clientId,
        action.data.assigned
      );
      return json(200, { saved: true });
    } else {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_role", "client")
        .is("read_at", null);
      if (error)
        throw new HttpError(500, "Inbox read status could not be saved.");
    }
    return json(200, { saved: true });
  } catch (error) {
    return errorResponse(error);
  }
}
