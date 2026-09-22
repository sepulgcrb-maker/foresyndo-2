import { createClient, SupabaseClient } from '@supabase/supabase-js';

// In-memory cache for dynamic overrides (if user updates via UI)
let inMemoryUrl = '';
let inMemoryKey = '';

export interface EnvValidationResult {
  isValid: boolean;
  url: string;
  anonKey: string;
  isFromEnv: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Sanitizes Supabase project URL:
 * Strips trailing slashes, spaces, and accidental subpaths (/rest/v1, /auth/v1)
 * to ensure the root project domain (https://<project-ref>.supabase.co) is always used.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/auth\/v1\/?$/, '');
  url = url.replace(/\/+$/, '');
  return url;
}

/**
 * Robust validation of Supabase environment variables:
 * Checks presence, protocol, domain structure, and key validity of
 * import.meta.env.VITE_SUPABASE_URL and import.meta.env.VITE_SUPABASE_ANON_KEY.
 */
export function validateSupabaseEnv(): EnvValidationResult {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  const errors: string[] = [];
  const warnings: string[] = [];

  let cleanUrl = sanitizeSupabaseUrl(envUrl || '');
  let cleanKey = (envKey || '').trim();
  let isFromEnv = Boolean(cleanUrl && cleanKey);

  // If environment variables are not set or incomplete, check in-memory or localStorage
  if (!cleanUrl || !cleanKey) {
    const fallbackUrl = sanitizeSupabaseUrl(
      inMemoryUrl || (typeof window !== 'undefined' ? localStorage.getItem('FORESYNDO_SUPABASE_URL') || '' : '')
    );
    const fallbackKey = (
      inMemoryKey || (typeof window !== 'undefined' ? localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') || '' : '')
    ).trim();

    if (fallbackUrl && fallbackKey) {
      cleanUrl = fallbackUrl;
      cleanKey = fallbackKey;
      isFromEnv = false;
      warnings.push('Menggunakan kredensial Supabase dari cache/penyimpanan lokal.');
    }
  }

  // 1. URL Validation
  if (!cleanUrl) {
    errors.push('VITE_SUPABASE_URL tidak ditemukan pada environment variables.');
  } else {
    // Protocol validation
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      errors.push(`VITE_SUPABASE_URL harus dimulai dengan http:// atau https:// (diterima: "${cleanUrl}")`);
    } else {
      if (cleanUrl.startsWith('http://') && !cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1')) {
        warnings.push('VITE_SUPABASE_URL menggunakan protokol HTTP non-enkripsi; disarankan menggunakan HTTPS.');
      }
      try {
        const parsedUrl = new URL(cleanUrl);
        if (!parsedUrl.hostname) {
          errors.push('Hostname VITE_SUPABASE_URL tidak valid.');
        } else if (parsedUrl.hostname.includes('placeholder') || parsedUrl.hostname.includes('your-project')) {
          errors.push(`VITE_SUPABASE_URL masih berupa placeholder: "${parsedUrl.hostname}"`);
        }
      } catch {
        errors.push(`Format VITE_SUPABASE_URL tidak valid: "${cleanUrl}"`);
      }
    }
  }

  // 2. Anon Key Validation
  if (!cleanKey) {
    errors.push('VITE_SUPABASE_ANON_KEY tidak ditemukan pada environment variables.');
  } else {
    if (cleanKey.length < 20) {
      warnings.push('Panjang VITE_SUPABASE_ANON_KEY terlalu pendek untuk API key Supabase standar.');
    }
    if (cleanKey.includes('placeholder') || cleanKey.includes('YOUR_ANON_KEY') || cleanKey.includes('your-anon-key')) {
      errors.push(`VITE_SUPABASE_ANON_KEY masih berupa placeholder.`);
    }
    // Verify standard JWT token characteristics (3 parts separated by dots)
    const keyParts = cleanKey.split('.');
    if (keyParts.length !== 3) {
      warnings.push('VITE_SUPABASE_ANON_KEY bukan format JWT 3-bagian standar, namun tetap diproses.');
    }
  }

  const isValid = errors.length === 0 && Boolean(cleanUrl && cleanKey);

  return {
    isValid,
    url: cleanUrl,
    anonKey: cleanKey,
    isFromEnv,
    errors,
    warnings,
  };
}

/**
 * Custom fetch wrapper passed into Supabase createClient.
 * Strictly verifies that every response returned to the Supabase client is valid and non-HTML.
 * Intercepts HTML redirects or gateway fallback pages, logging diagnostics and returning
 * a structured JSON error response so the Supabase SDK handles it gracefully.
 */
function createValidatedSupabaseFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl =
      typeof input === 'string'
        ? input
        : input instanceof Request
        ? input.url
        : input instanceof URL
        ? input.href
        : String(input);

