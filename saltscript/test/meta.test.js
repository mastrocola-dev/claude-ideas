import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bank, chooseScribe, createMeta, lamplightEarned, runOptions, spend } from '../src/core/meta.js'
import { act, createRun } from '../src/core/run.js'

const rich = { ...createMeta(), lamplight: 100 }

test('lamplight counts floors and bosses', () => {
  assert.equal(lamplightEarned({ ...createRun(1), screen: 'defeat', floor: 4 }), 4)
  assert.equal(lamplightEarned({ ...createRun(1), screen: 'defeat', actIndex: 1, floor: 2 }), 20)
  assert.equal(lamplightEarned({ ...createRun(1), screen: 'victory', actIndex: 2, floor: 7 }), 54)
})

test('a finished run banks once and an unfinished one not at all', () => {
  const run = { ...createRun(1), screen: 'defeat', floor: 4 }
  const once = bank(createMeta(), run)
  assert.equal(once.lamplight, 4)
  assert.equal(bank(once, run), once)
  assert.equal(bank(createMeta(), createRun(1)).lamplight, 0)
})

test('spending needs the cost and only works once', () => {
  assert.deepEqual(spend(createMeta(), 'leanHand'), createMeta())
  const bought = spend(rich, 'leanHand')
  assert.equal(bought.lamplight, 70)
  assert.deepEqual(bought.unlocked, ['leanHand'])
  assert.equal(spend(bought, 'leanHand'), bought)
  assert.equal(spend(rich, 'nothing'), rich)
})

test('locked marginalia stay out of offers until unlocked', () => {
  const offered = options => {
    const seen = new Set()
    for (let seed = 1; seed <= 150; seed++) {
      const run = act(createRun(seed, options), { type: 'choose', lane: 0 })
      const combat = { ...run.combat, strokes: 0, enemy: { ...run.combat.enemy, hp: 1, burn: 5 } }
      for (const key of act({ ...run, combat, offer: { kind: 'elite' } }, { type: 'endTurn' }).offer.marks)
        seen.add(key)
    }
    return seen
  }
  assert.equal(offered({}).has('leanHand'), false)
  assert.equal(offered({ unlocked: ['leanHand'] }).has('leanHand'), true)
})

test('the Ember Novice must be unlocked and changes the new run', () => {
  assert.equal(chooseScribe(rich, 'emberNovice').scribe, 'lastScribe')
  const meta = chooseScribe(spend(rich, 'emberNovice'), 'emberNovice')
  const run = createRun(1, runOptions(meta))
  assert.deepEqual(run.marks, ['emberPsalm'])
  const embers = run.bag.filter(rune => rune.ink === 'ember').length
  assert.ok(embers > createRun(1).bag.filter(rune => rune.ink === 'ember').length)
})
