import { createGame, dirs, isFree } from './game.js'
import { rng } from './rng.js'
import { solve } from './solver.js'

export const palette = ['#ff5d73', '#ffb627', '#3ec5a5', '#4d9de0', '#9b6dff', '#ff8fd1']

export const tutorial = {
  1: 'Tap a tile whose arrow has a clear path. It rides the loop to its color.',
  2: 'Three of a color fill a bin. A new color takes its place.',
  3: 'The loop holds a few tiles only. Overflow it and you lose.',
}

export const paramsFor = level => ({
  size: level < 4 ? 4 : level < 13 ? 5 : level < 31 ? 6 : 7,
  colors: level < 3 ? 2 : level < 9 ? 3 : level < 21 ? 4 : level < 41 ? 5 : 6,
  triples: level < 6 ? 1 : 2,
  bins: level < 6 ? 2 : 3,
  capacity: level < 4 ? 6 : level < 21 ? 5 : 4,
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
  const { size, colors, triples } = params
  const bag = Array.from({ length: colors * triples * 3 }, (_, i) => palette[i % colors])
  for (let attempt = 0; attempt < 60; attempt++) {
    const tiles = place(size, rand.shuffle(bag), rand)
    if (!tiles) continue
    const level = { ...params, seed, tiles, queue: queueFor(tiles, rand) }
    const solution = solve(createGame(level))
    if (solution) return { ...level, solution }
  }
  return null
}

export const levelFor = number => {
  for (let offset = 0; ; offset++) {
    const level = generate(paramsFor(number), number * 7919 + offset)
    if (level) return { ...level, number, hint: tutorial[number] }
  }
}
