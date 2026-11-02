import assert from 'node:assert/strict'
import { test } from 'node:test'
import { humanPath, playRun, summarize } from '../src/core/bot.js'
import { createCombat } from '../src/core/combat.js'
import { rng } from '../src/core/rng.js'

const seeds = Array.from({ length: 20 }, (_, i) => i + 1)

test('the exhaustive bot clears act 1 at least 90% and the human-like bot 40 to 60%', () => {
  assert.ok(summarize(seeds, 'exhaustive').firstActRate >= 0.9)
  const { firstActRate } = summarize(seeds, 'human')
  assert.ok(firstActRate >= 0.4 && firstActRate <= 0.6, `human first act rate ${firstActRate}`)
})

test('always writing the longest stroke cannot win every run', () => {
  const { winRate } = summarize(seeds, 'longest')
  assert.ok(winRate <= 0.6, `longest stroke win rate ${winRate}`)
})

test('the human-like policy is seeded and stops at depth 6', () => {
  assert.deepEqual(playRun(9, 'human'), playRun(9, 'human'))
  const bag = Array.from({ length: 26 }, (_, i) => ({ id: `r${i}`, ink: 'plasma', value: 1 }))
  const combat = createCombat({ bag, hp: 50, maxHp: 50, marks: [], enemy: 'hound', floor: 0, seed: 4 })
  assert.ok(humanPath(combat, rng(1)).length <= 6)
  assert.equal(humanPath({ ...combat, strokes: 0 }, rng(1)), null)
})

test('the exhaustive bot can finish all three acts', () => {
  const tenSeeds = seeds.slice(0, 10)
  assert.ok(tenSeeds.some(seed => playRun(seed, 'exhaustive').won))
})
