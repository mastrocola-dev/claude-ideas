export const inks = {
  plasma: { name: 'Plasma', color: '#38e1ff', does: 'damage', mark: '●' },
  thermal: { name: 'Thermal', color: '#ff7a2f', does: 'damage and heat', mark: '▲' },
  shield: { name: 'Shield', color: '#b6ff4d', does: 'shielding', mark: '■' },
  glitch: { name: 'Glitch', color: '#c9c3d6', does: 'nothing', mark: '✕' },
}

export const writable = ['plasma', 'thermal', 'shield']

export const startingBag = [
  ...Array(8).fill(['plasma', 1]),
  ...Array(2).fill(['plasma', 2]),
  ...Array(6).fill(['thermal', 1]),
  ...Array(8).fill(['shield', 1]),
  ...Array(2).fill(['shield', 2]),
]

export const scribes = {
  rep7: {
    name: 'REP-7',
    text: 'A standard repair drone, balanced across all three charges.',
    bag: startingBag,
    marks: [],
  },
  torch: {
    name: 'Torch Unit',
    text: 'A welding chassis: a cell bank tilted to Thermal, and starts with Afterburner.',
    bag: [
      ...Array(6).fill(['plasma', 1]),
      ...Array(12).fill(['thermal', 1]),
      ...Array(2).fill(['thermal', 2]),
      ...Array(6).fill(['shield', 1]),
    ],
    marks: ['afterburner'],
  },
}

export const unlockCosts = { noiseAmp: 15, deepCache: 15, meltdown: 30, leanBuild: 30, torch: 40 }

export const enemies = {
  crawler: {
    name: 'Scrap Crawler',
    hp: 105,
    intents: [
      ['attack', 20],
      ['attack', 16],
      ['ward', 16],
    ],
  },
  hound: {
    name: 'Rivet Hound',
    hp: 80,
    intents: [
      ['attack', 14],
      ['attack', 14],
      ['attack', 26],
    ],
  },
  wisp: {
    name: 'Static Wisp',
    hp: 112,
    intents: [
      ['glitch', 3],
      ['attack', 23],
    ],
  },
  eel: {
    name: 'Cable Eel',
    hp: 126,
    intents: [
      ['boost', 4],
      ['attack', 15],
      ['attack', 15],
    ],
  },
  loader: {
    name: 'Loader Mk II',
    hp: 192,
    intents: [
      ['glitch', 4],
      ['attack', 29],
      ['ward', 23],
      ['attack', 37],
    ],
  },
  overseer: {
    name: 'The Dock Overseer',
    hp: 175,
    intents: [
      ['attack', 20],
      ['glitch', 5],
      ['boost', 4],
      ['attack', 29],
      ['ward', 32],
    ],
  },
  crab: {
    name: 'Coolant Crab',
    hp: 154,
    intents: [
      ['attack', 26],
      ['drain', 2],
      ['attack', 32],
    ],
  },
  diver: {
    name: 'Pressure Diver',
    hp: 174,
    intents: [
      ['reroute', 1],
      ['attack', 36],
      ['ward', 26],
    ],
  },
  golem: {
    name: 'The Slag Golem',
    hp: 288,
    intents: [
      ['drain', 3],
      ['attack', 41],
      ['glitch', 3],
      ['attack', 47],
    ],
  },
  heart: {
    name: 'The Reactor Heart',
    hp: 350,
    intents: [
      ['reroute', 1],
      ['attack', 40],
      ['drain', 3],
      ['boost', 5],
      ['attack', 48],
    ],
  },
  moth: {
    name: 'Signal Moth',
    hp: 211,
    intents: [
      ['drain', 3],
      ['attack', 49],
      ['attack', 49],
    ],
  },
  shade: {
    name: 'Firewall Shade',
    hp: 241,
    intents: [
      ['ward', 34],
      ['reroute', 1],
      ['attack', 64],
    ],
  },
  sentinel: {
    name: 'The Sentinel',
    hp: 385,
    intents: [
      ['boost', 5],
      ['attack', 55],
      ['glitch', 4],
      ['attack', 69],
    ],
  },
  lumen: {
    name: 'LUMEN',
    hp: 525,
    intents: [
      ['glitch', 5],
      ['attack', 68],
      ['reroute', 1],
      ['drain', 4],
      ['attack', 87],
      ['ward', 52],
    ],
  },
}

export const acts = [
  {
    name: 'The Hangar',
    bossLabel: 'Overseer',
    pools: { fight: ['crawler', 'hound', 'wisp', 'eel'], elite: ['loader'], boss: ['overseer'] },
  },
  {
    name: 'The Reactor',
    bossLabel: 'Heart',
    pools: { fight: ['crab', 'diver'], elite: ['golem'], boss: ['heart'] },
  },
  {
    name: 'The Core',
    bossLabel: 'LUMEN',
    pools: { fight: ['moth', 'shade'], elite: ['sentinel'], boss: ['lumen'] },
  },
]

export const rarityWeights = [
  ['common', 60],
  ['uncommon', 30],
  ['rare', 10],
]

