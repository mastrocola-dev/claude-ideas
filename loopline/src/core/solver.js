import { isFree, tap } from './game.js'

const keyOf = s =>
  [
    s.tiles.map(t => `${t.x}${t.y}`).join(''),
    [...s.belt].sort().join(''),
    s.bins.map(b => `${b.color}${b.fill}`).join(''),
    s.queue.length,
  ].join('|')

export const solve = (start, budget = 20000) => {
  const seen = new Set()
  let visited = 0
  const search = state => {
    if (state.status === 'won') return []
    if (state.status === 'lost' || visited++ > budget) return null
    const key = keyOf(state)
    if (seen.has(key)) return null
    seen.add(key)
    const options = state.tiles
      .filter(t => isFree(state.size, state.tiles, t))
      .map(t => ({ t, next: tap(state, t.x, t.y) }))
      .sort((a, b) => a.next.belt.length - b.next.belt.length)
    for (const { t, next } of options) {
      const rest = search({ ...next, history: [] })
      if (rest) return [[t.x, t.y], ...rest]
    }
    return null
  }
  return search({ ...start, history: [] })
}
