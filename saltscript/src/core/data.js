export const inks = {
  brine: { name: 'Brine', color: '#4fa8c9', does: 'damage', mark: '≈' },
  ember: { name: 'Ember', color: '#e8793f', does: 'damage and burn', mark: '▲' },
  moss: { name: 'Moss', color: '#93b85c', does: 'ward', mark: '◆' },
  salt: { name: 'Salt', color: '#d9d3c4', does: 'nothing', mark: '✕' },
}

export const writable = ['brine', 'ember', 'moss']

export const startingBag = [
  ...Array(8).fill(['brine', 1]),
  ...Array(2).fill(['brine', 2]),
  ...Array(6).fill(['ember', 1]),
  ...Array(8).fill(['moss', 1]),
  ...Array(2).fill(['moss', 2]),
]

export const scribes = {
  lastScribe: {
    name: 'The Last Scribe',
    text: 'An even hand across all three inks.',
    bag: startingBag,
    marks: [],
  },
  emberNovice: {
    name: 'The Ember Novice',
    text: 'A bag tilted to Ember, and starts with Ember Psalm.',
    bag: [
      ...Array(6).fill(['brine', 1]),
      ...Array(12).fill(['ember', 1]),
      ...Array(2).fill(['ember', 2]),
      ...Array(6).fill(['moss', 1]),
    ],
    marks: ['emberPsalm'],
  },
}

export const unlockCosts = { saltedTongue: 15, fullInkwell: 15, undyingEmber: 30, leanHand: 30, emberNovice: 40 }

export const enemies = {
  acolyte: {
    name: 'Drowned Acolyte',
    hp: 105,
    intents: [
      ['attack', 17],
      ['attack', 14],
      ['ward', 16],
    ],
  },
  hound: {
    name: 'Brine Hound',
    hp: 80,
    intents: [
      ['attack', 12],
      ['attack', 12],
      ['attack', 23],
    ],
  },
  wraith: {
    name: 'Salt Wraith',
    hp: 112,
    intents: [
      ['salt', 3],
      ['attack', 20],
    ],
  },
  eel: {
    name: 'Lantern Eel',
    hp: 126,
    intents: [
      ['rise', 4],
      ['attack', 13],
      ['attack', 13],
    ],
  },
  choirmother: {
    name: 'The Choirmother',
    hp: 192,
    intents: [
      ['salt', 4],
      ['attack', 26],
      ['ward', 23],
      ['attack', 34],
    ],
  },
  tide: {
    name: 'The Unwriting Tide',
    hp: 219,
    intents: [
      ['attack', 23],
      ['salt', 5],
      ['rise', 4],
      ['attack', 34],
      ['ward', 32],
    ],
  },
  pewCrab: {
    name: 'Pew Crab',
    hp: 140,
    intents: [
      ['attack', 21],
      ['smudge', 2],
      ['attack', 26],
    ],
  },
  bellDiver: {
    name: 'Bell Diver',
    hp: 158,
    intents: [
      ['undertow', 1],
      ['attack', 29],
      ['ward', 26],
    ],
  },
  abbot: {
    name: 'The Blotted Abbot',
    hp: 262,
    intents: [
      ['smudge', 3],
      ['attack', 34],
      ['salt', 3],
      ['attack', 39],
    ],
  },
  organ: {
    name: 'The Drowned Organ',
    hp: 368,
    intents: [
      ['undertow', 1],
      ['attack', 36],
      ['smudge', 3],
      ['rise', 5],
      ['attack', 44],
    ],
  },
  wickMoth: {
    name: 'Wick Moth',
    hp: 192,
    intents: [
      ['smudge', 3],
      ['attack', 34],
      ['attack', 34],
    ],
  },
  lensShade: {
    name: 'Lens Shade',
    hp: 219,
    intents: [
      ['ward', 34],
      ['undertow', 1],
      ['attack', 44],
    ],
  },
  warden: {
    name: 'The Lens Warden',
    hp: 350,
    intents: [
      ['rise', 5],
      ['attack', 39],
      ['salt', 4],
      ['attack', 49],
    ],
  },
  keeper: {
    name: 'The Unlit Keeper',
    hp: 525,
    intents: [
      ['salt', 5],
      ['attack', 47],
      ['undertow', 1],
      ['smudge', 4],
      ['attack', 60],
      ['ward', 52],
    ],
  },
}

export const acts = [
  {
    name: 'The Coast Road',
    bossLabel: 'The Tide',
    pools: { fight: ['acolyte', 'hound', 'wraith', 'eel'], elite: ['choirmother'], boss: ['tide'] },
  },
  {
    name: 'The Sunken Nave',
    bossLabel: 'The Organ',
    pools: { fight: ['pewCrab', 'bellDiver'], elite: ['abbot'], boss: ['organ'] },
  },
  {
    name: 'The Lighthouse',
    bossLabel: 'The Keeper',
    pools: { fight: ['wickMoth', 'lensShade'], elite: ['warden'], boss: ['keeper'] },
  },
]

export const rarityWeights = [
  ['common', 60],
  ['uncommon', 30],
  ['rare', 10],
]

