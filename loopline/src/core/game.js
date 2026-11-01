export const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

const tileAt = (tiles, x, y) => tiles.find(t => t.x === x && t.y === y)

export const isFree = (size, tiles, tile) => {
  const [dx, dy] = dirs[tile.dir]
  for (let x = tile.x + dx, y = tile.y + dy; x >= 0 && y >= 0 && x < size && y < size; x += dx, y += dy) {
    if (tileAt(tiles, x, y)) return false
  }
  return true
}

const statusOf = ({ size, tiles, belt, capacity }) => {
  if (!tiles.length && !belt.length) return 'won'
  if (belt.length > capacity) return 'lost'
  if (!tiles.some(t => isFree(size, tiles, t))) return 'lost'
  return 'playing'
}

const settle = state => {
  const belt = [...state.belt]
  const queue = [...state.queue]
  const bins = state.bins.map(b => ({ ...b }))
  const cleared = []
  let changed = true
  while (changed) {
    changed = false
    for (const bin of bins) {
      const i = belt.indexOf(bin.color)
      if (bin.color === null || i < 0) continue
      belt.splice(i, 1)
      bin.fill += 1
      changed = true
      if (bin.fill < 3) continue
      cleared.push(bin.color)
      Object.assign(bin, { color: queue.shift() ?? null, fill: 0 })
    }
  }
  const next = { ...state, belt, queue, bins, cleared, peak: Math.max(state.peak, belt.length) }
  return { ...next, status: statusOf(next) }
}

export const createGame = ({ size, tiles, queue, bins, capacity }) =>
  settle({
    size,
    capacity,
    tiles: tiles.map(t => ({ ...t })),
    bins: queue.slice(0, bins).map(color => ({ color, fill: 0 })),
    queue: queue.slice(bins),
    belt: [],
    moves: 0,
    peak: 0,
    history: [],
  })

export const canTap = (state, x, y) => {
  const tile = tileAt(state.tiles, x, y)
  return state.status === 'playing' && Boolean(tile) && isFree(state.size, state.tiles, tile)
}

export const tap = (state, x, y) => {
  if (!canTap(state, x, y)) return state
  const tile = tileAt(state.tiles, x, y)
  const { history, cleared, status, ...snapshot } = state
  return settle({
    ...state,
    tiles: state.tiles.filter(t => t !== tile),
    belt: [...state.belt, tile.color],
    moves: state.moves + 1,
    history: [...history, snapshot],
    last: tile,
  })
}

export const undo = state => {
  const previous = state.history.at(-1)
  if (!previous) return state
  return settle({ ...previous, history: state.history.slice(0, -1), last: null })
}

export const stars = state => (state.peak <= state.capacity - 2 ? 3 : state.peak <= state.capacity - 1 ? 2 : 1)
