import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const shell = [...readFileSync('sw.js', 'utf8').matchAll(/^ {2}'([^']+)',$/gm)].map(match => match[1])

test('the service worker caches every source file of the app', () => {
  assert.ok(shell.includes('index.html'))
  const sources = readdirSync('src', { recursive: true })
    .filter(file => /\.(js|css)$/.test(file))
    .map(file => `src/${file}`)
  for (const file of sources) assert.ok(shell.includes(file), file)
})

test('the manifest describes an installable portrait app', () => {
  const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'))
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.orientation, 'portrait')
  assert.ok(shell.includes(manifest.icons[0].src))
})
