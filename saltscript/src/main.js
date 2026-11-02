import { bestPath } from './core/bot.js'
import { canExtend, intentOf, isValid, readGlyph } from './core/combat.js'
import { canStartDaily, createDailyRun, dateKey, recordDaily, shareText, startDaily } from './core/daily.js'
import { inks, scribes, unlockCosts } from './core/data.js'
import { bank, chooseScribe, hintSeen, lamplightEarned, runOptions, spend } from './core/meta.js'
import { act, createRun, markPrice, minBag, nodeAt, openLanes, removePrice, runePrice } from './core/run.js'
import { createBoard, numeral } from './ui/board.js'
import { announce } from './ui/feedback.js'
import { applyStatic, glyphName, guide, local, t } from './ui/i18n.js'
import { setMood, syncMusic } from './ui/music.js'
import { drawRoutes } from './ui/routes.js'
import { onSettings, settings, updateSettings } from './ui/settings.js'
import { scratch } from './ui/sound.js'
import { loadMeta, loadRun, saveMeta, saveRun } from './ui/store.js'

const $ = id => document.getElementById(id)
const screens = ['title', 'map', 'combat', 'reward', 'market', 'rest', 'shrine', 'end']
const symbols = { fight: '⚔', elite: '☠', shrine: '✶', market: '⚖', rest: '☾', boss: '♆' }
const board = createBoard($('board'))

let run = loadRun()
let meta = run ? saveMeta(recordDaily(bank(loadMeta(), run), run)) : loadMeta()
let path = []
let foeTimer = null
const foePause = 600

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children.filter(child => child !== null && child !== undefined))
  return node
}

const runeChip = (rune, props = {}) =>
  el(
    props.onclick ? 'button' : 'span',
    { className: `rune ${rune.ink}`, ...props },
    `${inks[rune.ink].mark}${numeral(rune.value)}`,
  )

const runeText = rune => `${local('inks', rune.ink).name} ${numeral(rune.value)}`

const markChoice = (key, extra, onclick) =>
  el(
    'button',
    { type: 'button', className: 'choice', onclick },
    el('span', { className: 'mark' }, '¶'),
    el(
      'span',
      {},
      el('strong', {}, local('marginalia', key).name),
      el('small', {}, `${t(local('marginalia', key).rarity)}. ${local('marginalia', key).text}`),
    ),
    extra,
  )

const runeChoice = (rune, extra, onclick) =>
  el(
    'button',
    { type: 'button', className: 'choice', onclick },
    runeChip(rune),
    el(
      'span',
      {},
      el('strong', {}, runeText(rune)),
      el('small', {}, t('runeDoes', { does: local('inks', rune.ink).does, value: rune.value })),
    ),
    extra,
  )

const show = screen => {
  for (const id of screens) $(id).hidden = id !== screen
  setMood(screen === 'combat' ? 'fight' : 'calm')
}

const statsBar = target =>
  target.replaceChildren(
    el('span', {}, `${t('health')} `, el('b', {}, `${run.hp}/${run.maxHp}`)),
    el('span', {}, `${t('gold')} `, el('b', {}, `${run.gold}`)),
    el('span', {}, `${t('runes')} `, el('b', {}, `${run.bag.length}`)),
  )

const dispatch = action => {
  const before = run
  run = saveRun(act(run, action))
  path = []
  if (before.screen !== 'combat' || before.combat === run.combat) return render()
  renderCombat()
  announce(before.combat, run.combat)
  if (run.screen !== 'combat') setTimeout(render, foePause)
}

const canAct = () => run?.screen === 'combat' && run.combat.strokes > 0

const queueFoe = () => {
  if (foeTimer || run.screen !== 'combat' || run.combat.strokes) return
  foeTimer = setTimeout(() => {
    foeTimer = null
    dispatch({ type: 'endTurn' })
  }, foePause)
}

const bestText = best => (best ? t('bestValue', { name: glyphName(best), damage: best.damage }) : t('none'))

const shareWords = () => ({
  title: date => t('shareTitle', { date }),
  won: t('remembered'),
  place: (act, floor) => t('sharePlace', { act: local('acts', act).name, floor }),
  best: best => t('shareBest', { best: bestText(best) }),
})

