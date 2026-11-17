// Offline service worker. precache.json (made by `node tools/build.js`) lists every file;
// after one online visit the whole game, including your voice clips, works in airplane mode.
const VERSION = 'c7ea2efb4d';
const CACHE = 'magic-land-' + VERSION;

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let files = ['./', 'index.html'];
    try {
      const r = await fetch('precache.json', { cache: 'no-cache' });
      files = (await r.json()).files;
    } catch (err) {}
    // add one by one so a single missing file can never break the whole install
    await Promise.all(files.map(f => cache.add(new Request(f, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match('index.html')))
  );
});
