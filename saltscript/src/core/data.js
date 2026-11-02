export const inks = {
  brine: { name: 'Brine', color: '#4fa8c9', does: 'damage' },
  ember: { name: 'Ember', color: '#e8793f', does: 'damage and burn' },
  moss: { name: 'Moss', color: '#93b85c', does: 'ward' },
  salt: { name: 'Salt', color: '#d9d3c4', does: 'nothing' },
}

export const writable = ['brine', 'ember', 'moss']

export const startingBag = [
  ...Array(8).fill(['brine', 1]),
  ...Array(2).fill(['brine', 2]),
  ...Array(6).fill(['ember', 1]),
  ...Array(8).fill(['moss', 1]),
  ...Array(2).fill(['moss', 2]),
]

export const enemies = {
  acolyte: {
    name: 'Drowned Acolyte',
    hp: 60,
    intents: [
      ['attack', 13],
      ['attack', 11],
      ['ward', 12],
    ],
  },
  hound: {
    name: 'Brine Hound',
    hp: 46,
    intents: [
      ['attack', 9],
      ['attack', 9],
      ['attack', 18],
    ],
  },
  wraith: {
    name: 'Salt Wraith',
    hp: 64,
    intents: [
      ['salt', 3],
      ['attack', 15],
    ],
  },
  eel: {
    name: 'Lantern Eel',
    hp: 72,
    intents: [
      ['rise', 4],
      ['attack', 10],
      ['attack', 10],
    ],
  },
  choirmother: {
    name: 'The Choirmother',
    hp: 110,
    intents: [
      ['salt', 4],
      ['attack', 20],
      ['ward', 18],
      ['attack', 26],
    ],
  },
  tide: {
    name: 'The Unwriting Tide',
    hp: 125,
    intents: [
      ['attack', 18],
      ['salt', 5],
      ['rise', 4],
      ['attack', 26],
      ['ward', 25],
    ],
  },
}

export const pools = {
  fight: ['acolyte', 'hound', 'wraith', 'eel'],
  elite: ['choirmother'],
  boss: ['tide'],
}

export const marginalia = {
  tidalGloss: {
    name: 'Tidal Gloss',
    text: 'Seals and Litanies of Brine gain +2 mult.',
    glyph: g => ({ mult: g.ink === 'brine' ? 2 : 0 }),
  },
  longHand: {
    name: 'Long Hand',
    text: 'Strokes of 6 or more runes gain +2 mult.',
    glyph: g => ({ mult: g.length >= 6 ? 2 : 0 }),
  },
  emberPsalm: {
    name: 'Ember Psalm',
    text: 'Each Ember rune in a stroke adds 1 more burn.',
    glyph: g => ({ burn: g.count.ember }),
  },
  vespers: {
    name: 'Vespers',
    text: 'Mixed strokes gain +1 mult.',
    glyph: g => ({ mult: g.ink ? 0 : 1 }),
  },
  mossRubric: { name: 'Moss Rubric', text: 'Ward is kept between turns.' },
  thirdHand: { name: 'Third Hand', text: 'Write 3 strokes each turn instead of 2.' },
  lampOil: { name: 'Lamp Oil', text: 'Burn deals double damage.' },
  saltwise: { name: 'Saltwise', text: 'Salt can be written through. It is worth 1 and never breaks a Seal.' },
  gildedEdge: { name: 'Gilded Edge', text: 'Gain 10 more gold after each fight.' },
}

export const shrines = {
  lectern: {
    name: 'The Drowned Lectern',
    text: 'A book swells with seawater on a stone lectern. Its margins still glow.',
    options: ['Read it: lose 8 health, gain a marginalia', 'Leave it closed'],
  },
  tidepool: {
    name: 'Tidepool of Names',
    text: 'The pool repeats every word dropped into it, a little louder each time.',
    options: ['Drop two runes in: upgrade two random runes', 'Walk on'],
  },
  confessor: {
    name: 'The Salt Confessor',
    text: 'A hooded figure in a salt-crusted booth trades coin for secrets.',
    options: ['Confess: gain 40 gold, lose 5 max health', 'Keep silent'],
  },
}
