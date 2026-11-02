const key = 'relink.settings'
const languages = ['en', 'pt']

const preferredLanguage = () => (globalThis.navigator?.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en')

const defaults = () => ({ sound: true, music: true, language: preferredLanguage() })

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(key))
    if (saved) return { ...defaults(), ...saved }
    return { ...defaults(), sound: localStorage.getItem('relink.muted') !== 'true' }
  } catch {
    return defaults()
  }
}

let current = read()
const listeners = new Set()

export const settings = () => current

export const updateSettings = change => {
  const language = languages.includes(change.language) ? change.language : current.language
  current = { ...current, ...change, language }
  try {
    localStorage.setItem(key, JSON.stringify(current))
  } catch {}
  for (const listener of listeners) listener(current)
  return current
}

export const onSettings = listener => listeners.add(listener)
