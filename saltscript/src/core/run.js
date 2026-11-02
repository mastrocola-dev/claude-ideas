import { createCombat, endTurn, write } from './combat.js'
import { acts, marginalia, shrines, startingBag, writable } from './data.js'
import { rng } from './rng.js'

export const floors = 8
export const lanes = 3

const weighted = (rand, table) => {
  let roll = rand.next() * table.reduce((sum, [, weight]) => sum + weight, 0)
  for (const [kind, weight] of table) {
    roll -= weight
    if (roll < 0) return kind
  }
  return table[0][0]
}

const kindFor = (rand, floor) => {
  if (floor === 0) return 'fight'
  if (floor === floors - 2) return 'rest'
  if (floor === floors - 1) return 'boss'
  return weighted(rand, [
    ['fight', 45],
    ['elite', floor >= 3 ? 15 : 0],
    ['shrine', 15],
    ['market', 13],
    ['rest', 12],
  ])
}

export const createMap = rand =>
  Array.from({ length: floors }, (_, floor) =>
    floor === floors - 1
      ? [{ lane: 1, kind: 'boss', links: [] }]
      : Array.from({ length: lanes }, (_, lane) => {
          const side = lane + (rand.next() < 0.5 ? -1 : 1)
          const links =
            floor === floors - 2 ? [1] : [lane, ...(side >= 0 && side < lanes ? [side] : [])].sort((a, b) => a - b)
          return { lane, kind: kindFor(rand, floor), links }
        }),
  )

const runeFrom = (rand, run, bias = 0) => ({
  id: `r${run.nextId}`,
  ink: rand.pick(writable),
  value: Math.min(4, 1 + Math.floor(rand.next() * (1.6 + (run.floor + run.actIndex * floors) / 3 + bias))),
})

const runes = (rand, run, count, bias) => {
  let next = run
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(runeFrom(rand, next, bias))
    next = { ...next, nextId: next.nextId + 1 }
  }
  return [list, next]
}

const freshMarks = (rand, run, count) =>
  rand.shuffle(Object.keys(marginalia).filter(key => !run.marks.includes(key))).slice(0, count)

export const runePrice = rune => 14 + rune.value * 10
export const markPrice = 70
export const removePrice = 45

export const createRun = seed => {
  const rand = rng(seed)
  return {
    seed: rand.state(),
    origin: seed,
    actIndex: 0,
    map: createMap(rand),
    floor: -1,
    lane: null,
    trail: [],
    hp: 70,
    maxHp: 70,
    gold: 30,
    bag: startingBag.map(([ink, value], i) => ({ id: `r${i}`, ink, value })),
    nextId: startingBag.length,
    marks: [],
    screen: 'map',
    combat: null,
    offer: null,
    stats: { fights: 0, strokes: 0, best: null },
  }
}

export const reachable = run => {
  if (run.floor === -1) return run.map[0].map(node => node.lane)
  if (run.floor === floors - 1) return []
  return run.map[run.floor].find(node => node.lane === run.lane).links
}

export const openLanes = run => {
  const open = run.map.map(() => [])
  open[run.floor + 1] = reachable(run)
  for (let floor = run.floor + 1; floor < floors - 1; floor++) {
    open[floor + 1] = [...new Set(open[floor].flatMap(lane => nodeAt(run, floor, lane).links))]
  }
  return open
}

export const nodeAt = (run, floor, lane) => run.map[floor]?.find(node => node.lane === lane)

const enter = (run, lane) => {
  const floor = run.floor + 1
  const node = nodeAt(run, floor, lane)
  const rand = rng(run.seed)
  const at = { ...run, floor, lane, trail: [...run.trail, lane] }
  if (['fight', 'elite', 'boss'].includes(node.kind)) {
    const combat = createCombat({
      bag: run.bag,
      hp: run.hp,
      maxHp: run.maxHp,
      marks: run.marks,
      enemy: rand.pick(acts[run.actIndex].pools[node.kind]),
      floor,
      seed: rand.int(2 ** 31),
    })
    return { ...at, screen: 'combat', combat, offer: { kind: node.kind }, seed: rand.state() }
  }
  if (node.kind === 'market') {
    const [stock, next] = runes(rand, at, 3, 1)
    return { ...next, screen: 'market', offer: { runes: stock, marks: freshMarks(rand, at, 2) }, seed: rand.state() }
  }
  if (node.kind === 'rest') {
    const choices = rand.shuffle(run.bag.filter(r => r.value < 4)).slice(0, 3)
    return { ...at, screen: 'rest', offer: { upgrades: choices.map(r => r.id) }, seed: rand.state() }
  }
  return { ...at, screen: 'shrine', offer: { shrine: rand.pick(Object.keys(shrines)) }, seed: rand.state() }
}

const toMap = run => ({ ...run, screen: 'map', offer: null, combat: null })

const upgrade = (bag, ids) => bag.map(r => (ids.includes(r.id) ? { ...r, value: Math.min(4, r.value + 1) } : r))

