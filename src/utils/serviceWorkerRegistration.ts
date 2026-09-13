/**
 * Service Worker Registration and Cache Monitoring
 * PT Foresyndo Global Indonesia
 */

export interface SWRegistrationCallbacks {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function registerServiceWorker(callbacks?: SWRegistrationCallbacks) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates on page focus
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[SW] New version available in background cache.');
                callbacks?.onUpdate?.(registration);
              } else {
                // Pre-cached for offline use
                console.log('[SW] Content cached for offline use.');
                callbacks?.onSuccess?.(registration);
              }
            }
          };
        };

        callbacks?.onSuccess?.(registration);
      })
      .catch((error) => {
        console.warn('[SW] Service worker registration failed:', error);
        callbacks?.onError?.(error);
      });
  });
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