const unlockTitle = key => local(scribes[key] ? 'scribes' : 'marginalia', key)

const renderLamplight = () => {
  const known = meta.lamplight > 0 || meta.unlocked.length > 0
  $('meta').hidden = !known
  if (!known) return
  $('lamplight').textContent = t('lamplight', { n: meta.lamplight })
  $('unlocks').replaceChildren(
    ...Object.entries(unlockCosts).map(([key, cost]) => {
      const owned = meta.unlocked.includes(key)
      const button = el(
        'button',
        {
          type: 'button',
          className: 'choice',
          disabled: owned || meta.lamplight < cost,
          onclick: () => {
            meta = saveMeta(spend(meta, key))
            renderLamplight()
          },
        },
        el('span', { className: 'mark' }, '✶'),
        el('span', {}, el('strong', {}, unlockTitle(key).name), el('small', {}, unlockTitle(key).text)),
        el('span', { className: 'price' }, owned ? t('lit') : t('light', { n: cost })),
      )
      button.dataset.unlock = key
      return button
    }),
  )
  const hands = Object.keys(scribes).filter(key => key === 'lastScribe' || meta.unlocked.includes(key))
  $('scribes').hidden = hands.length < 2
  $('scribes').replaceChildren(
    ...hands.map(key => {
      const button = el(
        'button',
        {
          type: 'button',
          className: meta.scribe === key ? 'secondary small' : 'ghost',
          ariaPressed: String(meta.scribe === key),
          onclick: () => {
            meta = saveMeta(chooseScribe(meta, key))
            renderLamplight()
          },
        },
        meta.scribe === key ? t('chosen', { name: local('scribes', key).name }) : local('scribes', key).name,
      )
      button.dataset.scribe = key
      return button
    }),
  )
}

const beginRun = () => {
  run = saveRun(createRun(Date.now() % 2 ** 31, runOptions(meta)))
  render()
}

const beginDaily = () => {
  const date = dateKey(new Date())
  if (!canStartDaily(meta, date)) return
  meta = saveMeta(startDaily(meta, date))
  run = saveRun(createDailyRun(date))
  render()
}

const share = async (button, text) => {
  try {
    if (navigator.share) await navigator.share({ text })
    else {
      await navigator.clipboard.writeText(text)
      button.textContent = t('copied')
    }
  } catch {}
}

const renderShare = (button, record) => {
  button.hidden = !record?.result
  if (record?.result) button.onclick = () => share(button, shareText(record.date, record.result, shareWords()))
}

const renderDaily = () => {
  const date = dateKey(new Date())
  $('daily').disabled = !canStartDaily(meta, date)
  $('daily').textContent = canStartDaily(meta, date) ? t('daily') : t('dailyDone')
  renderShare($('daily-share'), meta.daily?.date === date ? meta.daily : null)
}

const renderTitle = () => {
  renderLamplight()
  renderDaily()
  $('continue').hidden = !run || ['victory', 'defeat'].includes(run.screen)
  show('title')
}

const renderMap = () => {
  statsBar($('map-bar'))
  const act = local('acts', run.actIndex)
  const label = kind => (kind === 'boss' ? act.bossLabel : t(kind))
  $('act-name').textContent = act.name
  const open = openLanes(run)
  $('floors').replaceChildren(
    ...run.map.map((nodes, floor) =>
      el(
        'li',
        { className: 'floor' },
        ...nodes.map(node => {
          const here = floor === run.floor && node.lane === run.lane
          const can = floor === run.floor + 1 && open[floor].includes(node.lane)
          const walked = run.trail[floor] === node.lane
          const lost = !walked && !open[floor].includes(node.lane)
          const button = el(
            'button',
            {
              type: 'button',
              className: `node ${node.kind}${can ? ' open' : ''}${here ? ' here' : ''}${lost ? ' lost' : ''}`,
              disabled: !can,
              ariaLabel: t('nodeLabel', { label: label(node.kind), floor: floor + 1 }),
              onclick: () => dispatch({ type: 'choose', lane: node.lane }),
            },
            el('span', { className: 'sym' }, symbols[node.kind]),
            label(node.kind),
          )
          button.dataset.lane = node.lane
          return button
        }),
      ),
    ),
  )
  $('inkwell').replaceChildren(
    el('div', { className: 'bag' }, ...run.bag.map(rune => runeChip(rune, { title: runeText(rune) }))),
    ...(run.marks.length
      ? run.marks.map(key =>
          el('p', {}, el('strong', {}, `${local('marginalia', key).name}. `), local('marginalia', key).text),
        )
      : [el('p', {}, t('noMarks'))]),
  )
  show('map')
  drawRoutes($('links'), $('floors'), run)
}

