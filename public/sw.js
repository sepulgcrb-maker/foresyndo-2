// Service Worker for PT Foresyndo Global Indonesia - Monitoring Konstruksi Terpadu
// Advanced Multi-Tier Caching Architecture (Static Assets + API Payloads + SPA Navigation)

const CACHE_VERSION = 'v4.1';
const STATIC_CACHE_NAME = `foresyndo-static-${CACHE_VERSION}`;
const API_CACHE_NAME = `foresyndo-api-${CACHE_VERSION}`;
const PAGES_CACHE_NAME = `foresyndo-pages-${CACHE_VERSION}`;
const SYNC_CHANNEL_NAME = 'foresyndo_sync_bus';

const CURRENT_CACHES = [STATIC_CACHE_NAME, API_CACHE_NAME, PAGES_CACHE_NAME];

// Core shell assets to precache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.png',
  '/logo.png',
];

// Fallback JSON payload when API call fails offline and has no cache
const OFFLINE_WEATHER_FALLBACK = {
  success: true,
  isFallback: true,
  offline: true,
  cached: true,
  data: {
    location: 'Jatitujuh, Majalengka (Mode Offline)',
    temperature: '31°C',
    condition: 'Cerah Berawan',
    humidity: '74%',
    windSpeed: '12 km/jam',
    rainChance: '20%',
    impactAnalysis: {
      concretePouring: 'Aman - Mengacu pada histori data lapangan tersimpan.',
      heavyEquipment: 'Aman - Operasional alat berat dalam status normal.',
      outdoorWork: 'Optimal - Tetap gunakan APD lengkap di area proyek.',
      k3Safety: 'Perhatikan hidrasi tim lapangan dan siapkan shelter teduh.',
    },
    recommendations: [
      'Aplikasi berjalan dalam mode baca-saja (offline cache).',
      'Data proyek dan laporan tetap dapat ditinjau secara lokal.',
      'Sinkronisasi cuaca otomatis akan dilanjutkan setelah koneksi terhubung kembali.',
    ],
    forecast3Days: [
      { day: 'Besok', condition: 'Cerah Berawan', temp: '30°C', rainChance: '30%' },
      { day: 'Lusa', condition: 'Hujan Ringan', temp: '28°C', rainChance: '50%' },
      { day: 'H+3', condition: 'Berawan Tebal', temp: '29°C', rainChance: '40%' },
    ],
    lastUpdated: 'Tersimpan di Cache Offline',
  },
  sources: [
    {
      title: 'Cache Offline Proyek Foresyndo (Jatitujuh)',
      uri: 'offline://foresyndo-cache',
    },
  ],
};

const OFFLINE_SUPABASE_FALLBACK = {
  configured: true,
  liveStatus: 'offline_cached',
  latencyMs: 0,
  hasServiceRoleKey: false,
  offline: true,
  notice: 'Mode Offline: Membaca data proyek dari local storage yang tersinkronisasi.',
  envSupported: true,
};

// ==========================================
// 1. INSTALL EVENT
// ==========================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      // Use individual caching so single missing file doesn't reject whole installation
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[SW Precache] Optional asset failed:', url, err);
          }
        })
      );
      console.log('[Service Worker] Core static shell cached successfully.');
    })
  );
});

// ==========================================
// 2. ACTIVATE EVENT
// ==========================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!CURRENT_CACHES.includes(key)) {
            console.log('[Service Worker] Removing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Trim cache size to prevent unbounded growth
async function trimCache(cacheName, maxItems = 60) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      trimCache(cacheName, maxItems);
    }
  } catch (e) {
    // Ignore cache trim errors
  }
}

