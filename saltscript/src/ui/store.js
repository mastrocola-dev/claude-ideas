import { createMeta } from '../core/meta.js'

const key = 'saltscript.run'

export const loadRun = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return saved && { trail: [], actIndex: 0, locked: [], ...saved }
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

const muteKey = 'saltscript.muted'

export const loadMuted = () => {
  try {
    return localStorage.getItem(muteKey) === 'true'
  } catch {
    return false
  }
}

export const saveMuted = muted => {
  try {
    localStorage.setItem(muteKey, String(muted))
  } catch {}
  return muted
}

const metaKey = 'saltscript.meta'

export const loadMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(metaKey)) ?? createMeta()
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
