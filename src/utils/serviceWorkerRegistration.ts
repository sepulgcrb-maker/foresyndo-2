/**
 * Service Worker Registration and Cache Monitoring
 * PT Foresyndo Global Indonesia - Monitoring Konstruksi Terpadu
 * 
 * Extends service worker lifecycle with multi-tier caching strategies for
 * static assets, API payloads, and resilient read-only offline execution.
 */

import { useState, useEffect, useCallback } from 'react';

export interface CacheCounts {
  static: number;
  api: number;
  pages: number;
  total: number;
}

export interface OfflineCacheReport {
  isSupported: boolean;
  isActive: boolean;
  version: string;
  isOnline: boolean;
  counts: CacheCounts;
  caches: string[];
  lastChecked: Date;
}

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onOfflineReady?: () => void;
  onOnlineStateChange?: (isOnline: boolean) => void;
  onCacheStatusUpdate?: (report: OfflineCacheReport) => void;
}

export interface SWRegistrationOptions extends SWRegistrationCallbacks {
  autoWarmApi?: boolean;
  apiEndpoints?: string[];
}

const DEFAULT_API_ENDPOINTS = [
  '/api/weather',
  '/api/supabase/status',
];

/**
 * Register Service Worker and initialize offline cache strategies
 */
export function registerServiceWorker(options?: SWRegistrationOptions | SWRegistrationCallbacks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.info('[SW] Service Workers are not supported in this environment.');
    return;
  }

  const opts: SWRegistrationOptions = options || {};
  const autoWarm = opts.autoWarmApi ?? true;
  const endpoints = opts.apiEndpoints ?? DEFAULT_API_ENDPOINTS;

  // Listen to network status changes
  window.addEventListener('online', () => {
    console.log('[Network] Connection restored (Online).');
    opts.onOnlineStateChange?.(true);
    // Auto re-validate and warm API cache when connection returns
    if (autoWarm) {
      prefetchApiPayloads(endpoints).catch(() => {});
    }
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Connection lost (Offline - Read-Only Mode).');
    opts.onOnlineStateChange?.(false);
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registration successful with scope:', registration.scope);

        // Check for updates on page focus
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[SW] New version available in background cache.');
                opts.onUpdate?.(registration);
              } else {
                // Pre-cached for offline use
                console.log('[SW] Static & API shell cached for offline read-only use.');
                opts.onSuccess?.(registration);
                opts.onOfflineReady?.();
              }
            }
          };
        };

        // If controller is active and online, prime API cache
        if (navigator.serviceWorker.controller && navigator.onLine && autoWarm) {
          prefetchApiPayloads(endpoints).catch(() => {});
        }

        opts.onSuccess?.(registration);
      })
      .catch((error) => {
        console.warn('[SW] Service worker registration failed:', error);
        opts.onError?.(error);
      });
  });
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

/**
 * Prefetches and primes API payloads in the Service Worker Cache
 * so they are immediately available for read-only tasks when offline.
 */
export async function prefetchApiPayloads(endpoints: string[] = DEFAULT_API_ENDPOINTS): Promise<number> {
  if (typeof window === 'undefined') return 0;

  // Method 1: Ask active Service Worker to prefetch
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH_APIS',
      endpoints,
    });
  }

  // Method 2: Also trigger fetch directly so the Service Worker fetch event captures and caches them
  let cachedCount = 0;
  await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      try {
        const res = await fetch(endpoint, { cache: 'reload' });
        if (res.ok) cachedCount++;
      } catch (err) {
        console.warn(`[SW Prefetch] Endpoint ${endpoint} failed:`, err);
      }
    })
  );

  return cachedCount;
}

/**
 * Inspects CacheStorage directly to report offline readiness and stored asset counts
 */
export async function getOfflineCacheReport(): Promise<OfflineCacheReport> {
  const isSupported = typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isActive = Boolean(navigator.serviceWorker?.controller);

  const defaultReport: OfflineCacheReport = {
    isSupported,
    isActive,
    version: 'v4.1',
    isOnline,
    counts: { static: 0, api: 0, pages: 0, total: 0 },
    caches: [],
    lastChecked: new Date(),
  };

  if (!isSupported) return defaultReport;

  try {
    const cacheKeys = await window.caches.keys();
    let staticCount = 0;
    let apiCount = 0;
    let pagesCount = 0;

    for (const key of cacheKeys) {
      const cache = await window.caches.open(key);
      const items = await cache.keys();
      if (key.includes('static')) {
        staticCount += items.length;
      } else if (key.includes('api')) {
        apiCount += items.length;
      } else if (key.includes('pages')) {
        pagesCount += items.length;
      } else {
        staticCount += items.length;
      }
    }

    return {
      isSupported,
      isActive,
      version: 'v4.1',
      isOnline,
      counts: {
        static: staticCount,
        api: apiCount,
        pages: pagesCount,
        total: staticCount + apiCount + pagesCount,
      },
      caches: cacheKeys,
      lastChecked: new Date(),
    };
  } catch (err) {
    console.warn('[SW Report] Error querying caches:', err);
    return defaultReport;
  }
}

/**
 * Clears all cached resources (static, API, and pages)
 */
export async function clearAppCaches(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const keys = await window.caches.keys();
    await Promise.all(keys.map((k) => window.caches.delete(k)));

    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
    }
    return true;
  } catch (e) {
    console.error('[SW] Clear cache error:', e);
    return false;
  }
}

/**
 * React hook to observe offline/online status and service worker cache health
 */
export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cacheReport, setCacheReport] = useState<OfflineCacheReport | null>(null);
  const [isWarming, setIsWarming] = useState(false);

  const refreshReport = useCallback(async () => {
    const report = await getOfflineCacheReport();
    setCacheReport(report);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      refreshReport();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshReport();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial cache report
    refreshReport();

    // Periodic check every 15s
    const intervalId = setInterval(refreshReport, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [refreshReport]);

  const warmCache = useCallback(async () => {
    setIsWarming(true);
    try {
      const count = await prefetchApiPayloads();
      await refreshReport();
      return count;
    } finally {
      setIsWarming(false);
    }
  }, [refreshReport]);

  const clearCache = useCallback(async () => {
    const ok = await clearAppCaches();
    await refreshReport();
    return ok;
  }, [refreshReport]);

  return {
    isOnline,
    isOffline: !isOnline,
    isReadOnly: !isOnline,
    cacheReport,
    isWarming,
    refreshReport,
    warmCache,
    clearCache,
  };
}

