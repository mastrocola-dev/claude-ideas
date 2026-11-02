import { unlockCosts } from './data.js'
import { floors } from './run.js'

const bossLamplight = 10

export const createMeta = () => ({ lamplight: 0, unlocked: [], scribe: 'lastScribe', banked: null })

export const lamplightEarned = run => {
  const won = run.screen === 'victory' ? 1 : 0
  return run.actIndex * floors + run.floor + won + (run.actIndex + won) * bossLamplight
}

export const bank = (meta, run) => {
  if (meta.banked === run.origin || !['victory', 'defeat'].includes(run.screen)) return meta
  return { ...meta, lamplight: meta.lamplight + lamplightEarned(run), banked: run.origin }
}

export const spend = (meta, key) => {
  const cost = unlockCosts[key]
  if (cost === undefined || meta.unlocked.includes(key) || meta.lamplight < cost) return meta
  return { ...meta, lamplight: meta.lamplight - cost, unlocked: [...meta.unlocked, key] }
}

export const chooseScribe = (meta, key) =>
  key === 'lastScribe' || meta.unlocked.includes(key) ? { ...meta, scribe: key } : meta

export const runOptions = meta => ({ scribe: meta.scribe, unlocked: meta.unlocked })
