import { canExtend, intentOf, isValid, readGlyph } from './combat.js'
import { acts, shrines } from './data.js'
import { rng } from './rng.js'
import { act, createRun, reachable } from './run.js'

const worth = (state, glyph, threat) => {
  const lethal = glyph.damage >= state.enemy.hp + state.enemy.ward ? 1000 : 0
  const guard = Math.min(glyph.ward, Math.max(0, threat - state.ward))
  return lethal + glyph.damage + guard * 1.2 + glyph.burn * 2 + glyph.length * 0.1
}

const keep = 3

const rankPaths = (state, depth) => {
  if (!state.strokes) return []
  const intent = intentOf(state)
  const threat = intent.kind === 'attack' ? intent.value : 0
  const cells = state.cells.map((_, i) => i)
  const ranked = []
  const walk = path => {
    if (path.length >= 3 && isValid(state, path)) {
      const runes = path.map(i => state.cells[i])
      const score = worth(state, readGlyph(runes, state.marks, state.bagSize), threat)
      if (ranked.length < keep || score > ranked.at(-1).score) {
        ranked.push({ score, path })
        ranked.sort((x, y) => y.score - x.score)
        ranked.length = Math.min(ranked.length, keep)
      }
    }
    if (path.length === depth) return
    for (const next of cells) {
      if (canExtend(state, path, next)) walk([...path, next])
    }
  }
  for (const start of cells) if (canExtend(state, [], start)) walk([start])
  return ranked
}

export const bestPath = (state, depth = 8) => rankPaths(state, depth)[0]?.path ?? null

export const humanPath = (state, rand, depth = 6) => {
  const top = rankPaths(state, depth).slice(0, 3)
  return top.length ? rand.pick(top).path : null
}

export const longestPath = state => {
  if (!state.strokes) return null
  let best = null
  const walk = path => {
    if (isValid(state, path) && (!best || path.length > best.length)) best = path
    for (let next = 0; next < state.cells.length; next++) if (canExtend(state, path, next)) walk([...path, next])
  }
  for (let start = 0; start < state.cells.length; start++) if (canExtend(state, [], start)) walk([start])
  return best
}

export const policies = {
  longest: () => longestPath,
  exhaustive: () => state => bestPath(state, 8),
  human: rand => state => humanPath(state, rand),
}

const decide = (run, rand) => {
  if (run.screen === 'map') return { type: 'choose', lane: rand.pick(reachable(run)) }
  if (run.screen === 'reward') return { type: 'takeRune', index: rand.int(run.offer.runes.length) }
  if (run.screen === 'rest') return { type: 'heal' }
  if (run.screen === 'shrine') return { type: 'shrine', option: rand.int(shrines[run.offer.shrine].options.length) }
  return { type: 'leave' }
}

export const playRun = (seed, policy) => {
  const rand = rng(seed ^ 0x5a17)
  const pick = policies[policy](rand)
  let run = createRun(seed)
  const turns = []
  for (let step = 0; step < 5000 && !['victory', 'defeat'].includes(run.screen); step++) {
    if (run.screen !== 'combat') {
      run = act(run, decide(run, rand))
      continue
    }
    const path = pick(run.combat)
    run = act(run, path ? { type: 'write', path } : { type: 'endTurn' })
    if (run.screen !== 'combat') turns.push(run.combat.turn)
  }
  return {
    won: run.screen === 'victory',
    actsCleared: run.screen === 'victory' ? acts.length : run.actIndex,
    floor: run.floor + 1,
    turns,
  }
}

export const summarize = (seeds, policy) => {
  const results = seeds.map(seed => playRun(seed, policy))
  const mean = values => values.reduce((sum, value) => sum + value, 0) / (values.length || 1)
  return {
    firstActRate: results.filter(result => result.actsCleared >= 1).length / results.length,
    winRate: results.filter(result => result.won).length / results.length,
    actsCleared: mean(results.map(result => result.actsCleared)),
    turnsPerFight: mean(results.flatMap(result => result.turns)),
  }
}
