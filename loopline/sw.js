const cache = 'loopline-v1'

const shell = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'src/main.js',
  'src/core/daily.js',
  'src/core/game.js',
  'src/core/levels.js',
  'src/core/rng.js',
  'src/core/solver.js',
  'src/ui/board.js',
  'src/ui/feedback.js',
  'src/ui/progress.js',
  'src/ui/style.css',
]

const fresh = async request => {
  const response = await fetch(request)
  if (response.ok) await (await caches.open(cache)).put(request, response.clone())
  return response
}

const offline = async request => (await caches.match(request, { ignoreSearch: true })) ?? Response.error()

addEventListener('install', event => {
  event.waitUntil(caches.open(cache).then(c => c.addAll(shell)))
  skipWaiting()
})

addEventListener('activate', event => {
  const stale = keys => Promise.all(keys.filter(key => key !== cache).map(key => caches.delete(key)))
  event.waitUntil(
    caches
      .keys()
      .then(stale)
      .then(() => clients.claim()),
  )
})

addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  event.respondWith(fresh(event.request).catch(() => offline(event.request)))
})
