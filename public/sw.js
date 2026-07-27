const CACHE_NAME = 'nexora-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ignore errors for individual files that might not exist
      return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Stale-While-Revalidate strategy for API responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Cache-First strategy for static assets (CSS, fonts, images)
  const isStaticAsset = 
    request.destination === 'style' || 
    request.destination === 'font' || 
    request.destination === 'image' || 
    request.destination === 'script' ||
    url.pathname.match(/\.(css|woff|woff2|ttf|eot|png|jpg|jpeg|svg|gif|webp|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default fallback (Network first, then cache)
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-appointments') {
    event.waitUntil(syncAppointments());
  }
});

async function syncAppointments() {
  try {
    // Fetch updated bookings from the server API
    const response = await fetch('/api/bookings');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const bookings = await response.json();

    // Update the 'nexora_bookings' entry in IndexedDB
    await updateBookingsInIndexedDB(bookings);

    // Send a 'SYNC_COMPLETE' message via BroadcastChannel
    const channel = new BroadcastChannel('nexora_sync_channel');
    channel.postMessage({ type: 'SYNC_COMPLETE', payload: bookings });
    channel.close();
  } catch (error) {
    console.error('Background sync for appointments failed:', error);
  }
}

function updateBookingsInIndexedDB(bookings) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nexora_db', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('store')) {
        // If the store doesn't exist but we didn't upgrade, just resolve (prevent errors in edge cases)
        resolve();
        return;
      }

      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      const putRequest = store.put(bookings, 'nexora_bookings');

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