export const marginalia = {
  plasmaLens: {
    name: 'Plasma Lens',
    rarity: 'common',
    text: 'Plasma links gain +2 mult.',
    glyph: g => ({ mult: g.ink === 'plasma' ? 2 : 0 }),
  },
  shieldCapacitor: {
    name: 'Shield Capacitor',
    rarity: 'common',
    text: 'Shield links gain +2 mult.',
    glyph: g => ({ mult: g.ink === 'shield' ? 2 : 0 }),
  },
  salvageClaw: { name: 'Salvage Claw', rarity: 'common', text: 'Gain 10 more scrap after each fight.' },
  thermalCoil: {
    name: 'Thermal Coil',
    rarity: 'common',
    text: 'Thermal links gain +1 mult.',
    glyph: g => ({ mult: g.ink === 'thermal' ? 1 : 0 }),
  },
  shortCircuit: {
    name: 'Short Circuit',
    rarity: 'common',
    text: 'Links of exactly 3 cells gain +2 mult.',
    glyph: g => ({ mult: g.length === 3 ? 2 : 0 }),
  },
  glitchRecycler: { name: 'Glitch Recycler', rarity: 'common', text: 'Each Glitch that clears grants 3 shield.' },
  wideBus: {
    name: 'Wide Bus',
    rarity: 'uncommon',
    text: 'Links of 6 or more cells gain +2 mult.',
    glyph: g => ({ mult: g.length >= 6 ? 2 : 0 }),
  },
  afterburner: {
    name: 'Afterburner',
    rarity: 'uncommon',
    text: 'Each Thermal cell in a link adds 1 more heat.',
    glyph: g => ({ burn: g.count.thermal }),
  },
  batteryBank: { name: 'Battery Bank', rarity: 'uncommon', text: 'Shield is kept between turns.' },
  glitchRouter: {
    name: 'Glitch Router',
    rarity: 'uncommon',
    text: 'Glitches can be linked and join any charge. Each is worth 1.',
  },
  spikedShield: { name: 'Spiked Shield', rarity: 'uncommon', text: 'Shield cells deal damage as well as shielding.' },
  noiseAmp: {
    name: 'Noise Amplifier',
    rarity: 'uncommon',
    text: 'Each Glitch in a link adds +1 mult.',
    glyph: g => ({ mult: g.count.glitch }),
  },
  deepCache: {
    name: 'Deep Cache',
    rarity: 'uncommon',
    text: 'Links gain +1 mult for every 15 cells in your bank.',
    glyph: g => ({ mult: Math.floor(g.bagSize / 15) }),
  },
  thirdArm: { name: 'Third Arm', rarity: 'rare', text: 'Make 3 links each turn instead of 2.' },
  overclock: { name: 'Overclock', rarity: 'rare', text: 'Heat deals double damage.' },
  meltdown: { name: 'Meltdown', rarity: 'rare', text: 'Heat no longer cools each turn.' },
  leanBuild: {
    name: 'Lean Build',
    rarity: 'rare',
    text: 'Links gain +3 mult while your bank holds 18 cells or fewer.',
    glyph: g => ({ mult: g.bagSize <= 18 ? 3 : 0 }),
  },
}

export const shrines = {
  log: {
    name: 'The Corrupted Log',
    text: 'A maintenance terminal still blinks. Its last log is half overwritten by LUMEN.',
    options: ['Read it: lose 8 integrity, gain a module', 'Leave it dark'],
  },
  echo: {
    name: 'The Echo Chamber',
    text: 'A test chamber that repeats any signal fed into it, a little louder each time.',
    options: ['Feed it two cells: upgrade two random cells', 'Move on'],
  },
  broker: {
    name: 'The Scrap Broker',
    text: 'A vending unit that still trades. It wants a piece of your chassis.',
    options: ['Trade: gain 40 scrap, lose 5 max integrity', 'Decline'],
  },
  leech: {
    name: 'The Power Leech',
    text: 'A parasite unit clings to a conduit. It wakes when it senses your cells.',
    options: ['Feed it: lose your 2 weakest cells, gain 10 max integrity', 'Cut the conduit'],
  },
  alarm: {
    name: 'The Alarm Panel',
    text: 'A red panel hums behind cracked glass. Every machine on the deck listens to it.',
    options: [
      'Trip it: raise a random cell by two, lose 12 integrity',
      'Mute it: gain 25 scrap, lose a random cell',
      'Leave it',
    ],
  },
  derelict: {
    name: 'The Derelict Drone',
    text: 'A drone like you, frozen mid-repair. Its map and toolkit are still warm.',
    options: [
      'Load its map: lose 6 integrity, your next step may be any node ahead',
      'Strip its toolkit: lose 10 integrity, gain a cell worth 3',
      'Power it down',
    ],
  },
  oracle: {
    name: 'The Last Terminal',
    text: 'A terminal LUMEN never reached. It asks for code, and it does not ask twice.',
    options: [
      'Give it a module: lose a random one, repair fully and gain 10 max integrity',
      'Give it your own code: lose 12 max integrity, gain a rare module',
      'Disconnect',
    ],
  },
}

export const firstFightHints = [
  'Swipe across three or more touching cells of the same charge, in any of eight directions.',
  'Every cell past the second adds +1 mult. Plasma damages, Thermal damages and heats, Shield protects.',
  'You make two links a turn, then the machine acts on the intent shown above.',
]

export const glyphTiers = [
  ['One charge per link', 'Only cells of the same charge connect; Glitches join any charge with Glitch Router'],
  ['Mult', 'Cells in the link minus 2: three cells × 1, six cells × 4'],
  ['Names', 'An Arc up to 4 cells, a Surge up to 6, an Overload from 7'],
  ['No link left', 'The grid reboots itself, so a link is always there'],
]

export const intentGuide = [
  ['Strikes', 'Damages you. Shield absorbs it first.'],
  ['Shields', 'Absorbs your next damage until its turn.'],
  ['Glitches', 'Corrupts cells into Glitches, which clear after three turns.'],
  ['Boosts', 'Every later strike hits harder.'],
  ['Drains', 'Lowers cells on the grid by one.'],
  ['Reroutes', 'Shifts a column of the grid down.'],
]
