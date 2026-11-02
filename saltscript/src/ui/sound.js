import { settings } from './settings.js'

let context = null

export const audioContext = () => {
  if (!globalThis.AudioContext) return null
  context ??= new AudioContext()
  if (context.state === 'suspended') context.resume()
  return context
}

const audio = () => (settings().sound ? audioContext() : null)

const tone = ({ from, to = from, duration, type = 'sine', volume = 0.15, delay = 0 }) => {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(from, start)
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

const noise = ({ duration, band, volume = 0.1, delay = 0 }) => {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.frequency.value = band
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  source.connect(filter).connect(gain).connect(ctx.destination)
  source.start(start)
}

const buzz = pattern => {
  if (settings().sound) globalThis.navigator?.vibrate?.(pattern)
}

export const scratch = length => noise({ duration: 0.05, band: 1600 + length * 300, volume: 0.12 })

export const stamp = mult => {
  const depth = 240 / (1 + mult * 0.4)
  tone({ from: depth, to: depth / 2, duration: 0.18, type: 'triangle', volume: 0.3 })
  noise({ duration: 0.06, band: 500, volume: 0.15 })
  buzz(12)
}

export const wound = () => tone({ from: 320, to: 90, duration: 0.2, type: 'sawtooth', volume: 0.1 })

export const eventSounds = {
  attack: () => {
    wound()
    buzz(40)
  },
  ward: () => tone({ from: 300, to: 420, duration: 0.2, volume: 0.1 }),
  rise: () => tone({ from: 110, to: 220, duration: 0.35, type: 'sawtooth', volume: 0.07 }),
  smudge: () => noise({ duration: 0.25, band: 900, volume: 0.12 }),
  undertow: () => tone({ from: 160, to: 60, duration: 0.5, volume: 0.2 }),
  rewrite: () => {
    for (const delay of [0, 0.05, 0.1, 0.15, 0.2]) noise({ duration: 0.05, band: 2200, volume: 0.08, delay })
  },
  burn: () => noise({ duration: 0.35, band: 5000, volume: 0.1 }),
  salt: () => {
    for (const delay of [0, 0.07, 0.15, 0.24]) noise({ duration: 0.04, band: 3500, volume: 0.14, delay })
  },
}

export const victory = () => {
  for (const [i, from] of [392, 494, 587, 784].entries()) tone({ from, duration: 0.3, delay: i * 0.11 })
  buzz([20, 40, 20])
}

export const defeat = () => {
  for (const [i, from] of [294, 233, 175].entries()) {
    tone({ from, to: from * 0.9, duration: 0.5, type: 'triangle', delay: i * 0.25 })
  }
  buzz(120)
}

export const playEvent = event => {
  if (event.kind !== 'glyph') return eventSounds[event.kind]()
  stamp(event.glyph.mult)
  if (event.glyph.damage) wound()
}
