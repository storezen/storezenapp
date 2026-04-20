/* SmartWear Service Worker v1 */
const CACHE = 'smartwear-v1';
const SHELL = ['/', '/manifest.json', '/favicon.svg'];

/* ── Install: pre-cache shell ─────────────────────────────────────────────── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {/* ignore offline shell fails */})
  );
  self.skipWaiting();
});

/* ── Activate: clean old caches ──────────────────────────────────────────── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch strategy ──────────────────────────────────────────────────────── */
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Images — cache-first (product images from Unsplash or /public) */
  if (
    request.destination === 'image' ||
    url.hostname === 'images.unsplash.com'
  ) {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  /* Same-origin app requests — network-first with fallback */
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(cached => {
            if (cached) return cached;
            /* Offline fallback for navigation */
            if (request.destination === 'document') {
              return caches.match('/').then(home => home || new Response(
                '<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h1>📶 You\'re Offline</h1><p>Please check your internet connection to continue shopping.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              ));
            }
            return new Response('', { status: 503 });
          })
        )
    );
  }
});
