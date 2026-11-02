import { enemies, marginalia } from './data.js'
import { rng } from './rng.js'

export const width = 4
export const height = 5

const has = (state, mark) => state.marks.includes(mark)

export const strokesPerTurn = marks => (marks.includes('thirdArm') ? 3 : 2)

export const adjacent = (a, b) =>
  a !== b && Math.abs((a % width) - (b % width)) <= 1 && Math.abs(Math.floor(a / width) - Math.floor(b / width)) <= 1

export const canWrite = (state, cell) => {
  const rune = state.cells[cell]
  return Boolean(rune) && (rune.ink !== 'glitch' || has(state, 'glitchRouter'))
}

export const inkOf = (state, path) => path.map(cell => state.cells[cell].ink).find(ink => ink !== 'glitch') ?? null

const matches = (state, path, cell) => {
  const ink = state.cells[cell].ink
  const lead = inkOf(state, path)
  return ink === 'glitch' || !lead || ink === lead
}

export const canExtend = (state, path, cell) =>
  canWrite(state, cell) &&
  !path.includes(cell) &&
  (!path.length || adjacent(path.at(-1), cell)) &&
  matches(state, path, cell)

export const isValid = (state, path) =>
  path.length >= 3 && path.every((cell, i) => canExtend(state, path.slice(0, i), cell)) && Boolean(inkOf(state, path))

export const multFor = length => length - 2

const nameOf = (length, ink) => {
  const title = length >= 7 ? 'Overload' : length >= 5 ? 'Surge' : 'Arc'
  return `${ink[0].toUpperCase()}${ink.slice(1)} ${title}`
}

const reach = (state, ink, start, seen) => {
  const group = [start]
  seen.add(start)
  for (let i = 0; i < group.length; i++) {
    for (let next = 0; next < state.cells.length; next++) {
      if (seen.has(next) || !adjacent(group[i], next) || !canWrite(state, next)) continue
      const other = state.cells[next].ink
      if (other !== ink && other !== 'glitch') continue
      seen.add(next)
      group.push(next)
    }
  }
  return group
}

export const hasStroke = state =>
  ['plasma', 'thermal', 'shield'].some(ink => {
    const seen = new Set()
    return state.cells.some(
      (rune, cell) => rune?.ink === ink && !seen.has(cell) && reach(state, ink, cell, seen).length >= 3,
    )
  })

export const readGlyph = (runes, marks, bagSize = 0) => {
  const count = { plasma: 0, thermal: 0, shield: 0, glitch: 0 }
  const chips = { plasma: 0, thermal: 0, shield: 0, glitch: 0 }
  for (const rune of runes) {
    count[rune.ink] += 1
    chips[rune.ink] += rune.ink === 'glitch' ? 1 : rune.value
  }
  const ink = ['plasma', 'thermal', 'shield'].find(key => count[key]) ?? 'glitch'
  const length = runes.length
  const glyph = { length, ink, count, bagSize }
  let mult = multFor(length)
  let burn = count.thermal
  for (const mark of marks) {
    const bonus = marginalia[mark].glyph?.(glyph) ?? {}
    mult += bonus.mult ?? 0
    burn += bonus.burn ?? 0
  }
  const strike = chips.plasma + chips.thermal + chips.glitch + (marks.includes('spikedShield') ? chips.shield : 0)
  return {
    name: nameOf(length, ink),
    ink,
    length,
    strike,
    guard: chips.shield,
    mult,
    damage: strike * mult,
    ward: chips.shield * mult,
    burn,
  }
}

const refill = state => {
  const rand = rng(state.seed)
  let pile = state.pile
  let discard = state.discard
  const cells = [...state.cells]
  for (let column = 0; column < width; column++) {
    const kept = []
    for (let row = height - 1; row >= 0; row--) {
      const rune = cells[row * width + column]
      if (rune) kept.push(rune)
    }
    for (let row = height - 1; row >= 0; row--) {
      const index = height - 1 - row
      if (index < kept.length) {
        cells[row * width + column] = kept[index]
        continue
      }
      if (!pile.length && discard.length) {
        pile = rand.shuffle(discard)
        discard = []
      }
      cells[row * width + column] = pile[0] ?? null
      pile = pile.slice(1)
    }
  }
  return { ...state, cells, pile, discard, seed: rand.state() }
}

const gather = cells => {
  const best = ['plasma', 'thermal', 'shield']
    .map(ink => cells.flatMap((rune, i) => (rune?.ink === ink ? [i] : [])))
    .sort((a, b) => b.length - a.length)[0]
  if (best.length < 3) return cells
  const gathered = [...cells]
  for (const [slot, from] of best.slice(0, 3).entries()) {
    ;[gathered[slot], gathered[from]] = [gathered[from], gathered[slot]]
  }
  return gathered
}

const rewriteAttempts = 12

const settle = state => {
  if (hasStroke(state)) return state
  let next = state
  for (let attempt = 0; attempt < rewriteAttempts && !hasStroke(next); attempt++) {
    const runes = next.cells.filter(rune => rune && rune.ink !== 'glitch')
    next = refill({ ...next, cells: next.cells.map(() => null), discard: [...next.discard, ...runes] })
  }
  if (!hasStroke(next)) next = { ...next, cells: gather(next.cells) }
  return { ...next, events: [...(next.events ?? []), { kind: 'rewrite' }] }
}

const draw = state => settle(refill(state))

export const intentOf = state => {
  const { intents } = enemies[state.enemy.key]
  const [kind, value] = intents[state.enemy.step % intents.length]
  return { kind, value: kind === 'attack' ? value + state.enemy.strength : value }
}