const nextAct = (run, rand) => ({
  ...run,
  actIndex: run.actIndex + 1,
  map: createMap(rand),
  floor: -1,
  lane: null,
  trail: [],
  hp: run.hp + Math.ceil((run.maxHp - run.hp) / 2),
})

const finishCombat = run => {
  const { combat } = run
  const best = (combat.best?.damage ?? -1) > (run.stats.best?.damage ?? -1) ? combat.best : run.stats.best
  const stats = { fights: run.stats.fights + 1, strokes: run.stats.strokes + combat.written, best }
  if (combat.status === 'lost') return { ...run, hp: 0, stats, screen: 'defeat' }
  const after = { ...run, hp: combat.hp, stats }
  if (run.offer.kind === 'boss' && run.actIndex === acts.length - 1) return { ...after, screen: 'victory' }
  const rand = rng(run.seed)
  const onward = run.offer.kind === 'boss' ? nextAct(after, rand) : after
  const gold = 12 + rand.int(6) + (run.offer.kind === 'elite' ? 20 : 0) + (run.marks.includes('gildedEdge') ? 10 : 0)
  const special = run.offer.kind !== 'fight'
  const [choices, next] = runes(rand, onward, 3, special ? 1 : 0)
  return {
    ...next,
    gold: run.gold + gold,
    screen: 'reward',
    offer: { gold, runes: choices, marks: special ? freshMarks(rand, onward, 2) : [] },
    seed: rand.state(),
  }
}

const shrineEffect = (run, option) => {
  if (option !== 0) return toMap(run)
  const rand = rng(run.seed)
  const done = next => toMap({ ...next, seed: rand.state() })
  if (run.offer.shrine === 'lectern') {
    const [mark] = freshMarks(rand, run, 1)
    return done({ ...run, hp: Math.max(1, run.hp - 8), marks: mark ? [...run.marks, mark] : run.marks })
  }
  if (run.offer.shrine === 'tidepool') {
    const ids = rand
      .shuffle(run.bag.filter(r => r.value < 4))
      .slice(0, 2)
      .map(r => r.id)
    return done({ ...run, bag: upgrade(run.bag, ids) })
  }
  return done({ ...run, gold: run.gold + 40, maxHp: run.maxHp - 5, hp: Math.min(run.hp, run.maxHp - 5) })
}

const actions = {
  choose: (run, { lane }) => (run.screen === 'map' && reachable(run).includes(lane) ? enter(run, lane) : run),
  write: (run, { path }) => {
    if (run.screen !== 'combat') return run
    const combat = write(run.combat, path)
    return combat.status === 'playing' ? { ...run, combat } : finishCombat({ ...run, combat })
  },
  endTurn: run => {
    if (run.screen !== 'combat') return run
    const combat = endTurn(run.combat)
    return combat.status === 'playing' ? { ...run, combat } : finishCombat({ ...run, combat })
  },
  takeRune: (run, { index }) => {
    const rune = run.offer?.runes?.[index]
    if (run.screen !== 'reward' || !rune) return run
    return toMap({ ...run, bag: [...run.bag, rune] })
  },
  takeMark: (run, { key }) => {
    if (run.screen !== 'reward' || !run.offer.marks.includes(key)) return run
    return { ...run, marks: [...run.marks, key], offer: { ...run.offer, marks: [] } }
  },
  buyRune: (run, { index }) => {
    const rune = run.offer?.runes?.[index]
    if (run.screen !== 'market' || !rune || run.gold < runePrice(rune)) return run
    const stock = run.offer.runes.filter((_, i) => i !== index)
    return { ...run, gold: run.gold - runePrice(rune), bag: [...run.bag, rune], offer: { ...run.offer, runes: stock } }
  },
  buyMark: (run, { key }) => {
    if (run.screen !== 'market' || !run.offer.marks.includes(key) || run.gold < markPrice) return run
    const marks = run.offer.marks.filter(k => k !== key)
    return { ...run, gold: run.gold - markPrice, marks: [...run.marks, key], offer: { ...run.offer, marks } }
  },
  remove: (run, { id }) => {
    if (run.screen !== 'market' || run.offer.removed || run.gold < removePrice || run.bag.length <= 12) return run
    if (!run.bag.some(r => r.id === id)) return run
    const bag = run.bag.filter(r => r.id !== id)
    return { ...run, gold: run.gold - removePrice, bag, offer: { ...run.offer, removed: true } }
  },
  heal: run =>
    run.screen === 'rest' ? toMap({ ...run, hp: Math.min(run.maxHp, run.hp + Math.ceil(run.maxHp * 0.3)) }) : run,
  upgrade: (run, { id }) =>
    run.screen === 'rest' && run.offer.upgrades.includes(id) ? toMap({ ...run, bag: upgrade(run.bag, [id]) }) : run,
  shrine: (run, { option }) => (run.screen === 'shrine' ? shrineEffect(run, option) : run),
  leave: run => (['reward', 'market'].includes(run.screen) ? toMap(run) : run),
}

export const act = (run, action) => actions[action.type]?.(run, action) ?? run
