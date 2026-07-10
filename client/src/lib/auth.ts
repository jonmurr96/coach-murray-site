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

export async function sendMagicLink(
  email: string,
  redirectPath: "/dashboard" | "/admin"
) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Authentication is not configured yet.");

  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}${redirectPath}`,
      shouldCreateUser: false,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const client = getSupabaseBrowserClient();
  if (client) await client.auth.signOut();
  window.location.assign("/");
}
