import { createMeta } from '../core/meta.js'

const key = 'relink.run'

export const loadRun = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return saved && { trail: [], actIndex: 0, locked: [], startSize: 26, ...saved, stats: { inks: [], ...saved.stats } }
  } catch {
    return null
  }
}

export const saveRun = run => {
  try {
    localStorage.setItem(key, JSON.stringify(run))
  } catch {}
  return run
}

const metaKey = 'relink.meta'

export const loadMeta = () => {
  try {
    return { ...createMeta(), ...JSON.parse(localStorage.getItem(metaKey)) }
  } catch {
    return createMeta()
  }
}

export const saveMeta = meta => {
  try {
    localStorage.setItem(metaKey, JSON.stringify(meta))
  } catch {}
  return meta
}
