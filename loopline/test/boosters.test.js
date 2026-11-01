import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGame, reverse, stars, tap, undo, widen } from '../src/core/game.js'
import { recordWin, spendBooster } from '../src/ui/progress.js'

const [red, blue, green] = ['#r', '#b', '#g']
const level = {
  size: 3,
  capacity: 1,
  bins: 1,
  queue: [red, blue, green],
  tiles: [
    { x: 0, y: 0, color: blue, dir: 'up' },
    { x: 1, y: 0, color: green, dir: 'up' },
    { x: 2, y: 0, color: red, dir: 'up' },
  ],
}

test('undo takes back the last tap', () => {
  const start = createGame(level)
  assert.deepEqual(undo(tap(start, 0, 0)).belt, start.belt)
})

test('an extra slot lets the loop hold one more tile and survives undo', () => {
  const tight = tap(tap(createGame(level), 0, 0), 1, 0)
  assert.equal(tight.status, 'lost')
  const wide = tap(tap(widen(createGame(level)), 0, 0), 1, 0)
  assert.equal(wide.status, 'playing')
  assert.equal(undo(wide).capacity, 2)
})

test('an extra slot does not raise the stars bar', () => {
  assert.equal(stars({ capacity: 4, widened: 1, peak: 2 }), 2)
  assert.equal(stars({ capacity: 4, widened: 0, peak: 2 }), 3)
})

test('reverse flips the order of the colors still to come', () => {
  assert.deepEqual(reverse(createGame({ ...level, queue: [red, blue, green, '#y'] })).queue, ['#y', green, blue])
})

test('new stars earn boosters in turn and spending one counts down', () => {
  const start = { unlocked: 1, stars: {}, boosters: { undo: 0, widen: 0, reverse: 0 } }
  const won = recordWin(start, 1, 3)
  assert.deepEqual(won.boosters, { undo: 1, widen: 1, reverse: 1 })
  assert.deepEqual(recordWin(won, 1, 2).boosters, won.boosters)
  assert.equal(spendBooster(won, 'widen').boosters.widen, 0)
})
