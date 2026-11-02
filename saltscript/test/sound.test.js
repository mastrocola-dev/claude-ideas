import assert from 'node:assert/strict'
import { test } from 'node:test'
import { enemies } from '../src/core/data.js'
import { isPlaying, setMood, syncMusic } from '../src/ui/music.js'
import { settings, updateSettings } from '../src/ui/settings.js'
import { defeat, eventSounds, playEvent, scratch, victory } from '../src/ui/sound.js'

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

test('sound, music and language are kept within the session', () => {
  updateSettings({ sound: false, music: false, language: 'pt' })
  assert.deepEqual(settings(), { sound: false, music: false, language: 'pt' })
  updateSettings({ language: 'klingon' })
  assert.equal(settings().language, 'pt')
  updateSettings({ sound: true, music: true, language: 'en' })
})

test('music stays silent without an audio context', () => {
  syncMusic()
  setMood('fight')
  setMood('calm')
  assert.equal(isPlaying(), false)
})
