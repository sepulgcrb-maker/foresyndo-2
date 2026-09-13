import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './utils/serviceWorkerRegistration';

// Register offline cache & service worker
registerServiceWorker({
  onSuccess: () => console.log('[Service Worker] Active and persistent cache ready.'),
  onUpdate: () => console.log('[Service Worker] New cache update found.'),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

