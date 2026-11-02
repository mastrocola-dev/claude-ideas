import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = normalize(join(import.meta.dirname, '..'))
const port = Number(process.env.PORT ?? 5173)
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

const fileFor = url => {
  const path = normalize(join(root, decodeURIComponent(new URL(url, 'http://x').pathname)))
  if (!path.startsWith(root)) return null
  try {
    return statSync(path).isDirectory() ? join(path, 'index.html') : path
  } catch {
    return null
  }
}

createServer((req, res) => {
  const file = fileFor(req.url)
  if (!file) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file)
    .on('error', () => res.end())
    .pipe(res)
}).listen(port, () => console.log(`http://localhost:${port}`))
