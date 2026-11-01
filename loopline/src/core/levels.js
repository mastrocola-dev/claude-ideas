import { createGame, dirs, isFree } from './game.js'
import { rng } from './rng.js'
import { solve } from './solver.js'

export const palette = ['#ff5d73', '#ffb627', '#3ec5a5', '#4d9de0', '#9b6dff', '#ff8fd1']

const [red, , green, blue] = palette

const tile = (x, y, color, dir) => ({ x, y, color, dir })

const tutorials = {
  1: {
    hint: 'Tap a tile whose arrow has a clear path. It rides the loop to its color.',
    size: 3,
    capacity: 6,
    bins: 1,
    queue: [red],
    tiles: [tile(1, 0, red, 'up'), tile(1, 1, red, 'up'), tile(1, 2, red, 'up')],
  },
  2: {
    hint: 'Three of a color fill a bin. A new color takes its place.',
    size: 4,
    capacity: 6,
    bins: 1,
    queue: [green, blue],
    tiles: [
      tile(0, 1, green, 'left'),
      tile(0, 2, green, 'left'),
      tile(3, 1, green, 'right'),
      tile(1, 1, blue, 'left'),
      tile(2, 2, blue, 'down'),
      tile(3, 2, blue, 'right'),
    ],
  },
  3: {
    hint: 'The loop holds a few tiles only. Overflow it and you lose.',
    size: 4,
    capacity: 2,
    bins: 1,
    queue: [blue, red],
    tiles: [
      tile(0, 0, red, 'up'),
      tile(1, 0, red, 'up'),
      tile(3, 0, red, 'up'),
      tile(0, 1, blue, 'up'),
      tile(1, 1, blue, 'up'),
      tile(2, 0, blue, 'up'),
    ],
  },
}

const hints = { 15: 'A number on a tile counts the moves until it opens.' }

const step = (level, table) => table.findLast(([from]) => level >= from)[1]

export const paramsFor = level => ({
  size: step(level, [
    [1, 4],
    [4, 5],
    [13, 6],
    [31, 7],
  ]),
  colors: step(level, [
    [1, 3],
    [9, 4],
    [21, 5],
    [36, 6],
  ]),
  triples: step(level, [
    [1, 1],
    [6, 2],
  ]),
  bins: step(level, [
    [1, 2],
    [6, 3],
  ]),
  capacity: step(level, [
    [1, 5],
    [21, 4],
  ]),
  locks: level < 15 ? 0 : Math.min(6, 1 + Math.floor((level - 15) / 8)),
})

const place = (size, bag, rand) => {
  const tiles = []
  for (const color of bag) {
    const cells = []
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) cells.push({ x, y })
    const options = rand
      .shuffle(cells)
      .filter(c => !tiles.some(t => t.x === c.x && t.y === c.y))
      .flatMap(c => rand.shuffle(Object.keys(dirs)).map(dir => ({ ...c, color, dir })))
      .filter(t => isFree(size, tiles, t))
    if (!options.length) return null
    tiles.push(options[0])
  }
  return tiles
}

const lock = (tiles, count, rand) => {
  const order = [...tiles].reverse()
  const candidates = rand.shuffle(order.map((t, move) => ({ t, move })).filter(c => c.move >= 2))
  const locked = new Map(candidates.slice(0, count).map(c => [c.t, 1 + Math.floor(rand.next() * c.move)]))
  return tiles.map(t => (locked.has(t) ? { ...t, lock: locked.get(t) } : t))
}

const queueFor = (tiles, rand) => {
  const seen = new Map()
  const triples = []
  for (const t of [...tiles].reverse()) {
    seen.set(t.color, (seen.get(t.color) ?? 0) + 1)
    if (seen.get(t.color) % 3 === 0) triples.push(t.color)
  }
  for (let i = 0; i < triples.length - 1; i++) {
    if (rand.next() < 0.3) [triples[i], triples[i + 1]] = [triples[i + 1], triples[i]]
  }
  return triples
}

export const generate = (params, seed) => {
  const rand = rng(seed)
  const { size, colors, triples, locks } = params
  const bag = Array.from({ length: colors * triples * 3 }, (_, i) => palette[i % colors])
  for (let attempt = 0; attempt < 60; attempt++) {
    const placed = place(size, rand.shuffle(bag), rand)
    if (!placed) continue
    const tiles = lock(placed, locks, rand)
    const level = { ...params, seed, tiles, queue: queueFor(placed, rand) }
    const solution = solve(createGame(level))
    if (solution) return { ...level, solution }
  }
  return null
}

export const levelFor = number => {
  const tutorial = tutorials[number]
  if (tutorial) return { ...tutorial, number, solution: solve(createGame(tutorial)) }
  for (let offset = 0; ; offset++) {
    const level = generate(paramsFor(number), number * 7919 + offset)
    if (level) return { ...level, number, hint: hints[number] }
  }
}
