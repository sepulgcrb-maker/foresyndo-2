import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// Register multi-tier offline cache & service worker (Static Assets & API Payloads)
registerServiceWorker({
  autoWarmApi: true,
  apiEndpoints: ['/api/weather', '/api/supabase/status'],
  onSuccess: () => console.log('[Service Worker] Active and persistent cache ready (v4.1).'),
  onOfflineReady: () => console.log('[Service Worker] App ready for offline read-only usage.'),
  onUpdate: () => console.log('[Service Worker] New cache update found in background.'),
  onOnlineStateChange: (isOnline) => {
    console.log(`[Service Worker] Connectivity changed: ${isOnline ? 'Online' : 'Offline (Read-Only Mode)'}`);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

