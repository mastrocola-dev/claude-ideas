import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dailyLevel, dayKey, recordDaily, shareText } from '../src/core/daily.js'
import { createGame, tap } from '../src/core/game.js'

const key = '2026-10-31'

test('the same date always builds the same solvable daily level', () => {
  const level = dailyLevel(dayKey(new Date('2026-10-31T23:59:00Z')))
  assert.deepEqual(level.tiles, dailyLevel(key).tiles)
  assert.notDeepEqual(level.tiles, dailyLevel('2026-11-01').tiles)
  const end = level.solution.reduce((game, [x, y]) => tap(game, x, y), createGame(level))
  assert.equal(end.status, 'won')
})

test('only the first attempt of a day is recorded and wins in a row build a streak', () => {
  const first = recordDaily({ streak: 0 }, '2026-10-30', { won: true, moves: 30, stars: 2 })
  const second = recordDaily(first, key, { won: true, moves: 30, stars: 3 })
  assert.equal(second.streak, 2)
  assert.equal(recordDaily(second, key, { won: false, moves: 9, stars: 0 }), second)
  assert.equal(recordDaily(second, '2026-11-02', { won: true, moves: 30, stars: 3 }).streak, 1)
  assert.equal(recordDaily(second, '2026-11-01', { won: false, moves: 9, stars: 0 }).streak, 0)
})

test('share text shows the date, a ring of the day colors, moves, stars and streak', () => {
  const level = dailyLevel(key)
  const daily = recordDaily({ streak: 0 }, key, { won: true, moves: 30, stars: 2 })
  const lines = shareText(level, daily).split('\n')
  assert.equal(lines.length, 6)
  assert.equal(lines[0], `Loopline Daily ${key}`)
  assert.match(lines[2], /^[🟥🟨🟩🟦🟪🟧]✅[🟥🟨🟩🟦🟪🟧]$/u)
  assert.equal(lines[4], '30 moves ⭐⭐☆')
  assert.equal(lines[5], '🔥 1')
})
