import { enemies, marginalia } from './data.js'
import { rng } from './rng.js'

export const width = 4
export const height = 5

const has = (state, mark) => state.marks.includes(mark)

export const strokesPerTurn = marks => (marks.includes('thirdHand') ? 3 : 2)

export const adjacent = (a, b) =>
  a !== b && Math.abs((a % width) - (b % width)) <= 1 && Math.abs(Math.floor(a / width) - Math.floor(b / width)) <= 1

export const canWrite = (state, cell) => {
  const rune = state.cells[cell]
  return Boolean(rune) && (rune.ink !== 'salt' || has(state, 'saltwise'))
}

export const canExtend = (state, path, cell) =>
  canWrite(state, cell) && !path.includes(cell) && (!path.length || adjacent(path.at(-1), cell))

export const isValid = (state, path) =>
  path.length >= 3 && path.every((cell, i) => canExtend(state, path.slice(0, i), cell))

const tierOf = length => (length >= 7 ? 3 : length >= 5 ? 2 : 1)

const nameOf = (length, ink) => {
  if (ink) return `${length >= 5 ? 'Litany' : 'Seal'} of ${ink[0].toUpperCase()}${ink.slice(1)}`
  return length >= 7 ? 'Canticle' : length >= 5 ? 'Verse' : 'Line'
}

export const readGlyph = (runes, marks) => {
  const count = { brine: 0, ember: 0, moss: 0, salt: 0 }
  const chips = { brine: 0, ember: 0, moss: 0, salt: 0 }
  for (const rune of runes) {
    count[rune.ink] += 1
    chips[rune.ink] += rune.ink === 'salt' ? 1 : rune.value
  }
  const used = ['brine', 'ember', 'moss'].filter(ink => count[ink])
  const ink = used.length === 1 ? used[0] : null
  const length = runes.length
  const glyph = { length, ink, count }
  let mult = tierOf(length) + (ink ? 1 : 0)
  let burn = count.ember
  for (const mark of marks) {
    const bonus = marginalia[mark].glyph?.(glyph) ?? {}
    mult += bonus.mult ?? 0
    burn += bonus.burn ?? 0
  }
  const strike = chips.brine + chips.ember + chips.salt
  return {
    name: nameOf(length, ink),
    ink,
    length,
    strike,
    guard: chips.moss,
    mult,
    damage: strike * mult,
    ward: chips.moss * mult,
    burn,
  }
}

const draw = state => {
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
    marks,
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

const enemyAct = state => {
  const burnDamage = state.enemy.burn * (has(state, 'lampOil') ? 2 : 1)
  let enemy = { ...state.enemy, ward: 0, hp: state.enemy.hp - burnDamage, burn: Math.max(0, state.enemy.burn - 1) }
  const events = burnDamage ? [{ kind: 'burn', value: burnDamage }] : []
  if (enemy.hp <= 0) return { ...state, enemy, status: 'won', events }
  const intent = intentOf(state)
  let next = { ...state, enemy, events: [...events, intent] }
  const rand = rng(state.seed)
  const cells = next.cells.map(rune =>
    rune?.ink === 'salt' ? (rune.ttl > 1 ? { ...rune, ttl: rune.ttl - 1 } : null) : rune,
  )
  next = { ...next, cells }
  if (intent.kind === 'attack') {
    const player = hurt({ hp: next.hp, ward: next.ward }, intent.value)
    next = { ...next, ...player }
  }
  if (intent.kind === 'ward') enemy = { ...enemy, ward: enemy.ward + intent.value }
  if (intent.kind === 'rise') enemy = { ...enemy, strength: enemy.strength + intent.value }
  if (intent.kind === 'salt') {
    const targets = rand
      .shuffle(cells.flatMap((rune, i) => (rune && rune.ink !== 'salt' ? [i] : [])))
      .slice(0, intent.value)
    const salted = [...cells]
    const discard = [...next.discard]
    for (const i of targets) {
      discard.push(salted[i])
      salted[i] = { id: `salt-${state.turn}-${i}`, ink: 'salt', value: 0, ttl: 3 }
    }
    next = { ...next, cells: salted, discard }
  }
  enemy = { ...enemy, step: enemy.step + 1 }
  next = { ...next, enemy, seed: rand.state() }
  if (next.hp <= 0) return { ...next, hp: 0, status: 'lost' }
  return draw({
    ...next,
    ward: has(state, 'mossRubric') ? next.ward : 0,
    strokes: strokesPerTurn(state.marks),
    turn: state.turn + 1,
  })
}

export const endTurn = state => (state.status === 'playing' ? enemyAct({ ...state, strokes: 0 }) : state)

export const write = (state, path) => {
  if (state.status !== 'playing' || !isValid(state, path)) return state
  const runes = path.map(cell => state.cells[cell])
  const glyph = readGlyph(runes, state.marks)
  const enemy = hurt(state.enemy, glyph.damage)
  const cells = state.cells.map((rune, i) => (path.includes(i) ? null : rune))
  const discard = [...state.discard, ...runes.filter(r => r.ink !== 'salt')]
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
  const refilled = draw(next)
  if (refilled.strokes) return refilled
  const after = enemyAct(refilled)
  return { ...after, last: glyph, events: [...next.events, ...after.events] }
}
