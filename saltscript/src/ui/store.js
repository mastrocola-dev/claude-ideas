const key = 'saltscript.run'

export const loadRun = () => {
  try {
    return JSON.parse(localStorage.getItem(key))
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