export const createCombat = ({ bag, hp, maxHp, marks, enemy, floor, seed }) => {
  const rand = rng(seed)
  const life = Math.round(enemies[enemy].hp * (1 + floor * 0.1))
  return draw({
    cells: Array(width * height).fill(null),
    pile: rand.shuffle(bag),
    discard: [],
    hp,
    maxHp,
    ward: 0,
    carried: 0,
    marks,
    bagSize: bag.length,
    strokes: strokesPerTurn(marks),
    turn: 1,
    written: 0,
    enemy: { key: enemy, name: enemies[enemy].name, hp: life, maxHp: life, ward: 0, burn: 0, strength: 0, step: 0 },
    status: 'playing',
    seed: rand.state(),
    last: null,
    best: null,
    events: [],
  })
}

const hurt = (target, amount) => {
  const absorbed = Math.min(target.ward, amount)
  return { ...target, ward: target.ward - absorbed, hp: target.hp - (amount - absorbed) }
}

const drain = (cells, count, rand) => {
  const targets = rand
    .shuffle(cells.flatMap((rune, i) => (rune && rune.ink !== 'glitch' && rune.value > 1 ? [i] : [])))
    .slice(0, count)
  return cells.map((rune, i) => (targets.includes(i) ? { ...rune, value: rune.value - 1 } : rune))
}

const reroute = (cells, column) =>
  cells.map((rune, i) => {
    if (i % width !== column) return rune
    const row = Math.floor(i / width)
    return cells[((row + height - 1) % height) * width + column]
  })

const enemyAct = state => {
  const burnDamage = state.enemy.burn * (has(state, 'overclock') ? 2 : 1)
  let enemy = {
    ...state.enemy,
    ward: 0,
    hp: state.enemy.hp - burnDamage,
    burn: has(state, 'meltdown') ? state.enemy.burn : Math.max(0, state.enemy.burn - 1),
  }
  const events = burnDamage ? [{ kind: 'burn', value: burnDamage }] : []
  if (enemy.hp <= 0) return { ...state, enemy: { ...enemy, hp: 0 }, status: 'won', events }
  const intent = intentOf(state)
  let next = { ...state, enemy, events: [...events, intent] }
  const rand = rng(state.seed)
  const crumbled = next.cells.filter(rune => rune?.ink === 'glitch' && rune.ttl <= 1).length
  const cells = next.cells.map(rune =>
    rune?.ink === 'glitch' ? (rune.ttl > 1 ? { ...rune, ttl: rune.ttl - 1 } : null) : rune,
  )
  next = { ...next, cells }
  if (intent.kind === 'attack') {
    const player = hurt({ hp: next.hp, ward: next.ward }, intent.value)
    const blocked = next.ward - player.ward
    const carried = Math.max(0, (next.carried ?? 0) - blocked)
    const strike = { ...intent, blocked, lost: next.hp - player.hp }
    next = { ...next, ...player, carried, events: [...events, strike] }
  }
  if (intent.kind === 'ward') enemy = { ...enemy, ward: enemy.ward + intent.value }
  if (intent.kind === 'boost') enemy = { ...enemy, strength: enemy.strength + intent.value }
  if (intent.kind === 'glitch') {
    const targets = rand
      .shuffle(cells.flatMap((rune, i) => (rune && rune.ink !== 'glitch' ? [i] : [])))
      .slice(0, intent.value)
    const glitched = [...cells]
    const discard = [...next.discard]
    for (const i of targets) {
      discard.push(glitched[i])
      glitched[i] = { id: `glitch-${state.turn}-${i}`, ink: 'glitch', value: 0, ttl: 3 }
    }
    next = { ...next, cells: glitched, discard }
  }
  if (intent.kind === 'drain') next = { ...next, cells: drain(cells, intent.value, rand) }
  if (intent.kind === 'reroute') next = { ...next, cells: reroute(cells, rand.int(width)) }
  enemy = { ...enemy, step: enemy.step + 1 }
  next = { ...next, enemy, seed: rand.state() }
  if (next.hp <= 0) return { ...next, hp: 0, status: 'lost' }
  const fresh = has(state, 'batteryBank') ? next.ward - (next.carried ?? 0) : 0
  return draw({
    ...next,
    ward: fresh + (has(state, 'glitchRecycler') ? crumbled * 3 : 0),
    carried: fresh,
    strokes: strokesPerTurn(state.marks),
    turn: state.turn + 1,
  })
}

export const endTurn = state => (state.status === 'playing' ? enemyAct({ ...state, strokes: 0 }) : state)

export const write = (state, path) => {
  if (state.status !== 'playing' || !state.strokes || !isValid(state, path)) return state
  const runes = path.map(cell => state.cells[cell])
  const glyph = readGlyph(runes, state.marks, state.bagSize)
  const enemy = hurt(state.enemy, glyph.damage)
  const cells = state.cells.map((rune, i) => (path.includes(i) ? null : rune))
  const discard = [...state.discard, ...runes.filter(r => r.ink !== 'glitch')]
  const next = {
    ...state,
    cells,
    discard,
    ward: state.ward + glyph.ward,
    enemy: { ...enemy, burn: enemy.burn + glyph.burn },
    strokes: state.strokes - 1,
    written: state.written + 1,
    last: glyph,
    best: glyph.damage > (state.best?.damage ?? -1) ? glyph : state.best,
    events: [{ kind: 'glyph', glyph }],
  }
  if (next.enemy.hp <= 0) return { ...next, enemy: { ...next.enemy, hp: 0 }, status: 'won' }
  return draw(next)
}
