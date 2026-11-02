import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const axeScript = new URL('../node_modules/axe-core/axe.min.js', import.meta.url).pathname

const port = 5181
const shots = new URL('../docs/screenshots/', import.meta.url).pathname
const server = spawn('node', ['scripts/serve.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' })
await new Promise(resolve => setTimeout(resolve, 400))
mkdirSync(shots, { recursive: true })

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',
})
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  locale: 'en-US',
})
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

const audit = async name => {
  await page.addScriptTag({ path: axeScript })
  const { violations } = await page.evaluate(() => window.axe.run())
  const blocking = violations.filter(({ impact }) => ['serious', 'critical'].includes(impact))
  assert.deepEqual(
    blocking.flatMap(({ id, nodes }) => nodes.map(node => `${name}: ${id} ${node.html}`)),
    [],
  )
}

const auditForced = async (name, changes) => {
  await page.evaluate(next => window.saltscript.play({ ...window.saltscript.run(), ...next }), changes)
  await audit(name)
}

const tapPath = async path => {
  for (const cell of path) {
    const point = await page.evaluate(c => window.saltscript.pointFor(c), cell)
    await page.mouse.click(...point)
  }
  await page.click('#write')
}

const screen = () => page.evaluate(() => window.saltscript.run().screen)

const foeSettled = () =>
  page.waitForFunction(() => {
    const run = window.saltscript.run()
    return run.screen !== 'combat' || run.combat.strokes > 0
  })

