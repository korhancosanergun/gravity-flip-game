/* ============================================================
   Gravity Flip — Service Worker
   Strategy: network-first → cache fallback (offline support)
   API calls (/api/*) are never intercepted.
   ============================================================ */

const CACHE = 'gf-cache-v1';

// ── Install: activate immediately, no pre-caching ────────────
self.addEventListener('install', () => self.skipWaiting());

// ── Activate: claim all clients ───────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// ── Fetch: network-first, cache as fallback ───────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API responses
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          // Store fresh copy in cache
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() =>
        // Network failed — serve cached version
        caches.match(request).then(
          (cached) => cached ?? new Response('Offline', { status: 503 }),
        ),
      ),
  );
});

// ── Messages from app ─────────────────────────────────────────
self.addEventListener('message', (e) => {
  if (e.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE);
  }
});
