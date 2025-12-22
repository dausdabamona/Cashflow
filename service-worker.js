// Kiyosaki Finance Tracker - Service Worker
const CACHE_NAME = 'kiyosaki-tracker-v5';
const STATIC_CACHE = 'kiyosaki-static-v5';
const DYNAMIC_CACHE = 'kiyosaki-dynamic-v5';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.html',
  '/css/style.css',
  '/js/config.js',
  '/js/utils.js',
  '/js/auth.js',
  '/js/app.js',
  '/js/dashboard.js',
  '/js/transaction.js',
  '/js/settings.js',
  '/js/report.js',
  '/js/gamification.js',
  '/manifest.json'
];

// External CDN resources
const CDN_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.log('[SW] Some assets failed to cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip Supabase API calls - always go to network
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(request));
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((response) => {
            return response || caches.match('/app.html');
          });
        })
    );
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return offline fallback for images
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#E5E7EB" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="#9CA3AF" font-size="12">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            return null;
          });
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Ada notifikasi baru',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/app.html'
    },
    actions: [
      { action: 'open', title: 'Buka' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Kiyosaki Tracker', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = event.notification.data?.url || '/app.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions());
  }
});

// Sync offline transactions
async function syncOfflineTransactions() {
  try {
    const db = await openDB();
    const tx = db.transaction('offline-transactions', 'readonly');
    const store = tx.objectStore('offline-transactions');
    const transactions = await store.getAll();

    for (const transaction of transactions) {
      try {
        // Send to server
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });

        // Remove from offline store
        const deleteTx = db.transaction('offline-transactions', 'readwrite');
        deleteTx.objectStore('offline-transactions').delete(transaction.id);
      } catch (err) {
        console.error('[SW] Failed to sync transaction:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err);
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kiyosaki-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-transactions')) {
        db.createObjectStore('offline-transactions', { keyPath: 'id' });
      }
    };
  });
}

console.log('[SW] Service Worker loaded');