const intentText = intent => t(intent.kind === 'ward' ? 'wardIntent' : intent.kind, { n: intent.value })

const glyphParts = glyph =>
  [
    glyph.damage && t('woundPart', { n: glyph.damage }),
    glyph.ward && t('wardPart', { n: glyph.ward }),
    glyph.burn && t('burnPart', { n: glyph.burn }),
  ]
    .filter(Boolean)
    .join(', ')

const eventText = (combat, event) => {
  if (event.kind === 'glyph') {
    return t('glyphLog', { name: glyphName(event.glyph), parts: glyphParts(event.glyph) })
  }
  if (event.kind === 'burn') return t('burnSears', { n: event.value })
  return t('foeActs', { foe: local('enemies', combat.enemy.key).name, intent: intentText(event) })
}

const renderPreview = combat => {
  const ready = path.length >= 3
  $('write').hidden = !ready
  $('end-turn').hidden = ready
  if (!ready) {
    $('preview').replaceChildren(path.length ? t('keepGoing') : t('traceHint'))
    return
  }
  const glyph = readGlyph(
    path.map(i => combat.cells[i]),
    combat.marks,
    combat.bagSize,
  )
  const parts = [
    glyph.strike && t('sum', { a: glyph.strike, m: glyph.mult, r: glyph.damage }),
    glyph.guard && t('sumWard', { a: glyph.guard, m: glyph.mult, r: glyph.ward }),
    glyph.burn && t('burnPart', { n: glyph.burn }),
  ]
  $('preview').replaceChildren(el('strong', {}, glyphName(glyph)), parts.filter(Boolean).join(' · '))
}

const renderCombat = () => {
  const { combat } = run
  const { enemy } = combat
  const intent = intentOf(combat)
  $('foe-name').textContent = local('enemies', enemy.key).name
  $('intent').textContent = intentText(intent)
  $('intent').className = `intent ${intent.kind}`
  $('foe-hp').textContent = `${enemy.hp} / ${enemy.maxHp}`
  $('foe-hp-fill').style.width = `${(enemy.hp / enemy.maxHp) * 100}%`
  $('foe-status').textContent =
    [
      enemy.ward && t('ward', { n: enemy.ward }),
      enemy.burn && t('burning', { n: enemy.burn }),
      enemy.strength && t('swollen', { n: enemy.strength }),
    ]
      .filter(Boolean)
      .join(' · ') || ' '
  $('log').textContent = combat.events.map(event => eventText(combat, event)).join(' · ')
  $('you-hp').textContent = `${combat.hp} / ${combat.maxHp}`
  $('you-hp-fill').style.width = `${(combat.hp / combat.maxHp) * 100}%`
  $('ward').textContent = t('ward', { n: combat.ward })
  const total = combat.marks.includes('thirdHand') ? 3 : 2
  $('strokes').replaceChildren(
    ...Array.from({ length: total }, (_, i) => el('i', { className: i < combat.strokes ? '' : 'spent' })),
    el('span', {}, t('turn', { n: combat.turn })),
  )
  $('marks-row').replaceChildren(
    ...combat.marks.map(key => el('li', { title: local('marginalia', key).text }, local('marginalia', key).name)),
  )
  $('end-turn').disabled = !canAct()
  renderPreview(combat)
  const hint = guide('hints')[meta.hints] ?? null
  $('hint').hidden = !hint
  $('hint').textContent = hint ?? ''
  show('combat')
  queueFoe()
}

const renderReward = () => {
  const { offer } = run
  $('reward-gold').textContent = t('gatherGold', { n: offer.gold })
  $('reward-marks').replaceChildren(
    ...offer.marks.map(key =>
      markChoice(key, el('span', { className: 'price' }, t('take')), () => dispatch({ type: 'takeMark', key })),
    ),
  )
  $('reward-runes').replaceChildren(
    ...offer.runes.map((rune, index) => runeChoice(rune, null, () => dispatch({ type: 'takeRune', index }))),
  )
  show('reward')
}

