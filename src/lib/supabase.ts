import { createClient, SupabaseClient } from '@supabase/supabase-js';

function cleanSupabaseUrl(raw?: string): string {
  if (!raw) return '';
  let url = raw.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/auth\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
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

export async function saveSupabaseConfig(url: string, anonKey: string): Promise<boolean> {
  if (url) {
    try {
      localStorage.setItem('FORESYNDO_SUPABASE_URL', url);
    } catch {
      // Ignore
    }
  }
  if (anonKey) {
    try {
      localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', anonKey);
    } catch {
      // Ignore
    }
  }
  return true;
}
