import type { Context } from "@netlify/functions";
import type { User } from "@supabase/supabase-js";
import {
  clientProfileIsReady,
  errorResponse,
  getClientProfileContext,
  json,
  requireMethod,
  type ClientProfileRecord,
  userHasCoachRole,
} from "../lib/shared.mts";

export type SessionContextPayload = {
  authenticated: true;
  email: string;
  coach: boolean;
  client: boolean;
  clientReady: boolean;
  preferredPath: "/admin" | "/dashboard" | "/account/setup" | null;
};

export function buildSessionContext(
  user: Pick<User, "email" | "app_metadata">,
  profile:
    Pick<ClientProfileRecord, "account_setup_completed_at"> | null | undefined
): SessionContextPayload {
  const coach = userHasCoachRole(user);
  const client = Boolean(profile);
  const clientReady = clientProfileIsReady(profile);
  const preferredPath = coach
    ? "/admin"
    : clientReady
      ? "/dashboard"
      : client
        ? "/account/setup"
        : null;

  return {
    authenticated: true,
    email: user.email ?? "",
    coach,
    client,
    clientReady,
    preferredPath,
  };
}

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    const { user, profile } = await getClientProfileContext(request);
    return json(200, buildSessionContext(user, profile));
  } catch (error) {
    return errorResponse(error);
  }
}
