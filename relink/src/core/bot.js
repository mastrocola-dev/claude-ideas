import { canExtend, intentOf, isValid, readGlyph } from './combat.js'
import { acts, shrines } from './data.js'
import { rng } from './rng.js'
import { act, createRun, markPrice, nodeAt, reachable, runePrice } from './run.js'

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
  player: rand => state => humanPath(state, rand),
}

const decide = (run, rand) => {
  if (run.screen === 'map') return { type: 'choose', lane: rand.pick(reachable(run)) }
  if (run.screen === 'reward') return { type: 'takeRune', index: rand.int(run.offer.runes.length) }
  if (run.screen === 'rest') return { type: 'heal' }
  if (run.screen === 'shrine') return { type: 'shrine', option: rand.int(shrines[run.offer.shrine].options.length) }
  return { type: 'leave' }
}

const lowFirst = ['rest', 'market', 'shrine', 'fight', 'elite', 'boss']
const healthyFirst = ['fight', 'market', 'elite', 'shrine', 'rest', 'boss']

const plan = (run, rand) => {
  if (run.screen === 'map') {
    const order = run.hp < run.maxHp * 0.45 ? lowFirst : healthyFirst
    const rank = lane => order.indexOf(nodeAt(run, run.floor + 1, lane).kind)
    return { type: 'choose', lane: [...reachable(run)].sort((a, b) => rank(a) - rank(b))[0] }
  }
  if (run.screen === 'reward' && run.offer.marks.length) return { type: 'takeMark', key: run.offer.marks[0] }
  if (run.screen === 'reward') {
    const best = run.offer.runes.reduce((top, rune, i, all) => (rune.value > all[top].value ? i : top), 0)
    return { type: 'takeRune', index: best }
  }
  if (run.screen === 'rest' && run.hp > run.maxHp * 0.7 && run.offer.upgrades.length) {
    return { type: 'upgrade', id: run.offer.upgrades[0] }
  }
  if (run.screen === 'shrine') return { type: 'shrine', option: shrines[run.offer.shrine].options.length - 1 }
  if (run.screen === 'market' && run.offer.marks.length && run.gold >= markPrice) {
    return { type: 'buyMark', key: run.offer.marks[0] }
  }
  if (run.screen === 'market') {
    const index = run.offer.runes.findIndex(rune => rune.value >= 2 && run.gold >= runePrice(rune))
    if (index >= 0) return { type: 'buyRune', index }
  }
  return decide(run, rand)
}

const planners = { player: plan }

export const playRun = (seed, policy) => {
  const rand = rng(seed ^ 0x5a17)
  const pick = policies[policy](rand)
  let run = createRun(seed)
  const turns = []
  for (let step = 0; step < 5000 && !['victory', 'defeat'].includes(run.screen); step++) {
    if (run.screen !== 'combat') {
      run = act(run, (planners[policy] ?? decide)(run, rand))
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
