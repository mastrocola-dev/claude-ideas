import assert from 'node:assert/strict'
import { test } from 'node:test'
import { feedback, setMuted } from '../src/ui/feedback.js'

const events = ['tap', 'slide', 'blocked', 'clear', 'win', 'lose']

test('every game event has feedback that is safe without audio or vibration', () => {
  assert.deepEqual(Object.keys(feedback).sort(), [...events].sort())
  for (const muted of [false, true]) {
    setMuted(muted)
    for (const event of events) assert.doesNotThrow(feedback[event])
  }
})
