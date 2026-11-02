import assert from 'node:assert/strict'
import { test } from 'node:test'
import { marginalia, shrines } from '../src/core/data.js'
import { act, createRun, reachable } from '../src/core/run.js'

const at = (shrine, changes = {}) => ({ ...createRun(5), screen: 'shrine', offer: { shrine }, ...changes })
const choose = (shrine, option, changes) => act(at(shrine, changes), { type: 'shrine', option })

test('the last option of every shrine walks away unchanged', () => {
  for (const [key, shrine] of Object.entries(shrines)) {
    const before = at(key)
    const after = act(before, { type: 'shrine', option: shrine.options.length - 1 })
    assert.equal(after.screen, 'map')
    assert.deepEqual(after.bag, before.bag)
    assert.equal(after.hp, before.hp)
    assert.equal(after.gold, before.gold)
    assert.deepEqual(after.marks, before.marks)
  }
})

test('the Ink Leech takes the two weakest runes for max health', () => {
  const run = choose('leech', 0)
  assert.equal(run.bag.length, 24)
  assert.equal(run.maxHp, 80)
  assert.equal(run.hp, 80)
  assert.ok(run.bag.some(rune => rune.value === 2))
})

test('the Ink Leech stops at the smallest inkwell', () => {
  const bag = createRun(5).bag.slice(0, 13)
  assert.equal(choose('leech', 0, { bag }).bag.length, 12)
})

test('ringing the Tide Bell raises one rune by two for health', () => {
  const before = at('alarm')
  const run = choose('alarm', 0)
  const sum = bag => bag.reduce((total, rune) => total + rune.value, 0)
  assert.equal(sum(run.bag), sum(before.bag) + 2)
  assert.equal(run.hp, 58)
})

test('muffling the Tide Bell trades a rune for gold', () => {
  const run = choose('alarm', 1)
  assert.equal(run.bag.length, 25)
  assert.equal(run.gold, 55)
})

test("the Mapmaker's chart opens every node once", () => {
  const start = act(createRun(5), { type: 'choose', lane: 0 })
  const here = { ...start, screen: 'shrine', offer: { shrine: 'derelict' }, combat: null }
  const run = act(here, { type: 'shrine', option: 0 })
  assert.equal(run.hp, 64)
  assert.deepEqual(reachable(run), [0, 1, 2])
  const stepped = act(run, { type: 'choose', lane: 2 })
  assert.equal(stepped.lane, 2)
  assert.equal(stepped.freeStep, false)
})

test("the Mapmaker's satchel holds a rune worth three", () => {
  const run = choose('derelict', 1)
  assert.equal(run.bag.at(-1).value, 3)
  assert.equal(run.bag.length, 27)
  assert.equal(run.nextId, 27)
  assert.equal(run.hp, 60)
})

test('the Lamp takes a marginalia and heals fully', () => {
  const run = choose('oracle', 0, { hp: 10, marks: ['overclock'] })
  assert.deepEqual(run.marks, [])
  assert.equal(run.maxHp, 80)
  assert.equal(run.hp, 80)
})

test('the Lamp leaves you be if you hold no marginalia', () => {
  const run = choose('oracle', 0, { hp: 10 })
  assert.equal(run.maxHp, 70)
  assert.equal(run.hp, 10)
})

test('the Lamp trades max health for a rare marginalia', () => {
  const run = choose('oracle', 1)
  assert.equal(run.maxHp, 58)
  assert.equal(run.hp, 58)
  assert.equal(marginalia[run.marks[0]].rarity, 'rare')
})

test('the older shrines still keep their bargains', () => {
  const log = choose('log', 0)
  assert.equal(log.hp, 62)
  assert.equal(log.marks.length, 1)
  const before = at('echo').bag.reduce((total, rune) => total + rune.value, 0)
  assert.equal(
    choose('echo', 0).bag.reduce((total, rune) => total + rune.value, 0),
    before + 2,
  )
  const broker = choose('broker', 0)
  assert.equal(broker.gold, 70)
  assert.equal(broker.maxHp, 65)
})
