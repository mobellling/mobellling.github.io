/**
 * Retired service worker.
 *
 * This file intentionally has no fetch handler. It exists only to clean up
 * installations of the previous cache-first worker:
 *   1. delete the old `mobell-sw-*` caches,
 *   2. remove the old IndexedDB metadata,
 *   3. tell open pages that the worker is retired,
 *   4. unregister itself.
 *
 * Once all returning visitors have received this worker it can be deleted,
 * together with the `/sw.js` entry in public/_headers.
 */

'use strict';

const CACHE_PREFIX = 'mobell-sw-';
const DB_NAME = 'mobell-sw';

function deleteDatabase() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    let request;
    try {
      request = indexedDB.deleteDatabase(DB_NAME);
    } catch {
      resolve();
      return;
    }

    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    // Another tab can still hold a connection; do not block cleanup forever.
    request.onblocked = () => resolve();
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)));
      } catch (error) {
        console.warn('[SW retired] cache cleanup failed', error);
      }

      await deleteDatabase();

      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clients) {
          try {
            client.postMessage({ type: 'SW_RETIRED' });
          } catch {
            // The page may already be closing.
          }
        }
      } catch (error) {
        console.warn('[SW retired] client notification failed', error);
      }

      try {
        await self.registration.unregister();
      } catch (error) {
        // Without a fetch handler this worker is a harmless pass-through even
        // if unregistering fails; the page-side cleanup will try again.
        console.warn('[SW retired] unregister failed', error);
      }
    })()
  );
});
