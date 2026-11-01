import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGame, tap } from '../src/core/game.js'
import { generate, levelFor, paramsFor } from '../src/core/levels.js'

test('the same level number always builds the same level', () => {
  assert.deepEqual(levelFor(7).tiles, levelFor(7).tiles)
})

test('generated levels are won by their solution', () => {
  for (let number = 1; number <= 60; number++) {
    const level = levelFor(number)
    const end = level.solution.reduce((game, [x, y]) => tap(game, x, y), createGame(level))
    assert.equal(end.status, 'won', `level ${number}`)
  }
})

test('generation is fast enough for the phone', () => {
  const started = performance.now()
  for (let seed = 1; seed <= 200; seed++) assert.ok(generate(paramsFor(30), seed))
  assert.ok((performance.now() - started) / 200 < 50)
})
