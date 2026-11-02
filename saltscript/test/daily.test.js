import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  canStartDaily,
  createDailyRun,
  dailySeed,
  dateKey,
  recordDaily,
  shareText,
  startDaily,
} from '../src/core/daily.js'
import { createMeta } from '../src/core/meta.js'
import { act } from '../src/core/run.js'

test('two runs on the same date share a map and other dates differ', () => {
  assert.deepEqual(createDailyRun('2026-11-02').map, createDailyRun('2026-11-02').map)
  assert.notDeepEqual(createDailyRun('2026-11-02').map, createDailyRun('2026-11-03').map)
  assert.notEqual(dailySeed('2026-11-02'), dailySeed('2026-11-03'))
})

test('the date key follows UTC', () => {
  assert.equal(dateKey(new Date('2026-11-02T23:30:00-03:00')), '2026-11-03')
})

test('only one attempt starts per date and only its first ending is recorded', () => {
  const date = '2026-11-02'
  const started = startDaily(createMeta(), date)
  assert.equal(canStartDaily(createMeta(), date), true)
  assert.equal(canStartDaily(started, date), false)
  assert.equal(canStartDaily(started, '2026-11-03'), true)
  const run = {
    ...createDailyRun(date),
    screen: 'defeat',
    floor: 3,
    stats: { fights: 2, strokes: 4, best: { name: 'Verse', damage: 30 }, inks: ['brine', 'mixed'] },
  }
  const recorded = recordDaily(started, run)
  assert.deepEqual(recorded.daily.result.inks, ['brine', 'mixed'])
  assert.equal(recorded.daily.result.floor, 4)
  assert.equal(recordDaily(recorded, { ...run, floor: 7 }), recorded)
  assert.equal(recordDaily(createMeta(), run).daily, undefined)
})

test('the share text carries date, floor, greatest glyph and ink row', () => {
  const result = {
    won: false,
    act: 1,
    floor: 3,
    best: { name: 'Litany of Brine', damage: 42 },
    inks: ['brine', 'ember', 'moss', 'mixed'],
  }
  assert.equal(
    shareText('2026-11-02', result),
    'Saltscript Daily Tide 2026-11-02\nThe Sunken Nave, floor 3\nGreatest glyph: Litany of Brine, 42\n🟦🟧🟩⬜',
  )
  assert.match(
    shareText('2026-11-02', { ...result, won: true, best: null }),
    /The coast remembers\nGreatest glyph: none/,
  )
})

test('written strokes add to the ink row', () => {
  const run = act(createDailyRun('2026-11-02'), { type: 'choose', lane: 0 })
  const next = act(run, { type: 'write', path: [0, 1, 2] })
  assert.equal(next.stats.inks.length, 1)
})
