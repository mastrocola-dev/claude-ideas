import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enemies } from '../src/core/data.js'
import { defeat, eventSounds, isMuted, playEvent, scratch, setMuted, victory } from '../src/ui/sound.js'

test('every foe intent has a sound', () => {
  for (const { intents } of Object.values(enemies)) {
    for (const [kind] of intents) assert.equal(typeof eventSounds[kind], 'function')
  }
  assert.equal(typeof eventSounds.burn, 'function')
})

test('nothing plays and nothing throws without an audio context', () => {
  assert.equal(globalThis.AudioContext, undefined)
  scratch(3)
  victory()
  defeat()
  playEvent({ kind: 'glyph', glyph: { mult: 3, damage: 5 } })
  for (const kind of Object.keys(eventSounds)) playEvent({ kind })
})

test('mute is remembered within the session', () => {
  setMuted(true)
  assert.equal(isMuted(), true)
  setMuted(false)
  assert.equal(isMuted(), false)
})
