import { createCombat, endTurn, write } from './combat.js'
import { acts, marginalia, rarityWeights, scribes, shrines, unlockCosts, writable } from './data.js'
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

const freshMarks = (rand, run, count) => {
  const chosen = []
  const unseen = key => !run.marks.includes(key) && !run.locked.includes(key) && !chosen.includes(key)
  for (let i = 0; i < count; i++) {
    const rarity = weighted(rand, rarityWeights)
    const open = Object.keys(marginalia).filter(unseen)
    const ofRarity = open.filter(key => marginalia[key].rarity === rarity)
    const pool = ofRarity.length ? ofRarity : open
    if (pool.length) chosen.push(rand.pick(pool))
  }
  return chosen
}

export const runePrice = rune => 14 + rune.value * 10
export const markPrice = 70
export const removePrice = 45
export const sellPrice = rune => 7 + rune.value * 5
export const sellMargin = 2

export const inkCounts = bag => {
  const counts = Object.fromEntries(writable.map(ink => [ink, 0]))
  for (const rune of bag) counts[rune.ink] += 1
  return counts
}

export const canSell = (run, rune) => inkCounts(run.bag)[rune.ink] > (run.startInks[rune.ink] ?? 0) - sellMargin

export const sortedBag = bag =>
  [...bag].sort((a, b) => writable.indexOf(a.ink) - writable.indexOf(b.ink) || b.value - a.value)
export const minBag = 12

const lockedMarks = unlocked => Object.keys(unlockCosts).filter(key => marginalia[key] && !unlocked.includes(key))

export const createRun = (seed, { scribe = 'rep7', unlocked = [] } = {}) => {
  const rand = rng(seed)
  const { bag, marks } = scribes[scribe]
  return {
    seed: rand.state(),
    origin: seed,
    actIndex: 0,
    map: createMap(rand),
    floor: -1,
    lane: null,
    trail: [],
    freeStep: false,
    hp: 70,
    maxHp: 70,
    gold: 30,
    bag: bag.map(([ink, value], i) => ({ id: `r${i}`, ink, value })),
    startInks: inkCounts(bag.map(([ink, value]) => ({ ink, value }))),
    nextId: bag.length,
    marks,
    locked: lockedMarks(unlocked),
    screen: 'map',
    combat: null,
    offer: null,
    stats: { fights: 0, strokes: 0, best: null, inks: [] },
  }
}

export const reachable = run => {
  if (run.floor === -1) return run.map[0].map(node => node.lane)
  if (run.floor === floors - 1) return []
  if (run.freeStep) return run.map[run.floor + 1].map(node => node.lane)
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
  const at = { ...run, floor, lane, trail: [...run.trail, lane], freeStep: false }
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
  const stats = { ...run.stats, fights: run.stats.fights + 1, strokes: run.stats.strokes + combat.written, best }
  if (combat.status === 'lost') return { ...run, hp: 0, stats, screen: 'defeat' }
  const after = { ...run, hp: combat.hp, stats }
  if (run.offer.kind === 'boss' && run.actIndex === acts.length - 1) return { ...after, screen: 'victory' }
  const rand = rng(run.seed)
  const onward = run.offer.kind === 'boss' ? nextAct(after, rand) : after
  const gold = 12 + rand.int(6) + (run.offer.kind === 'elite' ? 20 : 0) + (run.marks.includes('salvageClaw') ? 10 : 0)
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

const shrineEffects = {
  log: [
    (run, rand) => {
      const [mark] = freshMarks(rand, run, 1)
      return { ...run, hp: Math.max(1, run.hp - 8), marks: mark ? [...run.marks, mark] : run.marks }
    },
  ],
  echo: [
    (run, rand) => {
      const raisable = rand.shuffle(run.bag.filter(r => r.value < 4))
      return {
        ...run,
        bag: upgrade(
          run.bag,
          raisable.slice(0, 2).map(r => r.id),
        ),
      }
    },
  ],
  broker: [run => ({ ...run, gold: run.gold + 40, maxHp: run.maxHp - 5, hp: Math.min(run.hp, run.maxHp - 5) })],
  leech: [
    run => {
      const room = Math.max(0, Math.min(2, run.bag.length - minBag))
      const weakest = [...run.bag]
        .sort((a, b) => a.value - b.value)
        .slice(0, room)
        .map(r => r.id)
      return { ...run, bag: run.bag.filter(r => !weakest.includes(r.id)), maxHp: run.maxHp + 10, hp: run.hp + 10 }
    },
  ],
  alarm: [
    (run, rand) => {
      const target = rand.pick(run.bag.filter(r => r.value < 4))
      return { ...run, hp: Math.max(1, run.hp - 12), bag: upgrade(upgrade(run.bag, [target?.id]), [target?.id]) }
    },
    (run, rand) => {
      const lost = rand.pick(run.bag)
      return { ...run, gold: run.gold + 25, bag: run.bag.filter(r => r !== lost) }
    },
  ],
  derelict: [
    run => ({ ...run, hp: Math.max(1, run.hp - 6), freeStep: true }),
    (run, rand) => {
      const rune = { id: `r${run.nextId}`, ink: rand.pick(writable), value: 3 }
      return { ...run, hp: Math.max(1, run.hp - 10), bag: [...run.bag, rune], nextId: run.nextId + 1 }
    },
  ],
  oracle: [
    (run, rand) => {
      if (!run.marks.length) return run
      const lost = rand.pick(run.marks)
      const maxHp = run.maxHp + 10
      return { ...run, marks: run.marks.filter(key => key !== lost), maxHp, hp: maxHp }
    },
    (run, rand) => {
      const open = Object.keys(marginalia).filter(
        key => marginalia[key].rarity === 'rare' && !run.marks.includes(key) && !run.locked.includes(key),
      )
      const maxHp = run.maxHp - 12
      const hp = Math.min(run.hp, maxHp)
      return { ...run, maxHp, hp, marks: open.length ? [...run.marks, rand.pick(open)] : run.marks }
    },
  ],
}

const shrineEffect = (run, option) => {
  const effect = shrineEffects[run.offer.shrine][option]
  if (!effect) return toMap(run)
  const rand = rng(run.seed)
  return toMap({ ...effect(run, rand), seed: rand.state() })
}

const actions = {
  choose: (run, { lane }) => (run.screen === 'map' && reachable(run).includes(lane) ? enter(run, lane) : run),
  write: (run, { path }) => {
    if (run.screen !== 'combat') return run
    const combat = write(run.combat, path)
    if (combat === run.combat) return run
    const stats = { ...run.stats, inks: [...run.stats.inks, combat.last.ink ?? 'mixed'] }
    const next = { ...run, combat, stats }
    return combat.status === 'playing' ? next : finishCombat(next)
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
  sell: (run, { id }) => {
    const rune = run.bag.find(r => r.id === id)
    if (run.screen !== 'market' || !rune || !canSell(run, rune)) return run
    return { ...run, gold: run.gold + sellPrice(rune), bag: run.bag.filter(r => r !== rune) }
  },
  remove: (run, { id }) => {
    if (run.screen !== 'market' || run.offer.removed || run.gold < removePrice || run.bag.length <= minBag) return run
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