const renderMarket = () => {
  statsBar($('market-bar'))
  const { offer } = run
  $('market-runes').replaceChildren(
    ...offer.runes.map((rune, index) => {
      const button = runeChoice(rune, el('span', { className: 'price' }, t('price', { n: runePrice(rune) })), () =>
        dispatch({ type: 'buyRune', index }),
      )
      button.disabled = run.gold < runePrice(rune)
      return button
    }),
  )
  $('market-marks').replaceChildren(
    ...offer.marks.map(key => {
      const button = markChoice(key, el('span', { className: 'price' }, t('price', { n: markPrice })), () =>
        dispatch({ type: 'buyMark', key }),
      )
      button.disabled = run.gold < markPrice
      return button
    }),
  )
  const canRemove = !offer.removed && run.gold >= removePrice && run.bag.length > minBag
  $('remove-label').textContent = offer.removed ? t('scraperWorn') : t('scrape', { n: removePrice })
  $('market-remove').replaceChildren(
    ...run.bag.map(rune =>
      runeChip(rune, {
        type: 'button',
        disabled: !canRemove,
        ariaLabel: t('remove', { rune: runeText(rune) }),
        onclick: () => dispatch({ type: 'remove', id: rune.id }),
      }),
    ),
  )
  show('market')
}

const renderRest = () => {
  $('rest-heal').textContent = t('sleep', { n: Math.ceil(run.maxHp * 0.3), hp: run.hp, max: run.maxHp })
  $('rest-runes').replaceChildren(
    ...run.offer.upgrades.map(id => {
      const rune = run.bag.find(r => r.id === id)
      return runeChoice(rune, el('span', { className: 'price' }, `→ ${numeral(rune.value + 1)}`), () =>
        dispatch({ type: 'upgrade', id }),
      )
    }),
  )
  show('rest')
}

const renderShrine = () => {
  const shrine = local('shrines', run.offer.shrine)
  $('shrine-name').textContent = shrine.name
  $('shrine-text').textContent = shrine.text
  $('shrine-options').replaceChildren(
    ...shrine.options.map((label, option) =>
      el(
        'button',
        {
          type: 'button',
          className: option ? 'ghost' : 'primary',
          onclick: () => dispatch({ type: 'shrine', option }),
        },
        label,
      ),
    ),
  )
  show('shrine')
}

const guideRows = rows => rows.map(([term, meaning]) => el('div', {}, el('dt', {}, term), el('dd', {}, meaning)))

const openCodex = () => {
  $('codex-tiers').replaceChildren(...guideRows(guide('glyphTiers')))
  $('codex-inks').replaceChildren(
    ...guideRows(Object.keys(inks).map(key => [local('inks', key).name, local('inks', key).does])),
  )
  $('codex-intents').replaceChildren(...guideRows(guide('intentGuide')))
  $('codex-marks').replaceChildren(
    ...(run.marks.length
      ? guideRows(run.marks.map(key => [local('marginalia', key).name, local('marginalia', key).text]))
      : [el('p', {}, t('noneYet'))]),
  )
  $('codex').showModal()
}

const renderEnd = () => {
  const won = run.screen === 'victory'
  $('end-title').textContent = won ? t('remembered') : t('unwritten')
  $('end-text').textContent = won
    ? t('wonText')
    : t('lostText', { act: local('acts', run.actIndex).name, floor: run.floor + 1 })
  const best = run.stats.best
  meta = saveMeta(recordDaily(bank(meta, run), run))
  renderShare($('end-share'), meta.daily?.date === run.daily ? meta.daily : null)
  $('end-stats').replaceChildren(
    el('dt', {}, t('fightsWon')),
    el('dd', {}, `${run.stats.fights - (won ? 0 : 1)}`),
    el('dt', {}, t('glyphsWritten')),
    el('dd', {}, `${run.stats.strokes}`),
    el('dt', {}, t('greatestGlyph')),
    el('dd', {}, bestText(best)),
    el('dt', {}, t('inkwell')),
    el('dd', {}, t('inkwellValue', { runes: run.bag.length, marks: run.marks.length })),
    el('dt', {}, t('lamplightEarned')),
    el('dd', {}, `${lamplightEarned(run)}`),
  )
  show('end')
}