// ==========================================
// 3. FETCH EVENT - STRATEGY ROUTER
// ==========================================
self.addEventListener('fetch', (event) => {
  // Only handle GET requests; let mutations (POST, PUT, DELETE) pass directly to network
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignore non-http protocols (e.g. chrome-extension, blob, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never intercept cross-origin third-party services like Supabase or APIs outside our origin (except fonts & weather)
  if (url.origin !== self.location.origin && !url.hostname.includes('open-meteo.com') && !url.hostname.includes('fonts.')) {
    return;
  }

  const isApiRequest = url.pathname.startsWith('/api/') || url.hostname.includes('open-meteo.com');
  const isNavigation = !isApiRequest && (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html'));
  const isStaticAsset =
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  // ----------------------------------------------------
  // Strategy A: HTML Navigation (Network-First with SPA Fallback)
  // ----------------------------------------------------
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(PAGES_CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Connection lost: return cached HTML or shell index.html
          const cachedPage = await caches.match(event.request);
          if (cachedPage) return cachedPage;

          const shellIndex = await caches.match('/index.html');
          if (shellIndex) return shellIndex;

          return new Response(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Foresyndo Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Aplikasi Offline</h2><p>Memuat antarmuka dari cache lokal...</p><script>location.reload();</script></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // ----------------------------------------------------
  // Strategy B: API Payloads (Network-First with Robust Cache Fallback)
  // ----------------------------------------------------
  if (isApiRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If valid response from API, update API cache
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 304)) {
            const responseClone = networkResponse.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
              trimCache(API_CACHE_NAME, 50);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed (device offline or connection timeout)
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            // Clone and inject custom offline header so frontend can flag offline status
            const headers = new Headers(cachedResponse.headers);
            headers.set('X-Foresyndo-Offline-Cache', 'true');
            headers.set('X-Foresyndo-Read-Only', 'true');

            return new Response(await cachedResponse.blob(), {
              status: 200,
              statusText: 'OK (Served from Service Worker Offline Cache)',
              headers,
            });
          }

          // Synthetic offline response if API was never cached before
          if (url.pathname.includes('/api/weather') || url.hostname.includes('open-meteo.com')) {
            return new Response(JSON.stringify(OFFLINE_WEATHER_FALLBACK), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Foresyndo-Offline-Cache': 'true',
                'X-Foresyndo-Synthetic': 'true',
              },
            });
          }

          if (url.pathname.includes('/api/supabase/status')) {
            return new Response(JSON.stringify(OFFLINE_SUPABASE_FALLBACK), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Foresyndo-Offline-Cache': 'true',
              },
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              readOnly: true,
              message: 'Perangkat offline. Data dibaca dari cache lokal.',
            }),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'X-Foresyndo-Offline-Cache': 'true',
              },
            }
          );
        })
    );
    return;
  }

  // ----------------------------------------------------
  // Strategy C: Static Assets (Stale-While-Revalidate)
  // ----------------------------------------------------
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Fetch from network in parallel to revalidate
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
                trimCache(STATIC_CACHE_NAME, 150);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failure is expected when offline; cached response is used
            return null;
          });

        // Return cached asset immediately if found, otherwise wait for network
        return cachedResponse || fetchPromise.then((res) => {
          if (res) return res;
          // If neither cache nor network available:
          if (event.request.destination === 'image') {
            // Return 1x1 transparent PNG or placeholder SVG
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#1e293b"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('Asset Unavailable Offline', { status: 503, statusText: 'Offline' });
        });
      })
    );
    return;
  }

  // ----------------------------------------------------
  // Strategy D: All Other Requests (Network-First)
  // ----------------------------------------------------
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        return new Response('Offline - Foresyndo Construction Cache', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// ==========================================
// 4. INTER-CLIENT & SYNC MESSAGING
// ==========================================
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  // Query Cache Health / Stats
  if (event.data.type === 'GET_CACHE_STATUS' || event.data.type === 'CHECK_CACHE_SYNC') {
    try {
      const staticCache = await caches.open(STATIC_CACHE_NAME);
      const apiCache = await caches.open(API_CACHE_NAME);
      const pagesCache = await caches.open(PAGES_CACHE_NAME);

      const staticKeys = await staticCache.keys();
      const apiKeys = await apiCache.keys();
      const pagesKeys = await pagesCache.keys();

      event.source?.postMessage({
        type: 'CACHE_SYNC_STATUS',
        status: 'active',
        version: CACHE_VERSION,
        timestamp: Date.now(),
        counts: {
          static: staticKeys.length,
          api: apiKeys.length,
          pages: pagesKeys.length,
          total: staticKeys.length + apiKeys.length + pagesKeys.length,
        },
        caches: CURRENT_CACHES,
      });
    } catch (e) {
      event.source?.postMessage({
        type: 'CACHE_SYNC_STATUS',
        status: 'error',
        error: String(e),
      });
    }
  }

  // Pre-fetch & Prime API payloads from client command
  if (event.data.type === 'PREFETCH_APIS' && Array.isArray(event.data.endpoints)) {
    try {
      const cache = await caches.open(API_CACHE_NAME);
      const results = await Promise.allSettled(
        event.data.endpoints.map(async (endpoint) => {
          const res = await fetch(endpoint);
          if (res && res.ok) {
            await cache.put(endpoint, res);
            return endpoint;
          }
          throw new Error(`Status ${res?.status}`);
        })
      );
      event.source?.postMessage({
        type: 'PREFETCH_APIS_COMPLETE',
        success: true,
        cachedCount: results.filter((r) => r.status === 'fulfilled').length,
      });
    } catch (err) {
      console.warn('[SW] API prefetch failed:', err);
    }
  }

  // Clear all caches on demand
  if (event.data.type === 'CLEAR_ALL_CACHES') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      event.source?.postMessage({
        type: 'CLEAR_CACHES_COMPLETE',
        success: true,
      });
    } catch (err) {
      event.source?.postMessage({
        type: 'CLEAR_CACHES_COMPLETE',
        success: false,
        error: String(err),
      });
    }
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

