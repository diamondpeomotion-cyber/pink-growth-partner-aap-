import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {initPwaInstallCapture} from './utils/pwaInstall';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root container #root was not found in index.html');
}

// Capture beforeinstallprompt GLOBALLY before the first render. The event
// fires once — usually while the login screen is showing — and would be lost
// by the time the Install App modal mounts on the dashboard.
initPwaInstallCapture();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register the service worker that ships in /public/sw.js. Without this the
// offline cache, background sync and the PWA install prompt never activate,
// which made the "Install App" modal a no-op.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
