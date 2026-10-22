const CACHE_NAME = 'mcc-chronicles-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
];

// Offline Broadsheet HTML fallback page
const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline Dispatch Notice - The MCC Chronicles</title>
  <style>
    body {
      margin: 0;
      padding: 2rem 1rem;
      background-color: #FAF7F2;
      color: #1a1a1a;
      font-family: 'Georgia', serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .broadsheet-card {
      max-width: 580px;
      background: #FFFFFF;
      border: 3px double #7B1113;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    .masthead-flag {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #C59B27;
      font-weight: bold;
      margin-bottom: 0.75rem;
    }
    h1 {
      font-size: 2rem;
      color: #7B1113;
      margin: 0 0 1rem;
      line-height: 1.15;
    }
    p {
      font-size: 1rem;
      line-height: 1.6;
      color: #4a4a4a;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.65rem 1.5rem;
      background-color: #7B1113;
      color: #FFFFFF;
      text-decoration: none;
      font-size: 0.8rem;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.08em;
      border-radius: 4px;
      cursor: pointer;
    }
    .divider {
      border-bottom: 1px solid #e0dcd3;
      margin: 1.5rem 0;
    }
    .tagline {
      font-size: 0.75rem;
      color: #888888;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="broadsheet-card">
    <div class="masthead-flag">The Madras Christian College Chronicles • Offline Dispatch</div>
    <h1>Network Signal Interrupted</h1>
    <div class="divider"></div>
    <p>
      The broadsheet press cannot connect to the live Tambaram server. You appear to be disconnected from the network or browsing offline in the scrub jungle.
    </p>
    <p>
      Cached articles remain readable. Reconnect to the collegiate Wi-Fi or mobile network to receive breaking dispatches.
    </p>
    <button class="btn" onclick="window.location.reload()">Attempt Reconnection</button>
    <div class="divider"></div>
    <div class="tagline">Official Broadsheet of Record • Madras Christian College • Founded 1837</div>
  </div>
</body>
</html>`;

// Install event: Precache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up previous cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first for dynamic content with cache & offline broadsheet fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip chrome-extension or external cross-origin analytics
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful responses for same-origin static assets
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          url.origin === self.location.origin &&
          !url.pathname.startsWith('/api')
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed: Check cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If request is navigation (HTML page), return the offline broadsheet page
        if (event.request.mode === 'navigate') {
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }

        return new Response('Network unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
  );
});
