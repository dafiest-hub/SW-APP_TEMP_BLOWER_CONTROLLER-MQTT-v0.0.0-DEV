const CACHE = 'blower-ctrl-v1'
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/mqtt@5.3.5/dist/mqtt.min.js'
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // fallback to local-only assets if CDN fails
      cache.addAll(ASSETS).catch(() =>
        cache.addAll(ASSETS.filter(a => !a.startsWith('http')))
      )
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
