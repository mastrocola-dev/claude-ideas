import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)

test('the service worker shell lists every source file', () => {
  const worker = readFileSync(new URL('sw.js', root), 'utf8')
  const sources = readdirSync(new URL('src', root), { recursive: true }).filter(file => /\.(js|css)$/.test(file))
  for (const file of sources) assert.ok(worker.includes(`'src/${file}'`), `${file} missing from the shell`)
})

test('the manifest points at the icon and the start page', () => {
  const manifest = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'))
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.icons[0].src, 'icon.svg')
})
