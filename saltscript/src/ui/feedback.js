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
  ward: ({ foe }, { value }) => float(foe, `+${value} ward`, 'ward'),
  rise: ({ foe }, { value }) => float(foe, `+${value} swell`, 'wound'),
  salt: ({ foe }, { value }) => float(foe, `${value} salted`, 'salt'),
  burn: ({ foe }, { value }) => {
    float(foe, `−${value} burn`, 'burn')
    shake(foe)
  },
  attack: ({ you, before, after }, { value }) => {
    const lost = before.hp - after.hp
    if (lost) {
      float(you, `−${lost} health`, 'wound')
      shake(you)
    }
    if (value > lost) float(you, `${value - lost} warded`, 'ward')
  },
  glyph: ({ foe, you, before, after }, { glyph }) => {
    const lost = before.enemy.hp - after.enemy.hp
    const blocked = glyph.damage - lost
    flourish(glyph.name)
    if (lost) {
      float(foe, `−${lost} wound`, 'wound')
      shake(foe)
    }
    if (blocked > 0 && after.enemy.hp > 0) float(foe, `${blocked} warded`, 'ward')
    if (glyph.burn) float(foe, `+${glyph.burn} burn`, 'burn')
    if (glyph.ward) float(you, `+${glyph.ward} ward`, 'ward')
  },
}

export const announce = (before, after) => {
  const stage = { foe: document.getElementById('foe'), you: document.getElementById('you'), before, after }
  for (const event of after.events) reactions[event.kind](stage, event)
}
