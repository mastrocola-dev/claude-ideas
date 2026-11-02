import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCombat, endTurn, readGlyph, strokesPerTurn } from '../src/core/combat.js'
import { marginalia } from '../src/core/data.js'
import { act, createRun } from '../src/core/run.js'

const rune = (ink, value = 1) => ({ id: `${ink}${value}`, ink, value })
const plasma = count => Array(count).fill(rune('plasma'))
const bag = Array.from({ length: 26 }, (_, i) => ({ id: `r${i}`, ink: 'plasma', value: 1 }))
const fight = marks => createCombat({ bag, hp: 50, maxHp: 50, marks, enemy: 'hound', floor: 0, seed: 7 })

test('every marginalia has a rarity', () => {
  for (const mark of Object.values(marginalia)) assert.ok(['common', 'uncommon', 'rare'].includes(mark.rarity))
  assert.ok(Object.keys(marginalia).length >= 17)
})

test('Cinder Chant rewards Ember strokes only', () => {
  assert.equal(readGlyph(Array(3).fill(rune('thermal')), ['thermalCoil']).mult, 2)
  assert.equal(readGlyph(plasma(3), ['thermalCoil']).mult, 1)
})

test('Tidal Gloss and Vespers reward their own ink', () => {
  assert.equal(readGlyph(plasma(3), ['plasmaLens']).mult, 3)
  assert.equal(readGlyph(Array(3).fill(rune('shield')), ['shieldCapacitor']).mult, 3)
  assert.equal(readGlyph(plasma(3), ['shieldCapacitor']).mult, 1)
})

test('Short Hand rewards exactly three runes', () => {
  assert.equal(readGlyph(plasma(3), ['shortCircuit']).mult, 3)
  assert.equal(readGlyph(plasma(4), ['shortCircuit']).mult, 2)
})

test('Salt Harvest grants ward when glitch crumbles', () => {
  const combat = fight(['glitchRecycler'])
  const cells = combat.cells.map((cell, i) => (i < 2 ? { id: `s${i}`, ink: 'glitch', value: 0, ttl: 1 } : cell))
  assert.equal(endTurn({ ...combat, cells, enemy: { ...combat.enemy, step: 1 } }).ward, 6)
  assert.equal(endTurn({ ...fight([]), cells, enemy: { ...combat.enemy, step: 1 } }).ward, 0)
})

test('Moss Edge makes shield wound as well as ward', () => {
  const shield = Array(3).fill(rune('shield', 2))
  assert.equal(readGlyph(shield, []).damage, 0)
  const glyph = readGlyph(shield, ['spikedShield'])
  assert.equal(glyph.damage, 6)
  assert.equal(glyph.ward, 6)
})

test('Salted Tongue counts glitch in the stroke', () => {
  const stroke = [rune('glitch', 0), rune('glitch', 0), rune('plasma')]
  assert.equal(readGlyph(stroke, ['noiseAmp']).mult, readGlyph(stroke, []).mult + 2)
})

test('Full Inkwell scales with the bag', () => {
  assert.equal(readGlyph(plasma(3), ['deepCache'], 14).mult, 1)
  assert.equal(readGlyph(plasma(3), ['deepCache'], 30).mult, 3)
})

test('Undying Ember keeps burn from fading', () => {
  const combat = fight(['meltdown'])
  const burning = { ...combat, enemy: { ...combat.enemy, burn: 3 } }
  assert.equal(endTurn(burning).enemy.burn, 3)
  assert.equal(endTurn({ ...burning, marks: [] }).enemy.burn, 2)
})

test('Lean Hand pays for a thin inkwell', () => {
  assert.equal(readGlyph(plasma(3), ['leanBuild'], 18).mult, 4)
  assert.equal(readGlyph(plasma(3), ['leanBuild'], 19).mult, 1)
})

test('the combat records the bag size for bag builds', () => {
  assert.equal(fight([]).bagSize, 26)
  assert.equal(strokesPerTurn(['thirdArm']), 3)
})

test('rewards roll mostly common marginalia and never one you hold', () => {
  const rolled = []
  for (let seed = 1; seed <= 200; seed++) {
    const held = ['plasmaLens']
    const run = act({ ...createRun(seed), marks: held }, { type: 'choose', lane: 0 })
    const combat = { ...run.combat, strokes: 0, enemy: { ...run.combat.enemy, hp: 1, burn: 5 } }
    const won = act({ ...run, combat, offer: { kind: 'elite' } }, { type: 'endTurn' })
    assert.equal(new Set(won.offer.marks).size, 2)
    assert.ok(!won.offer.marks.includes('plasmaLens'))
    rolled.push(...won.offer.marks)
  }
  const share = rarity => rolled.filter(key => marginalia[key].rarity === rarity).length / rolled.length
  assert.ok(share('common') > share('uncommon'))
  assert.ok(share('uncommon') > share('rare'))
  assert.ok(share('rare') > 0)
})
