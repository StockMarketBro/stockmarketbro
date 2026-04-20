const CACHE_NAME = 'stockmarketbro-v3';
const STATIC_ASSETS = ['/manifest.json', '/logo.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // NEVER cache index.html — always fetch fresh from network
  if (url.includes('index.html') || url.endsWith('/') || url === self.location.origin + '/') {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Never cache API calls
  if (
    url.includes('finnhub.io') ||
    url.includes('twelvedata.com') ||
    url.includes('tradingview.com') ||
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('gstatic.com')
  ) {
    return;
  }

  // Cache-first for static assets (logo, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      });
    })
  );
});
