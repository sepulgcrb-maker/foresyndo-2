import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from env or localStorage dynamically
const getSupabaseConfig = () => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const url = env?.VITE_SUPABASE_URL || localStorage.getItem('FORESYNDO_SUPABASE_URL') || '';
  const key = env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') || '';
  return { url, key };
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key);
    } catch (e) {
      console.warn('Supabase initialization warning:', e);
      return null;
    }
  }
  return supabaseClient;
}

export function isSupabaseConnected(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) localStorage.setItem('FORESYNDO_SUPABASE_URL', url);
  else localStorage.removeItem('FORESYNDO_SUPABASE_URL');

  if (key) localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', key);
  else localStorage.removeItem('FORESYNDO_SUPABASE_ANON_KEY');

  supabaseClient = null; // reset client
}
