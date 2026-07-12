import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseConfig, publicConfig } from "./config";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabaseConfig) return null;
  if (!browserClient) {
    browserClient = createClient(
      publicConfig.supabaseUrl,
      publicConfig.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }
  return browserClient;
}

export async function getAccessToken() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

export async function signInWithPassword(email: string, password: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(
  email: string,
  destination: "/dashboard" | "/admin"
) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");
  const redirect = new URL("/account/confirm", window.location.origin);
  redirect.searchParams.set("next", destination);
  const { error } = await client.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: redirect.toString() }
  );
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data;
}

export async function verifyEmailToken(
  tokenHash: string,
  type: "invite" | "recovery"
) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");
  const { data, error } = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });
  if (error) throw error;
  return data;
}

export async function clearSession() {
  const client = getSupabaseBrowserClient();
  if (client) {
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) throw error;
  }
}

export async function revokeOtherSessions() {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");
  const { error } = await client.auth.signOut({ scope: "others" });
  if (error) throw error;
}

export async function getCurrentSession() {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthSessionChange(callback: (signedIn: boolean) => void) {
  const client = getSupabaseBrowserClient();
  if (!client) return () => undefined;
  const { data } = client.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session));
  });
  return () => data.subscription.unsubscribe();
}

export async function signOut() {
  await clearSession();
  window.location.assign("/");
}
