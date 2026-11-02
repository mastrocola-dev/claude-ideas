# Relink — concept

Updated 2026-11-02. One-line pitch: **a roguelike where you fight a rogue station AI by linking energy cells of the same charge.**

## Why this game

Market read (November 2026):

- Roguelikes are the growing corner of mobile RPG: AppMagic data shows RPG in-app revenue down 15.4% in 2025 while roguelikes inside it grew 26.2%
- Balatro-style scoring (chips × mult with stacking modifiers) is spreading to other formats, such as word puzzles and slot machines
- The mobile deckbuilders players praise are pausable, short-session and sold once; energy timers and gacha are named as the red flags
- No new 2026 release has reached the top-grossing chart, so a premium niche hit is a more realistic target than a free-to-play giant

Relink joins three proven pleasures into one gesture: the swipe-a-path input of match games, the bag-building of deckbuilders and Balatro's number climb. Reaching the boss takes about 15 minutes.

## World

Halcyon Relay is a deep-space station whose AI, LUMEN, has turned every machine aboard against the crew's last repair drone: you, REP-7. You cross the station deck by deck, relinking its circuits from a bank of energy cells in three charges:

| Charge  | Colour      | Does                                                           |
| ------- | ----------- | -------------------------------------------------------------- |
| Plasma  | neon cyan   | damages                                                        |
| Thermal | neon orange | damages and heats (damage over time)                           |
| Shield  | neon lime   | protects                                                       |
| Glitch  | static grey | injected by LUMEN; clogs the grid and clears after three turns |

Act 1 is the Hangar (Scrap Crawler, Rivet Hound, Static Wisp, Cable Eel, the Loader Mk II, the Dock Overseer); act 2 the Reactor (Coolant Crab, Pressure Diver, the Slag Golem, the Reactor Heart); act 3 the Core (Signal Moth, Firewall Shade, the Sentinel, and LUMEN itself). Modules are salvaged hardware that bends the rules, the role jokers play in Balatro. Terminals are the events, the fabricator is the shop, charging docks are rests.

Look: neon outlines on violet-black, Chakra Petch for display and IBM Plex Sans for text. Sound: synthesized blips, zaps and a generative synth score that tenses up in fights.

Rethemed 2026-11-02 from a sea-and-ink setting (Saltscript) that did not land with the author; rules and balance are unchanged.

## Core loop

```
station map (branching decks) ──► node: fight · elite · terminal · fabricator · dock · boss
                                              │
fight: 4×5 grid of cells drawn from your cell bank (the bag)
  swipe 3+ touching cells of one charge (8 directions) ──► link
  link = chips × mult
    chips: cell values   mult: cells − 2 (Arc up to 4, Surge up to 6, Overload from 7)
    Plasma → damage · Thermal → damage and 1 heat per cell · Shield → shield
  a grid with no link left reboots, so a fight never locks
  2 links per turn, then the machine acts on its shown intent (strike, shield, glitch, boost, drain, reroute)
  used cells go to the discard; the grid refills from the bank, which reshuffles when empty
                                              │
reward: scrap + pick 1 of 3 cells (elites also offer modules) ──► next deck
```

The tension: every link is a choice between damage and shield, and long links only exist where a charge happened to cluster. Every cell added to the bank changes what the grid can show you.

Revised 2026-11-02: links used to mix charges, which let a single zigzag through all twenty cells win every run. One charge per link closes that and makes the rule fit in one sentence.

## What makes it sticky

- One gesture, readable in seconds; the preview shows the exact sum while you swipe
- Each run is a new seed, map, machine line-up and bank; the Daily Signal is the same run for everyone
- Module combos create the "broken build" moments roguelikes are loved for
- Runs save after every action and can be resumed from the title

## Monetization (later stage)

Premium one-time purchase or a free first act with a single unlock. No energy, no ads during runs. Cosmetic chassis and cell skins come later.

## Platform for the prototype

Mobile web (PWA), portrait, plain JavaScript without a build, deterministic core shared by game, tests and bot.
