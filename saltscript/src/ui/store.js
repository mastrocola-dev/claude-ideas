const key = 'saltscript.run'

export const loadRun = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return saved && { trail: [], actIndex: 0, ...saved }
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
