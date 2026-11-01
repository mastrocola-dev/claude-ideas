import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const port = 5179
const url = `http://localhost:${port}/`
const shots = new URL('../docs/screenshots/', import.meta.url).pathname
const server = spawn('node', ['scripts/serve.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' })
await new Promise(resolve => setTimeout(resolve, 400))
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
const errors = []
page.on('pageerror', error => errors.push(error.message))

const playLevel = async (number, shot) => {
  const level = await page.evaluate(() => window.loopline.level())
  assert.equal(level.number, number)
  for (const [i, [x, y]] of level.solution.entries()) {
    const [px, py] = await page.evaluate(([x, y]) => window.loopline.pointFor(x, y), [x, y])
    await page.mouse.click(px, py)
    await page.waitForTimeout(60)
    if (shot && i === 2) await page.screenshot({ path: `${shots}level.png` })
  }
  await page.locator('#result:not([hidden])').waitFor()
  assert.equal(await page.textContent('#result-title'), 'Loop cleared!')
}

try {
  await page.goto(url)
  await page.screenshot({ path: `${shots}title.png` })
  await page.click('#play')
  await playLevel(1, false)
  await page.click('#result-next')
  await playLevel(2, false)
  await page.click('#result-next')
  await playLevel(3, false)
  await page.click('#result-next')
  await playLevel(4, true)
  await page.screenshot({ path: `${shots}win.png` })
  await page.reload()
  await page.click('#choose')
  assert.equal(await page.locator('#level-grid button:not([disabled])').count(), 5)
  await page.click('#level-grid button >> nth=4')
  assert.equal(await page.textContent('#level-label'), 'Level 5')
  await page.click('#home')
  await page.click('#sound')
  await page.reload()
  assert.equal(await page.textContent('#sound'), 'Sound off')
  await page.evaluate(() => {
    navigator.share = ({ text }) => {
      window.shared = text
      return Promise.resolve()
    }
  })
  await page.click('#daily')
  await playLevel('daily', false)
  await page.click('#result-share')
  assert.match(await page.evaluate(() => window.shared), /^Loopline Daily \d{4}-\d{2}-\d{2}\n/)
  await page.click('#result-next')
  assert.equal(await page.textContent('#daily'), 'Daily Loop 🔥1')
  assert.deepEqual(errors, [])
  console.log('e2e passed: levels 1-4 won by touch, progress and mute kept after reload, daily shared')
} finally {
  await browser.close()
  server.kill()
}
