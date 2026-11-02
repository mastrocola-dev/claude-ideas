import { adjacent, canWrite, intentOf, readGlyph } from './combat.js'

const worth = (state, glyph, threat) => {
  const lethal = glyph.damage >= state.enemy.hp + state.enemy.ward ? 1000 : 0
  const guard = Math.min(glyph.ward, Math.max(0, threat - state.ward))
  return lethal + glyph.damage + guard * 1.2 + glyph.burn * 2 + glyph.length * 0.1
}

export const bestPath = (state, depth = 6) => {
  if (!state.strokes) return null
  const intent = intentOf(state)
  const threat = intent.kind === 'attack' ? intent.value : 0
  const cells = state.cells.map((_, i) => i).filter(i => canWrite(state, i))
  let best = { score: -1, path: null }
  const walk = path => {
    if (path.length >= 3) {
      const score = worth(
        state,
        readGlyph(
          path.map(i => state.cells[i]),
          state.marks,
        ),
        threat,
      )
      if (score > best.score) best = { score, path }
    }
    if (path.length === depth) return
    for (const next of cells) {
      if (!path.includes(next) && adjacent(path.at(-1), next)) walk([...path, next])
    }
  }
  for (const start of cells) walk([start])
  return best.path
}
