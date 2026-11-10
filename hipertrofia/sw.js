// Service worker: app shell em cache; /api e /.auth nunca passam pelo cache
const CACHE = 'jnt-hiper-v1';
const ASSETS = ['./', 'index.html', 'styles.css', 'lib.js', 'polar.js', 'app.js', 'manifest.webmanifest',
  'data/programa.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png', 'icons/icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/.auth/')) return;
  // rede primeiro (pega atualizações), cache como reserva offline
  event.respondWith(fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req)));
});
