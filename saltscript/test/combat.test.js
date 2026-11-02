import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCombat, endTurn, height, isValid, readGlyph, width, write } from '../src/core/combat.js'

const rune = (ink, value = 1, id = `${ink}${value}${Math.random()}`) => ({ id, ink, value })
const bag = Array.from({ length: 30 }, (_, i) => rune(['brine', 'ember', 'moss'][i % 3], 1, `r${i}`))
const fight = (overrides = {}) =>
  createCombat({ bag, hp: 50, maxHp: 50, marks: [], enemy: 'hound', floor: 0, seed: 7, ...overrides })

test('the board starts full and keeps the rest of the bag in the pile', () => {
  const combat = fight()
  assert.equal(combat.cells.filter(Boolean).length, width * height)
  assert.equal(combat.pile.length, bag.length - width * height)
})

test('a stroke needs three adjacent runes without repeats', () => {
  const combat = fight()
  assert.equal(isValid(combat, [0, 1]), false)
  assert.equal(isValid(combat, [0, 1, 2]), true)
  assert.equal(isValid(combat, [0, 5, 10]), true)
  assert.equal(isValid(combat, [0, 2, 3]), false)
  assert.equal(isValid(combat, [0, 1, 0]), false)
})

test('seals of one ink earn more mult than mixed lines', () => {
  const seal = readGlyph([rune('brine', 2), rune('brine', 2), rune('brine', 2)], [])
  const line = readGlyph([rune('brine', 2), rune('ember', 2), rune('moss', 2)], [])
  assert.deepEqual([seal.name, seal.mult, seal.damage], ['Seal of Brine', 2, 12])
  assert.deepEqual([line.name, line.mult, line.damage, line.ward, line.burn], ['Line', 1, 4, 2, 1])
})

test('longer strokes climb tiers and marginalia add to them', () => {
  const litany = readGlyph(Array(7).fill(rune('moss', 1)), ['longHand'])
  assert.deepEqual([litany.name, litany.mult, litany.ward], ['Litany of Moss', 6, 42])
})

test('writing damages the enemy, refills the board and spends a stroke', () => {
  const combat = fight()
  const next = write(combat, [0, 1, 2])
  assert.ok(next.enemy.hp < combat.enemy.hp)
  assert.equal(next.strokes, 1)
  assert.equal(next.cells.filter(Boolean).length, width * height)
})

test('the enemy acts on end turn once the strokes are spent', () => {
  const spent = write(write(fight(), [0, 1, 2]), [0, 1, 2])
  assert.equal(spent.turn, 1)
  assert.equal(spent.strokes, 0)
  assert.equal(spent.hp, 50)
  assert.equal(write(spent, [0, 1, 2]), spent)
  const combat = endTurn(spent)
  assert.equal(combat.turn, 2)
  assert.equal(combat.strokes, 2)
  assert.ok(combat.hp < 50)
  assert.equal(endTurn(fight()).hp, 50 - 9)
})

test('burn ticks at the start of the enemy turn', () => {
  const combat = { ...fight(), enemy: { ...fight().enemy, burn: 3 } }
  assert.equal(endTurn(combat).enemy.hp, combat.enemy.hp - 3)
})

test('salt clogs the board and crumbles after three turns', () => {
  let combat = endTurn(fight({ enemy: 'wraith' }))
  assert.equal(combat.cells.filter(r => r?.ink === 'salt').length, 3)
  combat = endTurn(endTurn(endTurn(combat)))
  assert.ok(combat.cells.filter(r => r?.ink === 'salt').length <= 3)
  assert.equal(isValid({ ...combat, cells: Array(20).fill(rune('salt', 0)) }, [0, 1, 2]), false)
})

test('the player loses at zero health', () => {
  const combat = endTurn({ ...fight(), hp: 3 })
  assert.equal(combat.status, 'lost')
})

test('a killing burn leaves the foe at zero', () => {
  const combat = endTurn({ ...fight(), enemy: { ...fight().enemy, hp: 2, burn: 5 } })
  assert.equal(combat.status, 'won')
  assert.equal(combat.enemy.hp, 0)
  assert.equal(combat.events[0].kind, 'burn')
})