export const marginalia = {
  tidalGloss: {
    name: 'Tidal Gloss',
    rarity: 'common',
    text: 'Brine strokes gain +2 mult.',
    glyph: g => ({ mult: g.ink === 'brine' ? 2 : 0 }),
  },
  vespers: {
    name: 'Vespers',
    rarity: 'common',
    text: 'Moss strokes gain +2 mult.',
    glyph: g => ({ mult: g.ink === 'moss' ? 2 : 0 }),
  },
  gildedEdge: { name: 'Gilded Edge', rarity: 'common', text: 'Gain 10 more gold after each fight.' },
  cinderChant: {
    name: 'Cinder Chant',
    rarity: 'common',
    text: 'Ember strokes gain +1 mult.',
    glyph: g => ({ mult: g.ink === 'ember' ? 1 : 0 }),
  },
  shortHand: {
    name: 'Short Hand',
    rarity: 'common',
    text: 'Strokes of exactly 3 runes gain +2 mult.',
    glyph: g => ({ mult: g.length === 3 ? 2 : 0 }),
  },
  saltHarvest: { name: 'Salt Harvest', rarity: 'common', text: 'Each Salt rune that crumbles grants 3 ward.' },
  longHand: {
    name: 'Long Hand',
    rarity: 'uncommon',
    text: 'Strokes of 6 or more runes gain +2 mult.',
    glyph: g => ({ mult: g.length >= 6 ? 2 : 0 }),
  },
  emberPsalm: {
    name: 'Ember Psalm',
    rarity: 'uncommon',
    text: 'Each Ember rune in a stroke adds 1 more burn.',
    glyph: g => ({ burn: g.count.ember }),
  },
  mossRubric: { name: 'Moss Rubric', rarity: 'uncommon', text: 'Ward is kept between turns.' },
  saltwise: {
    name: 'Saltwise',
    rarity: 'uncommon',
    text: 'Salt can be written through and joins any ink. It is worth 1.',
  },
  mossEdge: { name: 'Moss Edge', rarity: 'uncommon', text: 'Moss runes wound as well as ward.' },
  saltedTongue: {
    name: 'Salted Tongue',
    rarity: 'uncommon',
    text: 'Each Salt rune written in a stroke adds +1 mult.',
    glyph: g => ({ mult: g.count.salt }),
  },
  fullInkwell: {
    name: 'Full Inkwell',
    rarity: 'uncommon',
    text: 'Strokes gain +1 mult for every 15 runes in your inkwell.',
    glyph: g => ({ mult: Math.floor(g.bagSize / 15) }),
  },
  thirdHand: { name: 'Third Hand', rarity: 'rare', text: 'Write 3 strokes each turn instead of 2.' },
  lampOil: { name: 'Lamp Oil', rarity: 'rare', text: 'Burn deals double damage.' },
  undyingEmber: { name: 'Undying Ember', rarity: 'rare', text: 'Burn no longer fades each turn.' },
  leanHand: {
    name: 'Lean Hand',
    rarity: 'rare',
    text: 'Strokes gain +3 mult while your inkwell holds 18 runes or fewer.',
    glyph: g => ({ mult: g.bagSize <= 18 ? 3 : 0 }),
  },
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
  inkLeech: {
    name: 'The Ink Leech',
    text: 'A fat leech sleeps in a bowl of black ink. It wakes when it smells yours.',
    options: ['Feed it: lose your 2 weakest runes, gain 10 max health', 'Cover the bowl'],
  },
  tideBell: {
    name: 'The Tide Bell',
    text: 'A green bell hangs from a drowned post. The sea listens when it rings.',
    options: [
      'Ring it: raise a random rune by two, lose 12 health',
      'Muffle it: gain 25 gold, lose a random rune',
      'Let it hang',
    ],
  },
  mapmaker: {
    name: "The Mapmaker's Corpse",
    text: 'He died mid-stride, chart in one hand, satchel in the other. The ink is still wet.',
    options: [
      'Follow his chart: lose 6 health, your next step may be any node ahead',
      'Rifle the satchel: lose 10 health, gain a rune worth III',
      'Close his eyes',
    ],
  },
  lamp: {
    name: 'The Lamp That Asks',
    text: 'A small lamp burns without oil. It asks for a name, and it does not ask twice.',
    options: [
      'Give it a marginalia: lose a random one, heal fully and gain 10 max health',
      'Give it your own: lose 12 max health, gain a rare marginalia',
      'Say nothing',
    ],
  },
}

export const firstFightHints = [
  'Swipe across three or more touching runes of the same ink, in any of eight directions.',
  'Every rune past the second adds +1 mult. Brine wounds, Ember wounds and burns, Moss wards.',
  'You write two strokes a turn, then the foe acts on the intent shown above.',
]

export const glyphTiers = [
  ['One ink per stroke', 'Only runes of the same ink link; Salt joins any ink with Saltwise'],
  ['Mult', 'Runes in the stroke minus 2: three runes × 1, six runes × 4'],
  ['Names', 'A Seal up to 4 runes, a Litany up to 6, a Canticle from 7'],
  ['No stroke left', 'The page rewrites itself, so a stroke is always there'],
]

export const intentGuide = [
  ['Strikes', 'Wounds you. Ward absorbs it first.'],
  ['Wards', 'Absorbs your next wounds until its turn.'],
  ['Salts', 'Turns runes to Salt, which crumbles after three turns.'],
  ['Swells', 'Every later strike hits harder.'],
  ['Smudges', 'Lowers runes on the page by one.'],
  ['Drags', 'Shifts a column of the page down.'],
]
