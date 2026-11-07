import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const res = join(import.meta.dirname, '..', 'android', 'app', 'src', 'main', 'res')
const background = '#05060b'
const plasma = '#38e1ff'

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="7 7 50 50" width="100%" height="100%">
  <path d="M18 46 32 32 46 18" stroke="${plasma}" stroke-width="5" stroke-linecap="round"/>
  <rect x="9" y="37" width="18" height="18" rx="5" fill="${background}" stroke="${plasma}" stroke-width="3"/>
  <rect x="23" y="23" width="18" height="18" rx="5" fill="${plasma}"/>
  <rect x="37" y="9" width="18" height="18" rx="5" fill="${background}" stroke="${plasma}" stroke-width="3"/>
</svg>`

const page = (fill, share, radius = '0') =>
  `<body style="margin:0;background:transparent">
    <div style="width:100vw;height:100vh;display:grid;place-items:center;background:${fill};border-radius:${radius}">
      <div style="width:${share}vmin;height:${share}vmin">${mark}</div>
    </div></body>`

const targets = []
for (const dir of readdirSync(res)) {
  for (const name of readdirSync(join(res, dir))) {
    const path = join(res, dir, name)
    if (name === 'ic_launcher.png') targets.push({ path, html: page(background, 62) })
    if (name === 'ic_launcher_round.png') targets.push({ path, html: page(background, 58, '50%') })
    if (name === 'ic_launcher_foreground.png') targets.push({ path, html: page('transparent', 40) })
    if (name === 'splash.png') targets.push({ path, html: page(background, 22) })
  }
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
})
for (const target of targets) {
  const png = readFileSync(target.path)
  const width = png.readUInt32BE(16)
  const height = png.readUInt32BE(20)
  const tab = await browser.newPage({ viewport: { width, height } })
  await tab.setContent(target.html)
  await tab.screenshot({ path: target.path, omitBackground: true })
  await tab.close()
}
await browser.close()
console.log(`rendered ${targets.length} Android images`)
