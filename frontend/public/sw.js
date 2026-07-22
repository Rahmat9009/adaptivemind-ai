/* AdaptiveMind Service Worker — Application-Shell Caching */
const CACHE_NAME = "adaptivemind-shell-v1";
const PRECACHE_URLS = ["/", "/dashboard", "/tutor", "/planner", "/assessment"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never cache API requests, mutations, or secret-bearing URLs
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("supabase") ||
    request.url.includes("anthropic") ||
    request.url.includes("openai") ||
    request.url.includes(".env")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});
