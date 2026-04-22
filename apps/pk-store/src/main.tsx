import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { StoreProvider } from "./context/StoreContext";

/* StoreProvider resolves tenant from subdomain (see hooks/use-store-slug) and loads /stores/:slug. */
createRoot(document.getElementById("root")!).render(
  <StoreProvider>
    <App />
  </StoreProvider>,
);

/* ── Register Service Worker (PWA) ─────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] New version available — refresh to update.');
            }
          });
        });
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}
