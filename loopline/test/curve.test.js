import assert from 'node:assert/strict'
import { test } from 'node:test'
import { canTap, createGame, tap } from '../src/core/game.js'
import { levelFor, paramsFor } from '../src/core/levels.js'
import { analyze } from '../src/core/solver.js'

const expected = [
  { from: 1, to: 10, branching: [3.5, 4.5] },
  { from: 11, to: 20, branching: [5.3, 6.3] },
  { from: 21, to: 30, branching: [6.5, 7.5] },
  { from: 31, to: 40, branching: [7.4, 8.4] },
  { from: 41, to: 50, branching: [8, 9] },
]

const peakOf = (level, solution) => solution.reduce((game, [x, y]) => tap(game, x, y), createGame(level)).peak

test('the first three levels are hand-made tutorials with hints', () => {
  for (const number of [1, 2, 3]) {
    const level = levelFor(number)
    assert.ok(level.hint, `level ${number}`)
    assert.equal(level.seed, undefined)
  }
  assert.equal(analyze(createGame(levelFor(3))).optimum, levelFor(3).capacity)
})

test('a locked tile opens after its count of moves', () => {
  const level = {
    size: 3,
    capacity: 3,
    bins: 1,
    queue: ['#r'],
    tiles: [
      { x: 0, y: 0, color: '#r', dir: 'up', lock: 2 },
      { x: 1, y: 0, color: '#r', dir: 'up' },
      { x: 2, y: 0, color: '#r', dir: 'up' },
    ],
  }
  let game = createGame(level)
  assert.equal(canTap(game, 0, 0), false)
  game = tap(tap(game, 1, 0), 2, 0)
  assert.equal(canTap(game, 0, 0), true)
})

test('locked tiles appear from level 15', () => {
  assert.equal(paramsFor(14).locks, 0)
  assert.ok(levelFor(15).tiles.some(t => t.lock))
})

test('the solver reports an optimum its solution reaches', () => {
  for (let number = 1; number <= 50; number++) {
    const level = levelFor(number)
    const { optimum, solution } = analyze(createGame(level))
    assert.ok(optimum <= level.capacity, `level ${number}`)
    assert.equal(peakOf(level, solution), optimum, `level ${number}`)
  }
})

test('branching rises smoothly over levels 1 to 50', () => {
  let previous = 0
  for (const { from, to, branching } of expected) {
    let sum = 0
    for (let number = from; number <= to; number++) sum += analyze(createGame(levelFor(number))).branching
    const mean = sum / (to - from + 1)
    assert.ok(mean >= branching[0] && mean <= branching[1], `levels ${from}-${to}: ${mean}`)
    assert.ok(mean > previous, `levels ${from}-${to}`)
    previous = mean
  }
})