try {
  await page.goto(`http://localhost:${port}/`)
  await page.screenshot({ path: `${shots}title.png` })
  await page.click('#open-settings')
  await audit('settings')
  assert.equal(await page.isChecked('#setting-sound'), true)
  assert.equal(await page.isChecked('#setting-music'), true)
  await page.click('#setting-sound')
  await page.click('#setting-music')
  await page.click('#language-pt')
  assert.equal(await page.textContent('#new-run'), 'Começar uma nova noite')
  await page.screenshot({ path: `${shots}settings.png` })
  await page.click('#settings-close')
  await page.reload()
  assert.equal(await page.textContent('#new-run'), 'Começar uma nova noite')
  assert.equal(await page.getAttribute('html', 'lang'), 'pt-BR')
  await page.click('#open-settings')
  assert.equal(await page.isChecked('#setting-sound'), false)
  assert.equal(await page.isChecked('#setting-music'), false)
  await page.click('#setting-sound')
  await page.click('#setting-music')
  await page.click('#language-en')
  await page.click('#settings-close')
  assert.equal(await page.textContent('#new-run'), 'Begin a new night')
  await page.click('#new-run')
  await page.screenshot({ path: `${shots}map.png` })
  const firstFloorLinks = await page.evaluate(() =>
    window.saltscript.run().map[0].reduce((sum, node) => sum + node.links.length, 0),
  )
  assert.equal(await page.locator('#links line[data-floor="0"]').count(), firstFloorLinks)
  await page.click('#map-codex')
  assert.equal(await page.locator('#codex').isVisible(), true)
  await page.click('#codex-close')
  await page.click('.node.open >> nth=0')
  assert.equal(await screen(), 'combat')
  assert.equal(await page.locator('#hint').isVisible(), true)
  const foeName = await page.textContent('#foe-name')
  await page.click('#combat-settings')
  await page.click('#language-pt')
  await page.click('#settings-close')
  assert.notEqual(await page.textContent('#foe-name'), foeName)
  assert.equal(await page.textContent('#end-turn'), 'Encerrar turno')
  await page.screenshot({ path: `${shots}combat-pt.png` })
  await page.click('#combat-settings')
  await page.click('#language-en')
  await page.click('#settings-close')
  assert.equal(await page.textContent('#foe-name'), foeName)
  await page.click('#combat-codex')
  assert.match(await page.textContent('#codex-tiers'), /Canticle/)
  await page.screenshot({ path: `${shots}codex.png` })
  await page.click('#codex-close')
  let shot = false
  for (let stroke = 0; stroke < 60 && (await screen()) === 'combat'; stroke++) {
    await foeSettled()
    if ((await screen()) !== 'combat') break
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
    if (stroke === 0) {
      assert.ok((await page.locator('#foe .float, #you .float').count()) >= 1)
      await page.screenshot({ path: `${shots}combat-feedback.png` })
      assert.ok((await page.locator('#preview .flourish').count()) === 1)
    }
  }
  assert.equal(await screen(), 'reward')
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('saltscript.meta')).hints), 3)
  await page.waitForSelector('#reward:not([hidden])')
  await page.screenshot({ path: `${shots}reward.png` })
  const before = await page.evaluate(() => window.saltscript.run().bag.length)
  await page.click('#reward-runes button >> nth=0')
  assert.equal(await screen(), 'map')
  assert.equal(await page.evaluate(() => window.saltscript.run().bag.length), before + 1)
  await page.reload()
  await page.click('#continue')
  assert.equal(await page.locator('#map').isVisible(), true)
  assert.ok((await page.locator('.node.open').count()) >= 1)
  assert.ok((await page.locator('#links line.walked, .node.lost').count()) >= 1)
  await page.screenshot({ path: `${shots}map-walked.png` })
  await page.click('.node.open >> nth=0')
  if ((await screen()) === 'combat') assert.equal(await page.locator('#hint').isVisible(), false)
  await page.evaluate(() =>
    localStorage.setItem(
      'saltscript.meta',
      JSON.stringify({ lamplight: 100, unlocked: [], scribe: 'lastScribe', banked: null }),
    ),
  )
  await page.reload()
  await page.click('[data-unlock="emberNovice"]')
  await page.click('[data-scribe="emberNovice"]')
  await page.screenshot({ path: `${shots}unlocks.png`, fullPage: true })
  await page.reload()
  assert.equal(await page.locator('[data-unlock="emberNovice"]').isDisabled(), true)
  assert.match(await page.textContent('#lamplight'), /Lamplight 60/)
  await page.click('#new-run')
  assert.deepEqual(await page.evaluate(() => window.saltscript.run().marks), ['emberPsalm'])
  await page.reload()
  await page.click('#daily')
  const today = new Date().toISOString().slice(0, 10)
  assert.equal(await page.evaluate(() => window.saltscript.run().daily), today)
  await page.reload()
  assert.equal(await page.locator('#daily').isDisabled(), true)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => navigator.serviceWorker.controller)
  await page.context().setOffline(true)
  await page.reload()
  await page.click('#new-run')
  assert.equal(await screen(), 'map')
  assert.equal((await page.locator('.node.open').count()) >= 1, true)
  await page.context().setOffline(false)
  await audit('title offline')
  await page.click('.node.open >> nth=0')
  assert.equal(await screen(), 'combat')
  await audit('combat')
  await page.click('#combat-codex')
  await audit('codex')
  await page.click('#codex-close')
  for (let stroke = 0; stroke < 60 && (await screen()) === 'combat'; stroke++) {
    await foeSettled()
    if ((await screen()) !== 'combat') break
    const path = await page.evaluate(() => window.saltscript.hint())
    if (path) await tapPath(path)
    else if (await page.locator('#end-turn').isEnabled()) await page.click('#end-turn')
  }
  assert.equal(await screen(), 'reward')
  await page.waitForSelector('#reward:not([hidden])')
  await audit('reward')
  const rune = { id: 'audit', ink: 'moss', value: 2 }
  await auditForced('map', { screen: 'map', offer: null, combat: null, floor: -1 })
  await auditForced('market', { screen: 'market', offer: { runes: [rune], marks: ['lampOil'] } })
  await auditForced('rest', { screen: 'rest', offer: { upgrades: [] } })
  await auditForced('shrine', { screen: 'shrine', offer: { shrine: 'lamp' } })
  await auditForced('end', { screen: 'defeat' })
  await page.click('#end-title-screen')
  await audit('title')
  assert.deepEqual(errors, [])
  console.log(
    'e2e passed: fights won by swipes and by taps, every screen audited, run continued after reload and offline',
  )
} finally {
  await browser.close()
  server.kill()
}
