const CACHE_NAME = 'stockmarketbro-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Only intercept GET requests for static assets
// Let ALL other requests (Firebase, API, POST) go straight to network
self.addEventListener('fetch', e => {
  const req = e.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  const url = req.url;

  // Never intercept Firebase, Google APIs, TradingView, Finnhub, Twelve Data
  if (
    url.includes('firebase') ||
    url.includes('firestore') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.includes('finnhub.io') ||
    url.includes('twelvedata.com') ||
    url.includes('tradingview.com') ||
    url.includes('identitytoolkit') ||
    url.includes('securetoken') ||
    url.includes('recaptcha')
  ) return;

  // For HTML pages — always network first, no cache
  if (req.destination === 'document' || url.endsWith('.html') || url.endsWith('/')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match(req))
    );
    return;
  }

  // For logo and manifest only — cache first
  if (url.endsWith('logo.png') || url.endsWith('manifest.json')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // Everything else — network only
});
