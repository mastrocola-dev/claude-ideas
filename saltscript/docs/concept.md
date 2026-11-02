# Saltscript — concept

Updated 2026-11-02. One-line pitch: **a roguelike where every attack is a word you swipe in ink.**

## Why this game

Market read (November 2026):

- Roguelikes are the growing corner of mobile RPG: AppMagic data shows RPG in-app revenue down 15.4% in 2025 while roguelikes inside it grew 26.2%
- Balatro-style scoring (chips × mult with stacking modifiers) is spreading to other formats, such as word puzzles and slot machines
- The mobile deckbuilders players praise are pausable, short-session and sold once; energy timers and gacha are named as the red flags
- No new 2026 release has reached the top-grossing chart, so a premium niche hit is a more realistic target than a free-to-play giant

Saltscript joins three proven pleasures into one gesture: the swipe-a-path input of word games, the bag-building of deckbuilders and Balatro's number climb. Reaching the boss takes about 15 minutes.

## World

A coast where names hold the land together. Each night the Unwriting Tide rises and erases them: villages, cliffs, the drowned scriptorium. You are the last scribe of the lighthouse, walking the Coast Road with an inkwell of runes cut from three inks:

| Ink   | Colour       | Does                                                            |
| ----- | ------------ | --------------------------------------------------------------- |
| Brine | sea blue     | wounds                                                          |
| Ember | lamp orange  | wounds and sets burning                                         |
| Moss  | lichen green | wards                                                           |
| Salt  | bone white   | left by the Tide; clogs the page and crumbles after three turns |

Enemies are things the sea has half erased: the Drowned Acolyte, the Brine Hound, the Salt Wraith, the Lantern Eel, the Choirmother, and the Unwriting Tide itself. Marginalia are notes scribbled in old margins that bend the rules, the role jokers play in Balatro.

## Core loop

```
Coast Road map (branching floors) ──► node: fight · elite · shrine · market · rest · boss
                                              │
fight: 4×5 page of runes drawn from your inkwell (the bag)
  swipe 3+ touching runes of one ink (8 directions) ──► glyph
  glyph = chips × mult
    chips: rune values   mult: runes − 2 (Seal up to 4, Litany up to 6, Canticle from 7)
    Brine → wound · Ember → wound and 1 burn per rune · Moss → ward
  a page with no stroke left rewrites itself, so a fight never locks
  2 strokes per turn, then the foe acts on its shown intent (strike, ward, salt, swell)
  used runes go to the discard; the page refills from the bag, which reshuffles when empty
                                              │
reward: gold + pick 1 of 3 runes (elites also offer marginalia) ──► next floor
```

The tension: every stroke is a choice between wounding and warding, and long strokes only exist where an ink happened to pool. Every rune added to the bag changes what the page can show you.

Revised 2026-11-02: strokes used to mix inks, which let a single zigzag through all twenty runes win every run. One ink per stroke closes that and makes the rule fit in one sentence.

## What makes it sticky

- One gesture, readable in seconds; the preview shows the exact sum while you swipe
- Each run is a new seed, map, foe line-up and bag; a daily shared Tide comes later
- Marginalia combos create the "broken build" moments roguelikes are loved for
- Runs save after every action and can be resumed from the title

## Monetization (later stage)

Premium one-time purchase or a free first act with a single unlock. No energy, no ads during runs. Cosmetic inks and scribes come later.

## Platform for the prototype

Mobile web (PWA), portrait, plain JavaScript without a build, deterministic core shared by game, tests and bot.
