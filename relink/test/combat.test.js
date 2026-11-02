import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCombat, endTurn, hasStroke, height, isValid, readGlyph, width, write } from '../src/core/combat.js'
import { enemies } from '../src/core/data.js'

const rune = (ink, value = 1, id = `${ink}${value}${Math.random()}`) => ({ id, ink, value })
const bag = Array.from({ length: 30 }, (_, i) => rune(['plasma', 'thermal', 'shield'][i % 3], 1, `r${i}`))
const fight = (overrides = {}) =>
  createCombat({ bag, hp: 50, maxHp: 50, marks: [], enemy: 'hound', floor: 0, seed: 7, ...overrides })

test('the board starts full and keeps the rest of the bag in the pile', () => {
  const combat = fight()
  assert.equal(combat.cells.filter(Boolean).length, width * height)
  assert.equal(combat.pile.length, bag.length - width * height)
})

const page = inks => inks.map((ink, i) => (ink ? rune(ink, 1, `p${i}`) : null))
const stripes = page(Array.from({ length: 20 }, (_, i) => ['plasma', 'thermal', 'shield', 'plasma'][i % 4]))
const board = cells => ({ ...fight(), cells })

test('a stroke needs three adjacent runes of one ink without repeats', () => {
  const combat = board(stripes)
  assert.equal(isValid(combat, [0, 4]), false)
  assert.equal(isValid(combat, [0, 4, 8]), true)
  assert.equal(isValid(combat, [0, 4, 9]), false)
  assert.equal(isValid(combat, [0, 8, 12]), false)
  assert.equal(isValid(combat, [0, 4, 0]), false)
  assert.equal(isValid(combat, [3, 7, 11, 15, 19]), true)
})

test('glitch joins any ink only with Saltwise', () => {
  const cells = stripes.map((r, i) => (i === 4 ? { id: 'glitch', ink: 'glitch', value: 0, ttl: 3 } : r))
  assert.equal(isValid(board(cells), [0, 4, 8]), false)
  assert.equal(isValid({ ...board(cells), marks: ['glitchRouter'] }, [0, 4, 8]), true)
  const allSalt = cells.map(() => ({ id: 's', ink: 'glitch', value: 0, ttl: 3 }))
  assert.equal(isValid({ ...board(allSalt), marks: ['glitchRouter'] }, [0, 1, 2]), false)
})

test('mult is the number of runes minus two', () => {
  const seal = readGlyph(Array(3).fill(rune('plasma', 2)), [])
  assert.deepEqual([seal.name, seal.mult, seal.damage], ['Plasma Arc', 1, 6])
  const litany = readGlyph(Array(6).fill(rune('thermal', 1)), [])
  assert.deepEqual([litany.name, litany.mult, litany.damage, litany.burn], ['Thermal Surge', 4, 24, 6])
  const canticle = readGlyph(Array(7).fill(rune('shield', 1)), ['wideBus'])
  assert.deepEqual([canticle.name, canticle.mult, canticle.ward, canticle.damage], ['Shield Overload', 7, 49, 0])
})

test('a page with no stroke rewrites itself until one exists', () => {
  const lonely = page(
    Array.from({ length: 20 }, (_, i) => ['plasma', 'thermal', 'shield'][(i + Math.floor(i / 4)) % 3]),
  )
  assert.equal(hasStroke(board(lonely)), true)
  const scattered = page([
    'plasma',
    'thermal',
    'plasma',
    'thermal',
    'shield',
    'shield',
    null,
    null,
    ...Array(12).fill(null),
  ])
  assert.equal(hasStroke(board(scattered)), false)
})

test('every page a fight shows has a stroke, whatever the bag and the foe', () => {
  const inks = ['plasma', 'thermal', 'shield']
  for (let seed = 1; seed <= 300; seed++) {
    const size = 12 + (seed % 20)
    const mixed = Array.from({ length: size }, (_, i) => rune(inks[(i * 7 + seed) % 3], 1 + (i % 3), `m${seed}-${i}`))
    let combat = createCombat({ bag: mixed, hp: 999, maxHp: 999, marks: [], enemy: 'lumen', floor: 0, seed })
    for (let turn = 0; turn < 6 && combat.status === 'playing'; turn++) {
      assert.ok(hasStroke(combat), `seed ${seed} turn ${turn}`)
      combat = endTurn(combat)
    }
  }
})

test('writing damages the enemy, refills the board and spends a stroke', () => {
  const combat = board(stripes)
  const next = write(combat, [0, 4, 8])
  assert.equal(next.enemy.hp, combat.enemy.hp - 3)
  assert.equal(next.strokes, 1)
  assert.equal(next.cells.filter(Boolean).length, width * height)
})

test('the enemy acts on end turn once the strokes are spent', () => {
  const spent = write(write(board(stripes), [0, 4, 8]), [3, 7, 11])
  assert.equal(spent.turn, 1)
  assert.equal(spent.strokes, 0)
  assert.equal(spent.hp, 50)
  assert.equal(write(spent, [0, 4, 8]), spent)
  const combat = endTurn(spent)
  assert.equal(combat.turn, 2)
  assert.equal(combat.strokes, 2)
  assert.ok(combat.hp < 50)
  assert.equal(endTurn(fight()).hp, 50 - enemies.hound.intents[0][1])
})

test('burn ticks at the start of the enemy turn', () => {
  const combat = { ...fight(), enemy: { ...fight().enemy, burn: 3 } }
  assert.equal(endTurn(combat).enemy.hp, combat.enemy.hp - 3)
})

test('glitch clogs the board and crumbles after three turns', () => {
  let combat = endTurn(fight({ enemy: 'wisp' }))
  assert.equal(combat.cells.filter(r => r?.ink === 'glitch').length, 3)
  combat = endTurn(endTurn(endTurn(combat)))
  assert.ok(combat.cells.filter(r => r?.ink === 'glitch').length <= 3)
  assert.equal(isValid({ ...combat, cells: Array(20).fill(rune('glitch', 0)) }, [0, 1, 2]), false)
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

test('drain lowers runes worth more than one', () => {
  const combat = fight({ enemy: 'crab' })
  const cells = combat.cells.map((rune, i) => ({ ...rune, id: `c${i}`, value: i === 0 ? 3 : 1 }))
  const enemy = { ...combat.enemy, step: 1 }
  const next = endTurn({ ...combat, cells, enemy })
  assert.deepEqual(next.events.at(-1), { kind: 'drain', value: 2 })
  assert.equal(next.cells.find(rune => rune?.id === 'c0').value, 2)
})

test('reroute shifts one column down and wraps its last rune', () => {
  const combat = fight({ enemy: 'diver' })
  const cells = combat.cells.map((rune, i) => ({ ...rune, id: `c${i}` }))
  const next = endTurn({ ...combat, cells })
  const moved = next.cells.flatMap((rune, i) => (rune.id === `c${i}` ? [] : [i]))
  assert.equal(moved.length, height)
  const column = moved[0] % width
  assert.ok(moved.every(i => i % width === column))
  assert.equal(next.cells[column + width].id, `c${column}`)
  assert.equal(next.cells[column].id, `c${column + width * (height - 1)}`)
})
