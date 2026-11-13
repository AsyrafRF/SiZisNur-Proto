/* Local-first shell cache only. Transaction sync still requires an authenticated API. */
const CACHE_NAME = 'sizisnur-shell-v5-20261113-tenant-territories1'
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/app.js', './js/revision-v5.js', './js/qrcode.js',
  './assets/favicon.png', './assets/sizisnur-logo-mark.png'
]
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('sizisnur-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
    }
    return response
  }).catch(() => request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
})
