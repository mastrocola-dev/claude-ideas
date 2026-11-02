import { bestPath } from './core/bot.js'
import { canExtend, intentOf, isValid, readGlyph } from './core/combat.js'
import { acts, inks, marginalia, shrines } from './core/data.js'
import { act, createRun, markPrice, minBag, nodeAt, openLanes, removePrice, runePrice } from './core/run.js'
import { createBoard, numeral } from './ui/board.js'
import { announce } from './ui/feedback.js'
import { drawRoutes } from './ui/routes.js'
import { isMuted, scratch, setMuted } from './ui/sound.js'
import { loadRun, saveRun } from './ui/store.js'

const $ = id => document.getElementById(id)
const screens = ['title', 'map', 'combat', 'reward', 'market', 'rest', 'shrine', 'end']
const symbols = { fight: '⚔', elite: '☠', shrine: '✶', market: '⚖', rest: '☾', boss: '♆' }
const labels = { fight: 'Fight', elite: 'Elite', shrine: 'Shrine', market: 'Market', rest: 'Rest' }
const board = createBoard($('board'))

let run = loadRun()
let path = []
let foeTimer = null
const foePause = 600

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props)
  node.append(...children.filter(child => child !== null && child !== undefined))
  return node
}

const runeChip = (rune, props = {}) =>
  el(props.onclick ? 'button' : 'span', { className: `rune ${rune.ink}`, ...props }, numeral(rune.value))

const runeText = rune => `${inks[rune.ink].name} ${numeral(rune.value)}`

const markChoice = (key, extra, onclick) =>
  el(
    'button',
    { type: 'button', className: 'choice', onclick },
    el('span', { className: 'mark' }, '¶'),
    el(
      'span',
      {},
      el('strong', {}, marginalia[key].name),
      el('small', {}, `${marginalia[key].rarity}. ${marginalia[key].text}`),
    ),
    extra,
  )

const runeChoice = (rune, extra, onclick) =>
  el(
    'button',
    { type: 'button', className: 'choice', onclick },
    runeChip(rune),
    el('span', {}, el('strong', {}, runeText(rune)), el('small', {}, `${inks[rune.ink].does}, worth ${rune.value}`)),
    extra,
  )

const show = screen => {
  for (const id of screens) $(id).hidden = id !== screen
}

const statsBar = target =>
  target.replaceChildren(
    el('span', {}, 'Health ', el('b', {}, `${run.hp}/${run.maxHp}`)),
    el('span', {}, 'Gold ', el('b', {}, `${run.gold}`)),
    el('span', {}, 'Runes ', el('b', {}, `${run.bag.length}`)),
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

const renderMute = () => {
  $('mute').textContent = isMuted() ? 'Sound off' : 'Sound on'
  $('mute').ariaPressed = String(isMuted())
}

const renderTitle = () => {
  renderMute()
  $('continue').hidden = !run || ['victory', 'defeat'].includes(run.screen)
  show('title')
}

const renderMap = () => {
  statsBar($('map-bar'))
  const act = acts[run.actIndex]
  const label = kind => (kind === 'boss' ? act.bossLabel : labels[kind])
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
              ariaLabel: `${label(node.kind)}, floor ${floor + 1}`,
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
      ? run.marks.map(key => el('p', {}, el('strong', {}, `${marginalia[key].name}. `), marginalia[key].text))
      : [el('p', {}, 'No marginalia yet. Elites, shrines and the market grant them.')]),
  )
  show('map')
  drawRoutes($('links'), $('floors'), run)
}

const intentText = intent =>
  ({
    attack: `Strikes ${intent.value}`,
    ward: `Wards ${intent.value}`,
    salt: `Salts ${intent.value} runes`,
    rise: `Swells +${intent.value}`,
    smudge: `Smudges ${intent.value} runes`,
    undertow: 'Drags a column under',
  })[intent.kind]

const eventText = (combat, event) => {
  if (event.kind === 'glyph') {
    const { glyph } = event
    const parts = [
      glyph.damage && `${glyph.damage} wound`,
      glyph.ward && `${glyph.ward} ward`,
      glyph.burn && `${glyph.burn} burn`,
    ]
    return `${glyph.name}: ${parts.filter(Boolean).join(', ')}`
  }
  if (event.kind === 'burn') return `Burn sears for ${event.value}`
  return `${combat.enemy.name} ${intentText(event).toLowerCase()}`
}

const renderPreview = combat => {
  if (path.length < 3) {
    $('preview').replaceChildren(
      path.length ? 'Keep going, three runes at least' : 'Trace three or more touching runes',
    )
    return
  }
  const glyph = readGlyph(
    path.map(i => combat.cells[i]),
    combat.marks,
    combat.bagSize,
  )
  const parts = [
    glyph.strike && `${glyph.strike} × ${glyph.mult} = ${glyph.damage} wound`,
    glyph.guard && `${glyph.guard} × ${glyph.mult} = ${glyph.ward} ward`,
    glyph.burn && `${glyph.burn} burn`,
  ]
  $('preview').replaceChildren(el('strong', {}, glyph.name), parts.filter(Boolean).join(' · '))
}

