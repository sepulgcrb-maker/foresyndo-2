import { createClient, SupabaseClient } from '@supabase/supabase-js';

// In-memory cache for dynamically loaded server config
let inMemoryUrl = '';
let inMemoryKey = '';
let isRemoteInitialized = false;

/**
 * Sanitizes Supabase project URL:
 * Strips trailing slashes and accidental subpaths (/rest/v1, /auth/v1)
 * to ensure the root project domain (https://<project-ref>.supabase.co) is always used.
 * Appending /rest/v1 causes cloud gateway redirects and unexpected HTML responses.
 */
export function sanitizeSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
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
 * Logs the full endpoint URL, HTTP status, and Content-Type to the browser console
 * BEFORE proceeding to JSON parsing to identify exactly where HTML redirects occur.
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

        console.error(
          `[Supabase Client HTTP Inspection - HTML/Redirect Detected]\n` +
          `  Full Endpoint URL: ${fullEndpointUrl}\n` +
          `  Resolved URL: ${response.url || fullEndpointUrl}\n` +
          `  HTTP Status: ${response.status} (${response.statusText})\n` +
          `  Content-Type: "${contentType}"\n` +
          `  Redirected: ${isRedirected}\n` +
          `  Response Body Snippet (HTML received instead of JSON):\n${bodySnippet.slice(0, 1000)}`
        );

        // If the endpoint returned HTML, return a structured JSON error response
        // so the Supabase SDK handles it gracefully instead of throwing SyntaxError: Unexpected token '<'
        if (isHtml) {
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
      }

      return response;
    } catch (err: any) {
      console.error(
        `[Supabase Client Network Error]\n` +
        `  Full Endpoint URL: ${fullEndpointUrl}\n` +
        `  Error: ${err?.message || err}`
      );
      throw err;
    }
  };
}

// Read from in-memory cache, env, or localStorage dynamically
export const getSupabaseConfig = () => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const rawUrl =
    inMemoryUrl ||
    env?.VITE_SUPABASE_URL ||
    localStorage.getItem('FORESYNDO_SUPABASE_URL') ||
    '';
  const url = sanitizeSupabaseUrl(rawUrl);
  const key =
    inMemoryKey ||
    env?.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') ||
    '';
  const isFromEnv = Boolean(env?.VITE_SUPABASE_URL && env?.VITE_SUPABASE_ANON_KEY);
  return { url, key, isFromEnv };
};

let supabaseClient: SupabaseClient | null = null;

/**
 * Creates and returns the Supabase client with strict response validation.
 * Uses createValidatedSupabaseFetch to ensure non-HTML responses and detailed logging.
 */
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
 *
 * Strictly verifies response.ok and Content-Type before parsing JSON,
 * logging the full endpoint URL, HTTP status, and Content-Type to the browser console
 * before proceeding to JSON parsing to identify exactly where HTML redirects occur.
 */
export async function initSupabaseFromRemote(): Promise<boolean> {
  const endpoint = '/api/supabase/config';
  const fullEndpointUrl =
    typeof window !== 'undefined'
      ? new URL(endpoint, window.location.origin).href
      : endpoint;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');
    const isHtml = contentType.toLowerCase().includes('text/html');
    const isRedirected = res.redirected;

    // 1. Check for non-OK, HTML, or redirect before attempting JSON parsing
    if (!res.ok || isHtml || !isJson || isRedirected) {
      let bodySnippet = '';
      try {
        bodySnippet = await res.text();
      } catch (readErr) {
        bodySnippet = `[Unable to read response body: ${readErr}]`;
      }

      console.error(
        `[Supabase Config Initialization Inspection - HTML/Invalid Response]\n` +
        `  Full Endpoint URL: ${fullEndpointUrl}\n` +
        `  Resolved URL: ${res.url || fullEndpointUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Redirected: ${isRedirected}\n` +
        `  Response Body Snippet (indicates HTML redirect/fallback):\n${bodySnippet.slice(0, 1000)}`
      );
      isRemoteInitialized = true;
      return isSupabaseConnected();
    }

    // 2. Read body as text and safely parse JSON
    const rawText = await res.text();
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      console.error(
        `[Supabase Config Fetch Error - JSON Parse Failure]\n` +
        `  Full Endpoint URL: ${fullEndpointUrl}\n` +
        `  Resolved URL: ${res.url || fullEndpointUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Parse Error: ${parseErr?.message}\n` +
        `  Raw Body Preview:\n${rawText.slice(0, 1000)}`
      );
      isRemoteInitialized = true;
      return isSupabaseConnected();
    }

    if (data && typeof data === 'object') {
      if (data.url && data.anonKey) {
        const cleanUrl = sanitizeSupabaseUrl(data.url);
        inMemoryUrl = cleanUrl;
        inMemoryKey = data.anonKey;
        localStorage.setItem('FORESYNDO_SUPABASE_URL', cleanUrl);
        localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', data.anonKey);
        supabaseClient = null; // Recreate client with confirmed credentials
        isRemoteInitialized = true;
        return true;
      }
    }
  } catch (err: any) {
    console.error(
      `[Supabase Config Fetch Network/Fatal Error]\n` +
      `  Full Endpoint URL: ${fullEndpointUrl}\n` +
      `  Error: ${err?.message || err}`
    );
  }

  isRemoteInitialized = true;
  return isSupabaseConnected();
}

/**
 * Saves Supabase credentials locally AND sends them to the server so that
 * all other users/browsers access the exact same database.
 * Strictly verifies response.ok and Content-Type headers with explicit error logging
 * before proceeding to JSON parsing.
 */
export async function saveSupabaseConfig(url: string, key: string): Promise<boolean> {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = key.trim();

  inMemoryUrl = cleanUrl;
  inMemoryKey = cleanKey;

  if (cleanUrl) localStorage.setItem('FORESYNDO_SUPABASE_URL', cleanUrl);
  else localStorage.removeItem('FORESYNDO_SUPABASE_URL');

  if (cleanKey) localStorage.setItem('FORESYNDO_SUPABASE_ANON_KEY', cleanKey);
  else localStorage.removeItem('FORESYNDO_SUPABASE_ANON_KEY');

  supabaseClient = null; // reset client

  const endpoint = '/api/supabase/config';
  const fullEndpointUrl =
    typeof window !== 'undefined'
      ? new URL(endpoint, window.location.origin).href
      : endpoint;

  // Send to server to persist for all browsers
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');
    const isHtml = contentType.toLowerCase().includes('text/html');
    const isRedirected = res.redirected;

    if (!res.ok || isHtml || !isJson || isRedirected) {
      let bodySnippet = '';
      try {
        bodySnippet = await res.text();
      } catch (readErr) {
        bodySnippet = `[Unable to read response body: ${readErr}]`;
      }
      console.error(
        `[Supabase Config Save Inspection - HTML/Invalid Response]\n` +
        `  Full Endpoint URL: ${fullEndpointUrl}\n` +
        `  Resolved URL: ${res.url || fullEndpointUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Redirected: ${isRedirected}\n` +
        `  Response Body Snippet:\n${bodySnippet.slice(0, 1000)}`
      );
      return false;
    }

    return true;
  } catch (err: any) {
    console.error(
      `[Supabase Config Save Network Error]\n` +
      `  Full Endpoint URL: ${fullEndpointUrl}\n` +
      `  Error: ${err?.message || err}`
    );
    return false;
  }
}

