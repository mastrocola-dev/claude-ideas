const shellCache = 'saltscript-shell-v2'
const fontCache = 'saltscript-fonts-v1'
const shell = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'src/main.js',
  'src/core/bot.js',
  'src/core/combat.js',
  'src/core/daily.js',
  'src/core/data.js',
  'src/core/meta.js',
  'src/core/rng.js',
  'src/core/run.js',
  'src/ui/board.js',
  'src/ui/feedback.js',
  'src/ui/i18n.js',
  'src/ui/locales/en.js',
  'src/ui/locales/pt.js',
  'src/ui/music.js',
  'src/ui/routes.js',
  'src/ui/settings.js',
  'src/ui/sound.js',
  'src/ui/store.js',
  'src/ui/style.css',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(shellCache)
      .then(cache => cache.addAll(shell))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  const current = [shellCache, fontCache]
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => !current.includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const staleWhileRevalidate = async (request, name) => {
  const cache = await caches.open(name)
  const cached = await cache.match(request)
  const fresh = fetch(request).then(response => {
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
    return response
  })
  if (!cached) return fresh
  fresh.catch(() => null)
  return cached
}

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return
  const { hostname, origin } = new URL(request.url)
  if (origin === location.origin) event.respondWith(staleWhileRevalidate(request, shellCache))
  else if (/^fonts\.(googleapis|gstatic)\.com$/.test(hostname))
    event.respondWith(staleWhileRevalidate(request, fontCache))
})
