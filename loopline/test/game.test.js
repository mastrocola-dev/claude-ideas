import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canTap, createGame, stars, tap, undo } from '../src/core/game.js'

const red = '#r'
const blue = '#b'
const level = {
  size: 3,
  capacity: 3,
  bins: 1,
  queue: [red, blue],
  tiles: [
    { x: 0, y: 0, color: red, dir: 'up' },
    { x: 1, y: 0, color: red, dir: 'up' },
    { x: 2, y: 0, color: red, dir: 'up' },
    { x: 0, y: 1, color: blue, dir: 'up' },
    { x: 1, y: 1, color: blue, dir: 'up' },
    { x: 2, y: 1, color: blue, dir: 'up' },
  ],
}

test('a tile with a blocked path cannot be tapped', () => {
  const game = createGame(level)
  assert.equal(canTap(game, 0, 1), false)
  assert.equal(tap(game, 0, 1), game)
})

test('a matching tile goes straight into its bin', () => {
  const game = tap(createGame(level), 0, 0)
  assert.deepEqual(game.belt, [])
  assert.equal(game.bins[0].fill, 1)
})

test('three of a color clear the bin and the next color waits on the loop', () => {
  let game = createGame(level)
  for (const x of [0, 1, 2]) game = tap(game, x, 0)
  assert.deepEqual(game.bins[0], { color: blue, fill: 0 })
  assert.deepEqual(game.cleared, [red])
})

test('clearing every tile wins', () => {
  let game = createGame(level)
  for (const [x, y] of [
    [0, 0],
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ])
    game = tap(game, x, y)
  assert.equal(game.status, 'won')
  assert.equal(stars(game), 3)
})

test('overflowing the loop loses', () => {
  let game = createGame({ ...level, capacity: 2, queue: [blue, red] })
  for (const x of [0, 1, 2]) game = tap(game, x, 0)
  assert.equal(game.status, 'lost')
})

test('undo restores the previous state', () => {
  const start = createGame(level)
  const back = undo(tap(start, 0, 0))
  assert.deepEqual(back.tiles, start.tiles)
  assert.equal(back.bins[0].fill, 0)
})
