import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCombat, endTurn, readGlyph, strokesPerTurn } from '../src/core/combat.js'
import { marginalia } from '../src/core/data.js'
import { act, createRun } from '../src/core/run.js'

const rune = (ink, value = 1) => ({ id: `${ink}${value}`, ink, value })
const brine = count => Array(count).fill(rune('brine'))
const bag = Array.from({ length: 26 }, (_, i) => ({ id: `r${i}`, ink: 'brine', value: 1 }))
const fight = marks => createCombat({ bag, hp: 50, maxHp: 50, marks, enemy: 'hound', floor: 0, seed: 7 })

test('every marginalia has a rarity', () => {
  for (const mark of Object.values(marginalia)) assert.ok(['common', 'uncommon', 'rare'].includes(mark.rarity))
  assert.ok(Object.keys(marginalia).length >= 17)
})

test('Cinder Chant rewards Ember strokes only', () => {
  assert.equal(readGlyph(Array(3).fill(rune('ember')), ['cinderChant']).mult, 2)
  assert.equal(readGlyph(brine(3), ['cinderChant']).mult, 1)
})

test('Tidal Gloss and Vespers reward their own ink', () => {
  assert.equal(readGlyph(brine(3), ['tidalGloss']).mult, 3)
  assert.equal(readGlyph(Array(3).fill(rune('moss')), ['vespers']).mult, 3)
  assert.equal(readGlyph(brine(3), ['vespers']).mult, 1)
})

test('Short Hand rewards exactly three runes', () => {
  assert.equal(readGlyph(brine(3), ['shortHand']).mult, 3)
  assert.equal(readGlyph(brine(4), ['shortHand']).mult, 2)
})

test('Salt Harvest grants ward when salt crumbles', () => {
  const combat = fight(['saltHarvest'])
  const cells = combat.cells.map((cell, i) => (i < 2 ? { id: `s${i}`, ink: 'salt', value: 0, ttl: 1 } : cell))
  assert.equal(endTurn({ ...combat, cells, enemy: { ...combat.enemy, step: 1 } }).ward, 6)
  assert.equal(endTurn({ ...fight([]), cells, enemy: { ...combat.enemy, step: 1 } }).ward, 0)
})

test('Moss Edge makes moss wound as well as ward', () => {
  const moss = Array(3).fill(rune('moss', 2))
  assert.equal(readGlyph(moss, []).damage, 0)
  const glyph = readGlyph(moss, ['mossEdge'])
  assert.equal(glyph.damage, 6)
  assert.equal(glyph.ward, 6)
})

test('Salted Tongue counts salt in the stroke', () => {
  const stroke = [rune('salt', 0), rune('salt', 0), rune('brine')]
  assert.equal(readGlyph(stroke, ['saltedTongue']).mult, readGlyph(stroke, []).mult + 2)
})

test('Full Inkwell scales with the bag', () => {
  assert.equal(readGlyph(brine(3), ['fullInkwell'], 14).mult, 1)
  assert.equal(readGlyph(brine(3), ['fullInkwell'], 30).mult, 3)
})

test('Undying Ember keeps burn from fading', () => {
  const combat = fight(['undyingEmber'])
  const burning = { ...combat, enemy: { ...combat.enemy, burn: 3 } }
  assert.equal(endTurn(burning).enemy.burn, 3)
  assert.equal(endTurn({ ...burning, marks: [] }).enemy.burn, 2)
})

test('Lean Hand pays for a thin inkwell', () => {
  assert.equal(readGlyph(brine(3), ['leanHand'], 18).mult, 4)
  assert.equal(readGlyph(brine(3), ['leanHand'], 19).mult, 1)
})

test('the combat records the bag size for bag builds', () => {
  assert.equal(fight([]).bagSize, 26)
  assert.equal(strokesPerTurn(['thirdHand']), 3)
})

test('rewards roll mostly common marginalia and never one you hold', () => {
  const rolled = []
  for (let seed = 1; seed <= 200; seed++) {
    const held = ['tidalGloss']
    const run = act({ ...createRun(seed), marks: held }, { type: 'choose', lane: 0 })
    const combat = { ...run.combat, strokes: 0, enemy: { ...run.combat.enemy, hp: 1, burn: 5 } }
    const won = act({ ...run, combat, offer: { kind: 'elite' } }, { type: 'endTurn' })
    assert.equal(new Set(won.offer.marks).size, 2)
    assert.ok(!won.offer.marks.includes('tidalGloss'))
    rolled.push(...won.offer.marks)
  }
  const share = rarity => rolled.filter(key => marginalia[key].rarity === rarity).length / rolled.length
  assert.ok(share('common') > share('uncommon'))
  assert.ok(share('uncommon') > share('rare'))
  assert.ok(share('rare') > 0)
})
