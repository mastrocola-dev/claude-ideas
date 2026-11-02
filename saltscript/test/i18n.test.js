import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  acts,
  enemies,
  firstFightHints,
  glyphTiers,
  inks,
  intentGuide,
  marginalia,
  scribes,
  shrines,
} from '../src/core/data.js'
import { glyphName, local, t } from '../src/ui/i18n.js'
import { en } from '../src/ui/locales/en.js'
import { pt } from '../src/ui/locales/pt.js'
import { updateSettings } from '../src/ui/settings.js'

const sameKeys = (a, b, where) => assert.deepEqual(Object.keys(a).sort(), Object.keys(b).sort(), where)

test('every interface string exists in Portuguese', () => {
  sameKeys(en.ui, pt.ui, 'ui')
})

test('every piece of content is translated', () => {
  for (const [section, source] of Object.entries({ inks, enemies, marginalia, scribes, shrines })) {
    sameKeys(source, pt[section], section)
  }
  for (const key of Object.keys(marginalia)) assert.ok(pt.marginalia[key].name && pt.marginalia[key].text, key)
  for (const key of Object.keys(shrines)) assert.equal(pt.shrines[key].options.length, shrines[key].options.length, key)
  assert.equal(pt.acts.length, acts.length)
  assert.equal(pt.hints.length, firstFightHints.length)
  assert.equal(pt.glyphTiers.length, glyphTiers.length)
  assert.equal(pt.intentGuide.length, intentGuide.length)
})

test('placeholders match between languages', () => {
  const holes = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()
  for (const key of Object.keys(en.ui)) assert.deepEqual(holes(pt.ui[key]), holes(en.ui[key]), key)
})

test('switching language changes names, glyphs and sentences', () => {
  updateSettings({ language: 'pt' })
  assert.equal(local('enemies', 'tide').name, 'A Maré que Desescreve')
  assert.equal(local('marginalia', 'lampOil').rarity, 'rare')
  assert.equal(glyphName({ ink: 'brine', length: 5 }), 'Ladainha de Salmoura')
  assert.equal(t('turn', { n: 3 }), 'Turno 3')
  updateSettings({ language: 'en' })
  assert.equal(glyphName({ ink: 'brine', length: 5 }), 'Litany of Brine')
  assert.equal(glyphName({ ink: null, length: 7 }), 'Canticle')
  assert.equal(local('acts', 1).name, 'The Sunken Nave')
})
