/* AdaptiveMind production service worker. AI and source APIs are network-only. */
const CACHE_VERSION = "core-2026-07-23-v2";
const STATIC_CACHE = `adaptivemind-static-${CACHE_VERSION}`;
const SHELL_CACHE = `adaptivemind-shell-${CACHE_VERSION}`;
const CACHE_PREFIX = "adaptivemind-";
const OFFLINE_URL = "/offline.html";
const SHELL_ROUTES = [
  "/",
  "/dashboard",
  "/tutor",
  "/planner",
  "/downloads",
  "/privacy",
  "/assessment",
  "/assessment/results",
];

function staticAssetUrls(html) {
  const matches = html.matchAll(
    /(?:src|href)=["'](\/_next\/static\/[^"'?#]+)["']/g,
  );
  return [...new Set([...matches].map((match) => match[1]))];
}

async function cacheShellRoute(route, shellCache, staticCache) {
  try {
    const response = await fetch(route, { cache: "reload" });
    if (!response.ok) return;
    const html = await response.clone().text();
    await shellCache.put(route, response);
    const assets = staticAssetUrls(html);
    await Promise.allSettled(
      assets.map(async (asset) => {
        const assetResponse = await fetch(asset, { cache: "reload" });
        if (assetResponse.ok) await staticCache.put(asset, assetResponse);
      }),
    );
  } catch {
    // A partial shell still provides the dedicated offline page.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(SHELL_CACHE),
      caches.open(STATIC_CACHE),
    ]).then(async ([shellCache, staticCache]) => {
      await shellCache.addAll([
        OFFLINE_URL,
        "/manifest.json",
        "/icon.svg",
        "/icon-192.png",
        "/icon-512.png",
      ]);
      await Promise.all(
        SHELL_ROUTES.map((route) =>
          cacheShellRoute(route, shellCache, staticCache),
        ),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX))
            .filter((key) => key !== STATIC_CACHE && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.registration.navigationPreload
        ? self.registration.navigationPreload.enable()
        : Promise.resolve(),
    ]).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isCacheableStaticAsset(url) {
  return (
    url.origin === self.location.origin
    && (
      url.pathname.startsWith("/_next/static/")
      || /\.(?:css|js|woff2?|png|jpg|jpeg|webp|svg|ico)$/i.test(
        url.pathname,
      )
    )
  );
}

async function navigationResponse(event, request, url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const preload = await event.preloadResponse;
    const response = preload ?? await fetch(request, {
      signal: controller.signal,
    });
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(url.pathname, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return (
      await cache.match(url.pathname, { ignoreSearch: true })
      ?? await cache.match(OFFLINE_URL)
      ?? Response.error()
    );
  } finally {
    clearTimeout(timeout);
  }
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
    event.respondWith(navigationResponse(event, request, url));
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
