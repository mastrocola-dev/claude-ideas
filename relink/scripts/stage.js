import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const target = join(root, 'www')
const shipped = ['index.html', 'icon.svg', 'manifest.webmanifest', 'src']

rmSync(target, { recursive: true, force: true })
mkdirSync(target)
for (const entry of shipped) cpSync(join(root, entry), join(target, entry), { recursive: true })
console.log(`staged ${shipped.join(', ')} into www/`)
