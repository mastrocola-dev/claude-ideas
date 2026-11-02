const key = 'saltscript.run'

export const loadRun = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    return saved && { trail: [], ...saved }
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
