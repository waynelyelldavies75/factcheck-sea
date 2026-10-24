const C = 'fc-v1', SHELL = ['/', '/manifest.webmanifest'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(SHELL))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return; // API always live
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('/'))));
});
