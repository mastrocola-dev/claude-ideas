import {
  acts,
  enemies,
  firstFightHints,
  glyphTiers,
  inks,
  intentGuide,
  marginalia,
  scribes,
  shrines,
} from '../core/data.js'
import { en } from './locales/en.js'
import { pt } from './locales/pt.js'
import { settings } from './settings.js'

const locales = { en, pt }
const sources = { acts, enemies, inks, marginalia, scribes, shrines }
const english = { hints: firstFightHints, glyphTiers, intentGuide }

export const language = () => (locales[settings().language] ? settings().language : 'en')

const translated = () => locales[language()]

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))

export const t = (key, vars = {}) => fill(translated().ui[key] ?? en.ui[key] ?? key, vars)

export const local = (section, key) => ({ ...sources[section][key], ...translated()[section]?.[key] })

export const guide = section => translated()[section] ?? english[section]

export const glyphName = ({ ink, length }) =>
  t(length >= 7 ? 'canticleOf' : length >= 5 ? 'litanyOf' : 'sealOf', { ink: local('inks', ink ?? 'salt').name })

export const applyStatic = root => {
  root.documentElement.lang = language() === 'pt' ? 'pt-BR' : 'en'
  for (const node of root.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n)
  for (const node of root.querySelectorAll('[data-i18n-label]')) node.ariaLabel = t(node.dataset.i18nLabel)
}
