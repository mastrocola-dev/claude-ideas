import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const port = 5181
const shots = new URL('../docs/screenshots/', import.meta.url).pathname
const server = spawn('node', ['scripts/serve.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' })
await new Promise(resolve => setTimeout(resolve, 400))
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort())
const errors = []
page.on('pageerror', error => errors.push(error.message))

const swipe = async path => {
  const points = []
  for (const cell of path) points.push(await page.evaluate(c => window.saltscript.pointFor(c), cell))
  await page.mouse.move(...points[0])
  await page.mouse.down()
  for (const point of points.slice(1)) await page.mouse.move(...point, { steps: 4 })
  await page.mouse.up()
}

const screen = () => page.evaluate(() => window.saltscript.run().screen)

try {
  await page.goto(`http://localhost:${port}/`)
  await page.screenshot({ path: `${shots}title.png` })
  await page.click('#new-run')
  await page.screenshot({ path: `${shots}map.png` })
  await page.click('.node.open >> nth=0')
  assert.equal(await screen(), 'combat')
  let shot = false
  for (let stroke = 0; stroke < 60 && (await screen()) === 'combat'; stroke++) {
    const path = await page.evaluate(() => window.saltscript.hint())
    if (!path) {
      await page.click('#end-turn')
      continue
    }
    if (!shot && stroke === 2) {
      const points = []
      for (const cell of path) points.push(await page.evaluate(c => window.saltscript.pointFor(c), cell))
      await page.mouse.move(...points[0])
      await page.mouse.down()
      for (const point of points.slice(1)) await page.mouse.move(...point, { steps: 4 })
      await page.waitForTimeout(80)
      await page.screenshot({ path: `${shots}combat.png` })
      await page.mouse.up()
      shot = true
      continue
    }
    await swipe(path)
  }
  assert.equal(await screen(), 'reward')
  await page.screenshot({ path: `${shots}reward.png` })
  const before = await page.evaluate(() => window.saltscript.run().bag.length)
  await page.click('#reward-runes button >> nth=0')
  assert.equal(await screen(), 'map')
  assert.equal(await page.evaluate(() => window.saltscript.run().bag.length), before + 1)
  await page.reload()
  await page.click('#continue')
  assert.equal(await page.locator('#map').isVisible(), true)
  assert.ok((await page.locator('.node.open').count()) >= 1)
  assert.deepEqual(errors, [])
  console.log('e2e passed: first fight won by real swipes, reward taken, run continued after reload')
} finally {
  await browser.close()
  server.kill()
}
