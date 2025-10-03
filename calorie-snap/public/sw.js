const CACHE_NAME = 'calorie-snap-precache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== 'GET') return;

  // Runtime cache for API (stale-while-revalidate)
  const isAPI = request.url.includes('/v1/nutrition') || request.url.includes('/v2/natural/nutrients');
  if (isAPI) {
    event.respondWith(
      caches.open('api-runtime').then((cache) =>
        fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // App shell cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
