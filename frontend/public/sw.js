/* AdaptiveMind service worker: network-first pages, immutable static assets. */
const CACHE_VERSION = "v2";
const STATIC_CACHE = `adaptivemind-static-${CACHE_VERSION}`;
const OFFLINE_CACHE = `adaptivemind-offline-${CACHE_VERSION}`;
const CACHE_PREFIX = "adaptivemind-";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX))
          .filter((key) => key !== STATIC_CACHE && key !== OFFLINE_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

function isCacheableStaticAsset(url) {
  return url.origin === self.location.origin
    && (
      url.pathname.startsWith("/_next/static/")
      || /\.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$/i.test(url.pathname)
    );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET"
    || url.origin !== self.location.origin
    || url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return fallback ?? Response.error();
      }),
    );
    return;
  }

  if (!isCacheableStaticAsset(url)) return;
  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(STATIC_CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    }),
  );
});
