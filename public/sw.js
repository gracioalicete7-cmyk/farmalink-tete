const CACHE_NAME = 'farmalink-tete-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install: pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Initial pre-cache partial error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate & Cache First for images / fonts / UI
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept non-GET, internal authentication, or firestore/firebase api requests
  if (request.method !== 'GET') return;
  if (
    url.pathname.includes('__cookie_check') ||
    url.search.includes('return_url') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('identitytoolkit')
  ) {
    return;
  }

  // Handle image and static media: Cache First with Network Fallback
  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => caches.match('/'));
      })
    );
    return;
  }

  // Navigation requests: Fast Network race with Cache fallback (max 1500ms network wait)
  if (request.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        let hasResolved = false;

        // Fast fallback to cache if network takes > 1.5s
        const timer = setTimeout(async () => {
          if (!hasResolved) {
            const cached = await caches.match(request) || await caches.match('/');
            if (cached) {
              hasResolved = true;
              resolve(cached);
            }
          }
        }, 1500);

        fetch(request)
          .then(async (networkResponse) => {
            clearTimeout(timer);
            if (!hasResolved && networkResponse && networkResponse.status === 200) {
              hasResolved = true;
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              resolve(networkResponse);
            } else if (!hasResolved) {
              hasResolved = true;
              const cached = await caches.match(request) || await caches.match('/');
              resolve(cached || networkResponse);
            }
          })
          .catch(async () => {
            clearTimeout(timer);
            if (!hasResolved) {
              hasResolved = true;
              const cached = await caches.match(request) || await caches.match('/');
              if (cached) {
                resolve(cached);
              } else {
                resolve(new Response('Offline - FarmaLink Tete', {
                  status: 503,
                  headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                }));
              }
            }
          });
      })
    );
    return;
  }

  // Other GET requests: Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
