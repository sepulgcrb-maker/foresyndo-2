import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL belum dikonfigurasi. Periksa environment variables pada hosting.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'VITE_SUPABASE_ANON_KEY belum dikonfigurasi. Periksa environment variables pada hosting.'
  );
}

if (!/^https?:\/\/.+/.test(supabaseUrl)) {
  throw new Error(
    `VITE_SUPABASE_URL tidak valid: ${supabaseUrl}`
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function getSupabase(): SupabaseClient {
  return supabase;
}

export function isSupabaseConnected(): boolean {
  return Boolean(supabase);
}

export function getSupabaseConfigDetails() {
  return {
    url: supabaseUrl,
    isFromEnv: true,
    connected: true,
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
  };
}