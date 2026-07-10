export const publicConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "",
  siteUrl: import.meta.env.VITE_SITE_URL?.trim() ?? window.location.origin,
};

export const hasSupabaseConfig = Boolean(
  publicConfig.supabaseUrl && publicConfig.supabaseAnonKey
);

export const isLocalPreview = import.meta.env.DEV;
