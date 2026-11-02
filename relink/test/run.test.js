import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bestPath } from '../src/core/bot.js'
import { act, createRun, floors, nodeAt, openLanes, reachable } from '../src/core/run.js'

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

test('the trail records each step and open lanes follow the links ahead', () => {
  const start = createRun(7)
  assert.deepEqual(start.trail, [])
  assert.deepEqual(openLanes(start)[0], [0, 1, 2])
  const run = { ...act(start, { type: 'choose', lane: 0 }), screen: 'map', combat: null }
  assert.deepEqual(run.trail, [0])
  const open = openLanes(run)
  assert.deepEqual(open[0], [])
  assert.deepEqual(open[1], nodeAt(run, 0, 0).links)
  const expected = [...new Set(open[1].flatMap(lane => nodeAt(run, 1, lane).links))]
  assert.deepEqual(open[2], expected)
  assert.deepEqual(open[floors - 1], [1])
})

test('rewards add a rune to the bag and return to the map', () => {
  const run = {
    ...createRun(2),
    screen: 'reward',
    offer: { runes: [{ id: 'x', ink: 'thermal', value: 3 }], marks: [] },
  }
  const next = act(run, { type: 'takeRune', index: 0 })
  assert.equal(next.screen, 'map')
  assert.equal(next.bag.at(-1).id, 'x')
})

test('the market charges gold and refuses what you cannot afford', () => {
  const offer = { runes: [{ id: 'x', ink: 'shield', value: 2 }], marks: ['overclock'] }
  const run = { ...createRun(2), screen: 'market', gold: 40, offer }
  const bought = act(run, { type: 'buyRune', index: 0 })
  assert.equal(bought.gold, 6)
  assert.equal(act(run, { type: 'buyMark', key: 'overclock' }), run)
})

test('the bot can finish whole runs without errors', () => {
  const results = [1, 2, 3].map(seed => autoplay(seed).screen)
  assert.ok(results.every(screen => ['victory', 'defeat'].includes(screen)))
})

const bossDown = (run, offerKind = 'boss') => {
  const combat = {
    ...run.combat,
    status: 'playing',
    strokes: 0,
    hp: 20,
    maxHp: 70,
    enemy: { ...run.combat.enemy, hp: 1, burn: 5 },
  }
  return act({ ...run, screen: 'combat', combat, hp: 20, offer: { kind: offerKind } }, { type: 'endTurn' })
}

test('beating a boss opens the next act, heals half the missing health and offers marginalia', () => {
  const base = act(createRun(4), { type: 'choose', lane: 0 })
  const next = bossDown(base)
  assert.equal(next.actIndex, 1)
  assert.equal(next.floor, -1)
  assert.deepEqual(next.trail, [])
  assert.equal(next.hp, 45)
  assert.equal(next.screen, 'reward')
  assert.equal(next.offer.marks.length, 2)
  assert.notDeepEqual(next.map, base.map)
})

test('the third boss ends the run in victory', () => {
  const base = act({ ...createRun(4), actIndex: 2 }, { type: 'choose', lane: 0 })
  assert.equal(bossDown(base).screen, 'victory')
})

test('each act draws foes from its own pool', () => {
  const run = act({ ...createRun(8), actIndex: 1 }, { type: 'choose', lane: 0 })
  assert.ok(['crab', 'diver'].includes(run.combat.enemy.key))
})
