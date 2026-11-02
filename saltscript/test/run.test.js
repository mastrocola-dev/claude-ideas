import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bestPath } from '../src/core/bot.js'
import { act, createRun, floors, nodeAt, reachable } from '../src/core/run.js'

const autoplay = seed => {
  let run = createRun(seed)
  for (let step = 0; step < 3000 && !['victory', 'defeat'].includes(run.screen); step++) {
    if (run.screen === 'map') run = act(run, { type: 'choose', lane: reachable(run)[0] })
    else if (run.screen === 'combat') {
      const path = bestPath(run.combat, 5)
      run = act(run, path ? { type: 'write', path } : { type: 'endTurn' })
    } else if (run.screen === 'reward') run = act(run, { type: 'takeRune', index: 0 })
    else if (run.screen === 'rest') run = act(run, { type: 'heal' })
    else if (run.screen === 'shrine') run = act(run, { type: 'shrine', option: 0 })
    else run = act(run, { type: 'leave' })
  }
  return run
}

test('the map has a single boss at the top and every node leads on', () => {
  const run = createRun(3)
  assert.equal(run.map.length, floors)
  assert.equal(run.map.at(-1)[0].kind, 'boss')
  for (const floor of run.map.slice(0, -1)) {
    for (const node of floor) assert.ok(node.links.length >= 1)
  }
  assert.equal(nodeAt(run, 0, 0).kind, 'fight')
})

test('a run is the same for the same seed', () => {
  assert.deepEqual(createRun(11).map, createRun(11).map)
})

test('only linked nodes can be chosen', () => {
  let run = act(createRun(5), { type: 'choose', lane: 0 })
  run = { ...run, screen: 'map', combat: null }
  const blocked = [0, 1, 2].find(lane => !reachable(run).includes(lane))
  if (blocked !== undefined) assert.equal(act(run, { type: 'choose', lane: blocked }), run)
})

test('rewards add a rune to the bag and return to the map', () => {
  const run = { ...createRun(2), screen: 'reward', offer: { runes: [{ id: 'x', ink: 'ember', value: 3 }], marks: [] } }
  const next = act(run, { type: 'takeRune', index: 0 })
  assert.equal(next.screen, 'map')
  assert.equal(next.bag.at(-1).id, 'x')
})

test('the market charges gold and refuses what you cannot afford', () => {
  const offer = { runes: [{ id: 'x', ink: 'moss', value: 2 }], marks: ['lampOil'] }
  const run = { ...createRun(2), screen: 'market', gold: 40, offer }
  const bought = act(run, { type: 'buyRune', index: 0 })
  assert.equal(bought.gold, 6)
  assert.equal(act(run, { type: 'buyMark', key: 'lampOil' }), run)
})

test('the bot can finish whole runs without errors', () => {
  const results = [1, 2, 3].map(seed => autoplay(seed).screen)
  assert.ok(results.every(screen => ['victory', 'defeat'].includes(screen)))
  assert.ok(results.includes('victory'))
})
