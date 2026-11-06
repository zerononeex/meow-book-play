// Bump CACHE when shipping changes so installed iPads pick up the new files.
const CACHE = 'meow-library-v3';
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
const PRECACHE = ['./', 'index.html', 'assets/enter-hero.jpg', 'assets/library-background.jpg',
  'assets/congrats-cat.jpg', 'icon-512.png', 'apple-touch-icon.png', 'manifest.webmanifest',
  ...['home', 'music', 'star', 'gear', 'arrow', 'readagain'].map(n => `assets/icons/${n}.png`)];

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE)
    .then(c => c.addAll(PRECACHE)
      // PDF.js too, so the reader works offline even if no book was opened online. Non-fatal.
      .then(() => c.addAll([CDN + 'pdf.min.js', CDN + 'pdf.worker.min.js']).catch(() => {})))
    .then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url), cdn = url.hostname === 'cdnjs.cloudflare.com';
  if (req.method !== 'GET' || (!cdn && url.origin !== location.origin)) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (cdn && (res.ok || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  })));
});
