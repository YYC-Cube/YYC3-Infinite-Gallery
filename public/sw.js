/**
 * YYC³ Infinite Gallery Service Worker
 * @description 应用壳离线缓存；媒体流、Range 请求和宿主 API 不进入自动缓存
 * @author YYC³
 * @version 3.0.0
 * @created 2026-01-15
 * @updated 2026-11-19
 */

const SW_BUILD = "__YYC3_SW_VERSION__";
const STATIC_CACHE = `yyc3-static-${SW_BUILD}`;
const RUNTIME_CACHE = `yyc3-runtime-${SW_BUILD}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  OFFLINE_URL,
  "/D-icons/icon-192.png",
  "/D-icons/icon-512.png",
];

try {
  importScripts("/sw-assets.js");
} catch {
  /* 开发环境或无构建清单时仅缓存应用壳 */
}

const BUILD_ASSETS = Array.isArray(self.__YYC3_PRECACHE__)
  ? self.__YYC3_PRECACHE__
  : [];
const ALL_PRECACHE_URLS = [...new Set([...PRECACHE_URLS, ...BUILD_ASSETS])];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        ALL_PRECACHE_URLS.map((url) =>
          cache.add(url).catch((error) => {
            console.warn("[SW] 预缓存跳过", url, error);
          }),
        ),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

function isMediaRequest(request, url) {
  return (
    request.headers.has("range") ||
    /\.(mp3|mp4|m4a|aac|ogg|ogv|webm|wav|flac|mov|m3u8|ts)(\?|$)/i.test(
      url.pathname,
    ) ||
    url.pathname.startsWith("/hls/") ||
    url.pathname.startsWith("/api/")
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.status === 200 && response.type === "basic") {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function navigationHandler(request) {
  try {
    const cached = await caches.match("/", { ignoreVary: true });

    // 应用壳立即从缓存返回，避免离线导航等待网络超时；在线时后台刷新。
    if (cached) {
      fetch(request)
        .then(async (response) => {
          if (response.ok && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            await cache.put("/", response.clone());
          }
        })
        .catch(() => undefined);
      return cached;
    }

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put("/", response.clone());
    }
    return response;
  } catch {
    const offline = await caches.match(OFFLINE_URL, { ignoreVary: true });
    if (offline) return offline;
    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok && response.status === 200 && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached ?? new Response("Offline", { status: 503 }));
  return cached ?? network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isMediaRequest(request, url)) return;
  if (url.pathname.startsWith("/v1/")) return;

  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(navigationHandler(request));
    return;
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "manifest" ||
    url.pathname.startsWith("/_next/static/") ||
    PRECACHE_URLS.includes(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // 其余同源 GET 以缓存优先兜底；媒体与宿主 API 已在上面跳过。
  event.respondWith(staleWhileRevalidate(request));
});
