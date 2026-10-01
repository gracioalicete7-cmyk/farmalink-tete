import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/registerServiceWorker';

// Early protection against sandboxed iframe network errors from external SDKs
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason || '').toLowerCase();
    const code = String(reason?.code || '').toLowerCase();
    if (
      code === 'auth/network-request-failed' ||
      code === 'auth/operation-not-allowed' ||
      code === 'auth/popup-closed-by-user' ||
      msg.includes('auth/network-request-failed') ||
      msg.includes('network-request-failed') ||
      msg.includes('password_login_disabled')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerServiceWorker();

