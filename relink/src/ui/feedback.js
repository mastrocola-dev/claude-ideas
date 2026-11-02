import { glyphName, t } from './i18n.js'
import { defeat, playEvent, victory } from './sound.js'

const float = (host, text, tone) => {
  const mark = document.createElement('span')
  mark.className = `float ${tone}`
  mark.textContent = text
  mark.onanimationend = () => mark.remove()
  host.querySelector('.floats').append(mark)
}

const shake = host => {
  host.classList.remove('hit')
  void host.offsetWidth
  host.classList.add('hit')
}

const flourish = name => {
  const title = document.createElement('strong')
  title.className = 'flourish'
  title.textContent = name
  document.getElementById('preview').replaceChildren(title)
}

const reactions = {
  ward: ({ foe }, { value }) => float(foe, t('plusWard', { n: value }), 'ward'),
  boost: ({ foe }, { value }) => float(foe, t('plusBoost', { n: value }), 'wound'),
  glitch: ({ foe }, { value }) => float(foe, t('glitched', { n: value }), 'glitch'),
  drain: ({ foe }, { value }) => float(foe, t('drained', { n: value }), 'glitch'),
  reroute: ({ foe }) => float(foe, t('rerouteFloat'), 'glitch'),
  rewrite: ({ you }) => float(you, t('rewriteFloat'), 'ward'),
  burn: ({ foe }, { value }) => {
    float(foe, t('minusBurn', { n: value }), 'burn')
    shake(foe)
  },
  attack: ({ you, before, after }, { value }) => {
    const lost = before.hp - after.hp
    if (lost) {
      float(you, t('minusHealth', { n: lost }), 'wound')
      shake(you)
    }
    if (value > lost) float(you, t('warded', { n: value - lost }), 'ward')
  },
  glyph: ({ foe, you, before, after }, { glyph }) => {
    const lost = before.enemy.hp - after.enemy.hp
    const blocked = glyph.damage - lost
    flourish(glyphName(glyph))
    if (lost) {
      float(foe, t('minusWound', { n: lost }), 'wound')
      shake(foe)
    }
    if (blocked > 0 && after.enemy.hp > 0) float(foe, t('warded', { n: blocked }), 'ward')
    if (glyph.burn) float(foe, t('plusBurn', { n: glyph.burn }), 'burn')
    if (glyph.ward) float(you, t('plusWard', { n: glyph.ward }), 'ward')
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
