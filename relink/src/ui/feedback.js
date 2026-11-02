import { inks } from '../core/data.js'
import { glyphName, t } from './i18n.js'
import { defeat, playEvent, victory } from './sound.js'

const heavyShare = 0.2

const restart = (node, name) => {
  node.classList.remove(name)
  void node.offsetWidth
  node.classList.add(name)
}

const float = (host, { value = '', tag, tone, weight = 0 }) => {
  const layer = host.querySelector('.floats')
  const mark = document.createElement('span')
  mark.className = `float ${tone}`
  mark.style.setProperty('--weight', Math.min(1, weight).toFixed(2))
  mark.style.setProperty('--slot', layer.children.length % 3)
  mark.append(Object.assign(document.createElement('b'), { textContent: value }))
  mark.append(Object.assign(document.createElement('small'), { textContent: tag }))
  mark.onanimationend = () => mark.remove()
  layer.append(mark)
}

const banner = glyph => {
  const node = document.getElementById('banner')
  node.style.setProperty('--glow', inks[glyph.ink]?.color ?? '#ffffff')
  node.replaceChildren(
    Object.assign(document.createElement('strong'), { textContent: glyphName(glyph) }),
    Object.assign(document.createElement('span'), { textContent: `×${glyph.mult}` }),
  )
  restart(node, 'show')
}

const flash = color => {
  const node = document.getElementById('impact')
  node.style.setProperty('--flash', color)
  restart(node, 'flash')
}

const reactions = {
  ward: ({ foe }, { value }) => float(foe, { value: `+${value}`, tag: t('tagShield'), tone: 'ward' }),
  boost: ({ foe }, { value }) => float(foe, { value: `+${value}`, tag: t('tagBoost'), tone: 'wound' }),
  glitch: ({ foe }, { value }) => float(foe, { value, tag: t('tagGlitched'), tone: 'glitch' }),
  drain: ({ foe }, { value }) => float(foe, { value, tag: t('tagDrained'), tone: 'glitch' }),
  reroute: ({ foe }) => float(foe, { tag: t('rerouteFloat'), tone: 'glitch' }),
  rewrite: ({ you }) => float(you, { tag: t('rewriteFloat'), tone: 'ward' }),
  burn: ({ foe, after }, { value }) => {
    float(foe, { value: `−${value}`, tag: t('tagHeat'), tone: 'burn', weight: value / 30 })
    restart(foe, 'hit')
    if (value >= after.enemy.maxHp * heavyShare) flash(inks.thermal.color)
  },
  attack: ({ you, before, after }, { value }) => {
    const lost = before.hp - after.hp
    if (lost) {
      float(you, { value: `−${lost}`, tag: t('tagIntegrity'), tone: 'wound', weight: lost / 25 })
      restart(you, 'hit')
      if (lost >= after.maxHp * heavyShare) flash('#ff4d5e')
    }
    if (value > lost) float(you, { value: value - lost, tag: t('tagBlocked'), tone: 'ward' })
  },
  glyph: ({ foe, you, before, after }, { glyph }) => {
    const lost = before.enemy.hp - after.enemy.hp
    const blocked = glyph.damage - lost
    banner(glyph)
    if (lost) {
      float(foe, { value: `−${lost}`, tag: t('tagDamage'), tone: 'wound', weight: lost / 60 })
      restart(foe, 'hit')
      if (lost >= after.enemy.maxHp * heavyShare) flash(inks[glyph.ink].color)
    }
    if (blocked > 0 && after.enemy.hp > 0) float(foe, { value: blocked, tag: t('tagBlocked'), tone: 'ward' })
    if (glyph.burn) float(foe, { value: `+${glyph.burn}`, tag: t('tagHeat'), tone: 'burn' })
    if (glyph.ward) float(you, { value: `+${glyph.ward}`, tag: t('tagShield'), tone: 'ward', weight: glyph.ward / 40 })
  },
}

export const announce = (before, after) => {
  const stage = { foe: document.getElementById('foe'), you: document.getElementById('you'), before, after }
  for (const event of after.events) {
    reactions[event.kind](stage, event)
    playEvent(event)
  }
  if (after.status === 'won') victory()
  if (after.status === 'lost') defeat()
}