    const fullEndpointUrl =
      typeof window !== 'undefined'
        ? new URL(rawUrl, window.location.origin).href
        : rawUrl;

    try {
      const response = await fetch(input, init);
      const contentType = response.headers.get('content-type') || '';
      const isHtml = contentType.toLowerCase().includes('text/html');
      const isRedirected = response.redirected;

      // Check for HTML or redirected responses before Supabase SDK attempts JSON deserialization
      if (isHtml || isRedirected) {
        let bodySnippet = '';
        try {
          const clone = response.clone();
          bodySnippet = await clone.text();
        } catch (cloneErr) {
          bodySnippet = `[Unable to clone/read response body: ${cloneErr}]`;
        }

        console.warn(
          `[Supabase Client HTTP Notice - Non-JSON/Redirect Intercepted]\n` +
          `  Full Endpoint URL: ${fullEndpointUrl}\n` +
          `  Resolved URL: ${response.url || fullEndpointUrl}\n` +
          `  HTTP Status: ${response.status} (${response.statusText})\n` +
          `  Content-Type: "${contentType}"\n` +
          `  Redirected: ${isRedirected}\n` +
          `  Response Body Snippet:\n${bodySnippet.slice(0, 1000)}`
        );

        // Return a structured JSON error response so Supabase SDK handles it cleanly
        // without throwing SyntaxError: Unexpected token '<'
        return new Response(
          JSON.stringify({
            error: 'HTML_RESPONSE_RECEIVED',
            message: `Endpoint returned HTML (${response.status} ${response.statusText}) instead of JSON: ${fullEndpointUrl}`,
            statusCode: response.status,
            hint: 'Verify the Supabase Project URL and ensure no subpaths (/rest/v1) or authentication redirects are configured.',
          }),
          {
            status: response.status >= 400 ? response.status : 502,
            statusText: response.statusText || 'Bad Gateway (HTML Intercepted)',
            headers: {
              'Content-Type': 'application/json',
              'X-Foresyndo-HTML-Intercepted': 'true',
            },
          }
        );
      }

      return response;
    } catch (err: any) {
      console.warn(
        `[Supabase Client Network Notice]\n` +
        `  Full Endpoint URL: ${fullEndpointUrl}\n` +
        `  Notice: ${err?.message || err}. Mengembalikan respons status 503 ramah jaringan.`
      );
      // Return a safe 503 Response so Supabase SDK receives a clean error instead of an unhandled rejection
      return new Response(
        JSON.stringify({
          error: 'NETWORK_ERROR',
          message: `Network request to Supabase endpoint failed: ${err?.message || err}`,
          statusCode: 503,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Returns current Supabase config details and environment validation status.
 */
export const getSupabaseConfig = () => {
  const validation = validateSupabaseEnv();
  return {
    url: validation.url,
    key: validation.anonKey,
    isFromEnv: validation.isFromEnv,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
  };
};

let supabaseClient: SupabaseClient | null = null;

/**
 * Creates and returns the Supabase client directly using validated environment variables
 * (import.meta.env.VITE_SUPABASE_URL & import.meta.env.VITE_SUPABASE_ANON_KEY).
 */
export function getSupabase(): SupabaseClient | null {
  const { url, key, isValid, errors } = getSupabaseConfig();
  if (!url || !key || !isValid) {
    if (errors.length > 0 && typeof window !== 'undefined' && !(window as any).__SUPABASE_ENV_WARNED__) {
      console.warn('[Supabase Env Validation Notice]:', errors.join('; '));
      (window as any).__SUPABASE_ENV_WARNED__ = true;
    }
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          fetch: createValidatedSupabaseFetch(),
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
  const { url, key, isValid } = getSupabaseConfig();
  return Boolean(url && key && isValid);
}

export function getSupabaseConfigDetails() {
  const config = getSupabaseConfig();
  return {
    url: config.url,
    isFromEnv: config.isFromEnv,
    connected: isSupabaseConnected(),
    isValid: config.isValid,
    errors: config.errors,
    warnings: config.warnings,
  };
}

/**
 * Saves Supabase credentials locally for manual configuration in the UI.
 * Does not make external network calls.
 */
export async function saveSupabaseConfig(url: string, key: string): Promise<boolean> {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = key.trim();

  inMemoryUrl = cleanUrl;
  inMemoryKey = cleanKey;

  if (typeof window !== 'undefined') {
    if (cleanUrl) localStorage.setItem('FORESYNDO_SUPABASE_URL', cleanUrl);
    else localStorage.removeItem('FORESYNDO_SUPABASE_URL');

    if (cleanKey) localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', cleanKey);
    else localStorage.removeItem('FORESYNDO_SUPABASE_ANON_KEY');
  }

  supabaseClient = null; // reset client to re-evaluate with updated credentials
  return isSupabaseConnected();
}
