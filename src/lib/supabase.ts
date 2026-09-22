import { createClient, SupabaseClient } from '@supabase/supabase-js';

// In-memory cache for dynamically loaded server config
let inMemoryUrl = '';
let inMemoryKey = '';
let isRemoteInitialized = false;

// Read from in-memory cache, env, or localStorage dynamically
export const getSupabaseConfig = () => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const url =
    inMemoryUrl ||
    env?.VITE_SUPABASE_URL ||
    localStorage.getItem('FORESYNDO_SUPABASE_URL') ||
    '';
  const key =
    inMemoryKey ||
    env?.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') ||
    '';
  const isFromEnv = Boolean(env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_ANON_KEY);
  return { url, key, isFromEnv };
};

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
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

export function getSupabaseConfigDetails() {
  const { url, isFromEnv } = getSupabaseConfig();
  return {
    url,
    isFromEnv,
    connected: isSupabaseConnected(),
  };
}

/**
 * Initializes Supabase configuration from central server.
 * This guarantees that when ANY user opens the app in another browser or incognito tab,
 * they automatically connect to the same Supabase project and database.
 */
export async function initSupabaseFromRemote(): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/config');
    if (res.ok) {
      const data = await res.json();
      if (data.url && data.anonKey) {
        inMemoryUrl = data.url;
        inMemoryKey = data.anonKey;
        localStorage.setItem('FORESYNDO_SUPABASE_URL', data.url);
        localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', data.anonKey);
        supabaseClient = null; // Recreate client with confirmed credentials
        isRemoteInitialized = true;
        return true;
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Supabase config from server:', err);
  }
  isRemoteInitialized = true;
  return isSupabaseConnected();
}

/**
 * Saves Supabase credentials locally AND sends them to the server so that
 * all other users/browsers access the exact same database.
 */
export async function saveSupabaseConfig(url: string, key: string): Promise<boolean> {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  inMemoryUrl = cleanUrl;
  inMemoryKey = cleanKey;

  if (cleanUrl) localStorage.setItem('FORESYNDO_SUPABASE_URL', cleanUrl);
  else localStorage.removeItem('FORESYNDO_SUPABASE_URL');

  if (cleanKey) localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', cleanKey);
  else localStorage.removeItem('FORESYNDO_SUPABASE_ANON_KEY');

  supabaseClient = null; // reset client

  // Send to server to persist for all browsers
  try {
    const res = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to persist Supabase config to server:', err);
    return false;
  }
}

