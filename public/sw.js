/**
 * YYC3 3D Gallery - Service Worker
 * @description PWA Service Worker for offline support and caching
 * @author YYC³
 * @version 2.0.0
 * @created 2026-01-15
 */

const CACHE_NAME = 'yyc3-gallery-v2.0.0';
const STATIC_CACHE = 'yyc3-static-v2.0.0';
const DYNAMIC_CACHE = 'yyc3-dynamic-v2.0.0';

// 静态资源列表 - 预缓存
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/globals.css',
  '/D-1998.png',
  '/YYC3-Family-001.png',
  '/1.webp',
  '/2.webp',
  '/3.webp',
  '/4.webp',
  '/5.webp',
  '/6.webp',
  '/7.webp',
  '/8.webp',
];

// 安装事件 - 预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// 拦截请求 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过外部请求
  if (!url.origin.includes(self.location.origin) && !url.origin.includes('gallery.yyc3.top')) {
    return;
  }

  // 静态资源 - Cache First 策略
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.url.includes('/_next/static/') ||
    STATIC_ASSETS.some(asset => request.url.includes(asset))
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 图片资源 - Cache First 策略
  if (
    request.destination === 'image' ||
    request.url.match(/\.(png|jpg|jpeg|gif|webp|svg|avif|ico)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API请求 - Network First 策略
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // HTML页面 - Network First 策略
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 其他资源 - Stale While Revalidate 策略
  event.respondWith(staleWhileRevalidate(request));
});

// Cache First 策略
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First error:', error);
    
    // 返回离线页面
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/offline.html');
    }
    
    return new Response('Network error occurred', { status: 408 });
  }
}

// Network First 策略
async function networkFirst(request) {
  try {
    console.log('[SW] Fetching from network (Network First):', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/offline.html');
    }
    
    return new Response('You are offline', { status: 503 });
  }
}

// Stale While Revalidate 策略
async function staleWhileRevalidate(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
    
    return cachedResponse || fetchPromise;
  } catch (error) {
    console.error('[SW] Stale While Revalidate error:', error);
    return caches.match(request);
  }
}

// 后台同步
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  console.log('[SW] Syncing pending requests...');
  // 实现后台同步逻辑
}

// 推送通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/D-icons/ios/AppIcon.appiconset/Icon-App-192x192@2x.png',
    badge: '/D-icons/ios/AppIcon.appiconset/Icon-App-72x72@2x.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: '查看',
        icon: '/D-icons/ios/AppIcon.appiconset/Icon-App-72x72@2x.png',
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/D-icons/ios/AppIcon.appiconset/Icon-App-72x72@2x.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('YYC3 3D Gallery', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://gallery.yyc3.top')
    );
  }
});

// 消息事件 - 与客户端通信
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');
