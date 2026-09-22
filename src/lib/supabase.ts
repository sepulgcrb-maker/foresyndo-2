import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

// ---------------------------------------------------------------------------
// Direct Initialization & Startup Environment Variable Validation
// ---------------------------------------------------------------------------

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation check to throw a clear error if these environment variables are missing during startup
if (!rawSupabaseUrl || !rawSupabaseUrl.trim()) {
  throw new Error(
    'Missing required Supabase environment variable: "VITE_SUPABASE_URL" must be defined in your environment (e.g., .env or hosting environment variables).'
  );
}

if (!rawSupabaseAnonKey || !rawSupabaseAnonKey.trim()) {
  throw new Error(
    'Missing required Supabase environment variable: "VITE_SUPABASE_ANON_KEY" must be defined in your environment (e.g., .env or hosting environment variables).'
  );
}

const sanitizedSupabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);

if (!sanitizedSupabaseUrl.startsWith('http://') && !sanitizedSupabaseUrl.startsWith('https://')) {
  throw new Error(
    `Invalid "VITE_SUPABASE_URL": must start with "http://" or "https://". Received: "${rawSupabaseUrl}"`
  );
}

/**
 * Directly initialized Supabase client using validated environment variables.
 */
export const supabase: SupabaseClient = createClient(
  sanitizedSupabaseUrl,
  rawSupabaseAnonKey.trim(),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: createValidatedSupabaseFetch(),
    },
  }
);

/**
 * Accessor function returning the initialized Supabase client.
 */
export function getSupabase(): SupabaseClient {
  return supabase;
}

/**
 * Returns true if Supabase client is successfully initialized and ready.
 */
export function isSupabaseConnected(): boolean {
  return Boolean(supabase);
}

/**
 * Returns configuration details for status displays.
 */
export function getSupabaseConfigDetails() {
  return {
    url: sanitizedSupabaseUrl,
    isFromEnv: true,
    connected: isSupabaseConnected(),
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
  };
}

/**
 * Local helper for modal interaction.
 */
export async function saveSupabaseConfig(url: string, key: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('FORESYNDO_SUPABASE_URL', sanitizeSupabaseUrl(url));
    if (key) localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', key.trim());
  }
  return isSupabaseConnected();
}
