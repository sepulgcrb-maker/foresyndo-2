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

const rawSupabaseUrl = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL
    ? import.meta.env.VITE_SUPABASE_URL
    : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '')
)?.trim();
const supabaseUrl = cleanSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '')
)?.trim();

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

export interface SupabaseStartupDiagnosticResult {
  success: boolean;
  table: string;
  count: number;
  data: any[] | null;
  error: any | null;
  timestamp: string;
}

/**
 * Diagnostic utility that attempts a 'SELECT * FROM project_info' query on application startup
 * and logs the full result or full error object to help identify connection or RLS issues immediately.
 */
export async function runSupabaseStartupDiagnostics(): Promise<SupabaseStartupDiagnosticResult> {
  const timestamp = new Date().toISOString();
  console.log(`[SUPABASE STARTUP DIAGNOSTIC] Initiating 'SELECT * FROM project_info' query at ${timestamp}...`);

  try {
    const { data, error, status, statusText } = await supabase
      .from('project_info')
      .select('*');

    if (error) {
      console.warn('[SUPABASE STARTUP DIAGNOSTIC] Notice: Direct client query returned an error (fallback will handle):', {
        status,
        statusText,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return {
        success: false,
        table: 'project_info',
        count: 0,
        data: null,
        error,
        timestamp,
      };
    }

    console.log(`[SUPABASE STARTUP DIAGNOSTIC] SUCCESS: Table 'project_info' query resolved! Rows returned: ${data?.length ?? 0}`, {
      status,
      statusText,
      rowCount: data?.length ?? 0,
      rows: data,
    });

    return {
      success: true,
      table: 'project_info',
      count: data?.length ?? 0,
      data,
      error: null,
      timestamp,
    };
  } catch (err: any) {
    console.warn('[SUPABASE STARTUP DIAGNOSTIC] Notice: Query attempt caught exception:', err?.message || err);
    return {
      success: false,
      table: 'project_info',
      count: 0,
      data: null,
      error: err,
      timestamp,
    };
  }
}

