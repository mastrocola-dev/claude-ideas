import { settings } from './settings.js'
import { audioContext } from './sound.js'

const moods = {
  calm: { drone: [55, 82.41], notes: [220, 261.63, 329.63, 392, 440, 523.25], gap: [2.2, 3.6], run: 3, level: 0.45 },
  fight: { drone: [55, 58.27], notes: [110, 130.81, 146.83, 164.81, 196, 220], gap: [0.9, 1.5], run: 4, level: 0.55 },
}

let score = null
let mood = 'calm'

const pluck = (ctx, out, frequency, delay) => {
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = frequency
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(frequency * 6, start)
  filter.frequency.exponentialRampToValueAtTime(frequency * 1.2, start + 0.5)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(0.05, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9)
  osc.connect(filter).connect(gain).connect(out)
  osc.start(start)
  osc.stop(start + 1)
}

const hum = (ctx, out) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const level = ctx.createGain()
  const pulse = ctx.createOscillator()
  const depth = ctx.createGain()
  source.buffer = buffer
  source.loop = true
  filter.type = 'lowpass'
  filter.frequency.value = 180
  level.gain.value = 0.04
  pulse.frequency.value = 0.07
  depth.gain.value = 0.025
  pulse.connect(depth).connect(level.gain)
  source.connect(filter).connect(level).connect(out)
  source.start()
  pulse.start()
  return [source, pulse]
}

const drones = (ctx, out) => {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 320
  filter.connect(out)
  return moods[mood].drone.map(frequency => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.value = frequency
    gain.gain.value = 0.035
    osc.connect(gain).connect(filter)
    osc.start()
    return osc
  })
}

const ring = () => {
  if (!score) return
  const { ctx, out } = score
  const { notes, gap, run } = moods[mood]
  const root = Math.floor(Math.random() * (notes.length - run + 1))
  for (let step = 0; step < run; step++) pluck(ctx, out, notes[root + step], step * 0.16)
  score.timer = setTimeout(ring, (gap[0] + Math.random() * (gap[1] - gap[0])) * 1000)
}

const start = () => {
  const ctx = audioContext()
  if (!ctx || score) return
  const out = ctx.createGain()
  out.gain.setValueAtTime(0.0001, ctx.currentTime)
  out.gain.exponentialRampToValueAtTime(moods[mood].level, ctx.currentTime + 2)
  out.connect(ctx.destination)
  score = { ctx, out, voices: [...hum(ctx, out)], drones: drones(ctx, out), timer: null }
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
