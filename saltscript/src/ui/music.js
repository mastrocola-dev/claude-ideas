import { settings } from './settings.js'
import { audioContext } from './sound.js'

const moods = {
  calm: { drone: [73.42, 110], notes: [293.66, 349.23, 392, 440, 523.25, 587.33], gap: [2.6, 4.4], level: 0.5 },
  fight: { drone: [73.42, 77.78], notes: [146.83, 174.61, 196, 220, 233.08, 261.63], gap: [0.8, 1.6], level: 0.6 },
}

let score = null
let mood = 'calm'

const bell = (ctx, out, frequency, delay) => {
  const start = ctx.currentTime + delay
  const tone = ctx.createOscillator()
  const shimmer = ctx.createOscillator()
  const gain = ctx.createGain()
  tone.type = 'sine'
  shimmer.type = 'triangle'
  tone.frequency.value = frequency
  shimmer.frequency.value = frequency * 2.01
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.09, start + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.8)
  tone.connect(gain)
  shimmer.connect(gain)
  gain.connect(out)
  for (const node of [tone, shimmer]) {
    node.start(start)
    node.stop(start + 3)
  }
}

const sea = (ctx, out) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const swell = ctx.createGain()
  const tide = ctx.createOscillator()
  const depth = ctx.createGain()
  source.buffer = buffer
  source.loop = true
  filter.type = 'lowpass'
  filter.frequency.value = 420
  swell.gain.value = 0.05
  tide.frequency.value = 0.11
  depth.gain.value = 0.04
  tide.connect(depth).connect(swell.gain)
  source.connect(filter).connect(swell).connect(out)
  source.start()
  tide.start()
  return [source, tide]
}

const drones = (ctx, out) =>
  moods[mood].drone.map(frequency => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.value = 0.05
    osc.connect(gain).connect(out)
    osc.start()
    return osc
  })

const ring = () => {
  if (!score) return
  const { ctx, out } = score
  const { notes, gap } = moods[mood]
  bell(ctx, out, notes[Math.floor(Math.random() * notes.length)], 0)
  if (Math.random() < 0.3) bell(ctx, out, notes[Math.floor(Math.random() * notes.length)], 0.35)
  score.timer = setTimeout(ring, (gap[0] + Math.random() * (gap[1] - gap[0])) * 1000)
}

const start = () => {
  const ctx = audioContext()
  if (!ctx || score) return
  const out = ctx.createGain()
  out.gain.setValueAtTime(0.0001, ctx.currentTime)
  out.gain.exponentialRampToValueAtTime(moods[mood].level, ctx.currentTime + 2)
  out.connect(ctx.destination)
  score = { ctx, out, voices: [...sea(ctx, out)], drones: drones(ctx, out), timer: null }
  ring()
}

const stop = () => {
  if (!score) return
  const { ctx, out, voices, drones: held, timer } = score
  score = null
  clearTimeout(timer)
  out.gain.cancelScheduledValues(ctx.currentTime)
  out.gain.setValueAtTime(out.gain.value, ctx.currentTime)
  out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8)
  for (const node of [...voices, ...held]) node.stop(ctx.currentTime + 0.9)
}

export const syncMusic = () => (settings().music ? start() : stop())

export const setMood = next => {
  if (next === mood || !moods[next]) return
  mood = next
  if (!score) return
  const { ctx, out, drones: held } = score
  for (const [i, osc] of held.entries())
    osc.frequency.linearRampToValueAtTime(moods[mood].drone[i], ctx.currentTime + 1.5)
  out.gain.linearRampToValueAtTime(moods[mood].level, ctx.currentTime + 1.5)
}

export const isPlaying = () => Boolean(score)