const renderCombat = () => {
  const { combat } = run
  const { enemy } = combat
  const intent = intentOf(combat)
  $('foe-name').textContent = enemy.name
  $('intent').textContent = intentText(intent)
  $('intent').className = `intent ${intent.kind}`
  $('foe-hp').textContent = `${enemy.hp} / ${enemy.maxHp}`
  $('foe-hp-fill').style.width = `${(enemy.hp / enemy.maxHp) * 100}%`
  $('foe-status').textContent =
    [
      enemy.ward && `Ward ${enemy.ward}`,
      enemy.burn && `Burning ${enemy.burn}`,
      enemy.strength && `Swollen +${enemy.strength}`,
    ]
      .filter(Boolean)
      .join(' · ') || ' '
  $('log').textContent = combat.events.map(event => eventText(combat, event)).join(' · ')
  $('you-hp').textContent = `${combat.hp} / ${combat.maxHp}`
  $('you-hp-fill').style.width = `${(combat.hp / combat.maxHp) * 100}%`
  $('ward').textContent = `Ward ${combat.ward}`
  const total = combat.marks.includes('thirdHand') ? 3 : 2
  $('strokes').replaceChildren(
    ...Array.from({ length: total }, (_, i) => el('i', { className: i < combat.strokes ? '' : 'spent' })),
    el('span', {}, `Turn ${combat.turn}`),
  )
  $('marks-row').replaceChildren(
    ...combat.marks.map(key => el('li', { title: marginalia[key].text }, marginalia[key].name)),
  )
  $('end-turn').disabled = !canAct()
  renderPreview(combat)
  show('combat')
  queueFoe()
}

const renderReward = () => {
  const { offer } = run
  $('reward-gold').textContent = `You gather ${offer.gold} gold from the wrack.`
  $('reward-marks').replaceChildren(
    ...offer.marks.map(key =>
      markChoice(key, el('span', { className: 'price' }, 'Take'), () => dispatch({ type: 'takeMark', key })),
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
      const button = runeChoice(rune, el('span', { className: 'price' }, `${runePrice(rune)} gold`), () =>
        dispatch({ type: 'buyRune', index }),
      )
      button.disabled = run.gold < runePrice(rune)
      return button
    }),
  )
  $('market-marks').replaceChildren(
    ...offer.marks.map(key => {
      const button = markChoice(key, el('span', { className: 'price' }, `${markPrice} gold`), () =>
        dispatch({ type: 'buyMark', key }),
      )
      button.disabled = run.gold < markPrice
      return button
    }),
  )
  const canRemove = !offer.removed && run.gold >= removePrice && run.bag.length > minBag
  $('remove-label').textContent = offer.removed
    ? 'The scraper is worn for tonight'
    : `Scrape a rune from your inkwell · ${removePrice} gold`
  $('market-remove').replaceChildren(
    ...run.bag.map(rune =>
      runeChip(rune, {
        type: 'button',
        disabled: !canRemove,
        ariaLabel: `Remove ${runeText(rune)}`,
        onclick: () => dispatch({ type: 'remove', id: rune.id }),
      }),
    ),
  )
  show('market')
}

const renderRest = () => {
  $('rest-heal').textContent = `Sleep: heal ${Math.ceil(run.maxHp * 0.3)} (${run.hp}/${run.maxHp})`
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
  const shrine = shrines[run.offer.shrine]
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

const renderEnd = () => {
  const won = run.screen === 'victory'
  $('end-title').textContent = won ? 'The coast remembers' : 'Unwritten'
  $('end-text').textContent = won
    ? 'The lamp is lit again. The names of the coast hold until the next night.'
    : `The sea took you in ${acts[run.actIndex].name}, floor ${run.floor + 1}.`
  const best = run.stats.best
  $('end-stats').replaceChildren(
    el('dt', {}, 'Fights won'),
    el('dd', {}, `${run.stats.fights - (won ? 0 : 1)}`),
    el('dt', {}, 'Glyphs written'),
    el('dd', {}, `${run.stats.strokes}`),
    el('dt', {}, 'Greatest glyph'),
    el('dd', {}, best ? `${best.name}, ${best.damage}` : 'none'),
    el('dt', {}, 'Inkwell'),
    el('dd', {}, `${run.bag.length} runes, ${run.marks.length} marginalia`),
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

const extend = event => {
  const cell = board.cellAt(event.clientX, event.clientY)
  if (cell === null) return
  if (cell === path.at(-2)) path = path.slice(0, -1)
  else if (canExtend(run.combat, path, cell)) {
    path = [...path, cell]
    scratch(path.length)
  }
  renderPreview(run.combat)
}

canvas.addEventListener('pointerdown', event => {
  if (!canAct()) return
  canvas.setPointerCapture(event.pointerId)
  path = []
  extend(event)
})
canvas.addEventListener('pointermove', event => {
  if (path.length) extend(event)
})
canvas.addEventListener('pointerup', () => {
  if (path.length && isValid(run.combat, path)) {
    dispatch({ type: 'write', path })
    return
  }
  path = []
  if (canAct()) renderPreview(run.combat)
})

window.addEventListener('resize', () => {
  if (run?.screen === 'map') drawRoutes($('links'), $('floors'), run)
})

$('mute').onclick = () => {
  setMuted(!isMuted())
  renderMute()
}
$('new-run').onclick = () => {
  run = saveRun(createRun(Date.now() % 2 ** 31))
  render()
}
$('continue').onclick = () => render()
$('end-new').onclick = () => {
  run = saveRun(createRun(Date.now() % 2 ** 31))
  render()
}
$('end-turn').onclick = () => dispatch({ type: 'endTurn' })
$('reward-skip').onclick = () => dispatch({ type: 'leave' })
$('market-leave').onclick = () => dispatch({ type: 'leave' })
$('rest-heal').onclick = () => dispatch({ type: 'heal' })

const frame = () => {
  if (!$('combat').hidden) board.draw(run.combat, path)
  requestAnimationFrame(frame)
}

renderTitle()
requestAnimationFrame(frame)

window.saltscript = {
  run: () => run,
  hint: () => bestPath(run.combat, 5),
  pointFor: cell => board.pointFor(cell),
  node: (floor, lane) => nodeAt(run, floor, lane),
}