const render = () => {
  if (!run) return renderTitle()
  const view = {
    map: renderMap,
    combat: renderCombat,
    reward: renderReward,
    market: renderMarket,
    rest: renderRest,
    shrine: renderShrine,
    victory: renderEnd,
    defeat: renderEnd,
  }[run.screen]
  view()
}

const canvas = $('board')

let pressed = false
let swiped = false

const extend = event => {
  const cell = board.cellAt(event.clientX, event.clientY)
  if (cell === null) return false
  if (cell === path.at(-2)) path = path.slice(0, -1)
  else if (canExtend(run.combat, path, cell)) {
    path = [...path, cell]
    scratch(path.length)
  } else return false
  renderPreview(run.combat)
  return true
}

const tap = event => {
  const cell = board.cellAt(event.clientX, event.clientY)
  if (cell === null) return
  if (cell === path.at(-1)) {
    path = path.slice(0, -1)
    return renderPreview(run.combat)
  }
  if (extend(event) || !canExtend(run.combat, [], cell)) return
  path = [cell]
  scratch(1)
  renderPreview(run.combat)
}

const writePath = () => {
  if (!isValid(run.combat, path)) return
  meta = saveMeta(hintSeen(meta))
  dispatch({ type: 'write', path })
}

canvas.addEventListener('pointerdown', event => {
  if (!canAct()) return
  canvas.setPointerCapture(event.pointerId)
  pressed = true
  swiped = false
  tap(event)
})
canvas.addEventListener('pointermove', event => {
  if (pressed && path.length && extend(event)) swiped = true
})
canvas.addEventListener('pointerup', () => {
  pressed = false
  if (!swiped) return
  if (canAct() && isValid(run.combat, path)) return writePath()
  path = []
  if (canAct()) renderPreview(run.combat)
})

$('write').onclick = writePath

window.addEventListener('resize', () => {
  if (run?.screen === 'map') drawRoutes($('links'), $('floors'), run)
})

const renderSettings = () => {
  const { sound, music, language } = settings()
  $('setting-sound').checked = sound
  $('setting-music').checked = music
  $(`language-${language}`).checked = true
}

const openSettings = () => {
  renderSettings()
  $('settings').showModal()
}

$('open-settings').onclick = openSettings
$('map-settings').onclick = openSettings
$('combat-settings').onclick = openSettings
$('setting-sound').onchange = event => updateSettings({ sound: event.target.checked })
$('setting-music').onchange = event => updateSettings({ music: event.target.checked })
for (const option of document.querySelectorAll('input[name="language"]')) {
  option.onchange = () => updateSettings({ language: option.value })
}

onSettings(() => {
  syncMusic()
  applyStatic(document)
  if ($('title').hidden) render()
  else renderTitle()
})

document.addEventListener('pointerdown', syncMusic, { once: true })
document.addEventListener('keydown', syncMusic, { once: true })
$('new-run').onclick = beginRun
$('map-codex').onclick = openCodex
$('combat-codex').onclick = openCodex
$('daily').onclick = beginDaily
$('continue').onclick = () => render()
$('end-new').onclick = beginRun
$('end-title-screen').onclick = renderTitle
$('end-turn').onclick = () => dispatch({ type: 'endTurn' })
$('reward-skip').onclick = () => dispatch({ type: 'leave' })
$('market-leave').onclick = () => dispatch({ type: 'leave' })
$('rest-heal').onclick = () => dispatch({ type: 'heal' })

const frame = () => {
  if (!$('combat').hidden) board.draw(run.combat, path)
  requestAnimationFrame(frame)
}

applyStatic(document)
renderTitle()
requestAnimationFrame(frame)

navigator.serviceWorker?.register('sw.js')

window.saltscript = {
  play: next => {
    run = next
    render()
  },
  run: () => run,
  hint: () => bestPath(run.combat, 5),
  pointFor: cell => board.pointFor(cell),
  node: (floor, lane) => nodeAt(run, floor, lane),
}
