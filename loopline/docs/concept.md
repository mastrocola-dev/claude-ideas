# Loopline — concept

Updated 2026-10-31. One-line pitch: **arrow escape meets conveyor sort, on a ring.**

## Why this game

Market read (October 2026):

- Hybridcasual sort puzzles are the fastest-growing casual revenue segment in H1 2026 (+229% revenue); the conveyor mechanic of Pixel Flow! led it, and its studio sold for over US$ 1B
- Arrow-escape puzzles moved from ad-capped hypercasual to hybridcasual: CubeAway (arrows on a rotating cube, move limits) reached #4 in top downloads
- Hits share a recipe: a proven one-tap mechanic, no forced ads, boosters, timed stages and steady LiveOps

Loopline fuses the two rising mechanics into one loop nobody ships yet, and adds the daily shared puzzle that made word games spread.

## Core loop

```
grid of tiles (color + arrow) ──tap──► tile slides out along its arrow if the path is clear
          │                                              │
          ▼                                              ▼
   blocked tiles wait                    lands on the ring belt that circles the grid
                                                         │
                                belt rotates one step per tap; each bin at the edge
                                pulls tiles of its color as they pass
                                                         │
                         three in a bin clear it ◄───────┘
```

- Win: grid and belt empty
- Lose: a tile cannot land because the belt is full
- The tension: tapping order matters twice — an arrow must have a clear path, and the belt must not choke before the right bin comes around

## What makes it sticky

- One tap, readable in 3 seconds, deep after level 20 (belt capacity, bin order, locked tiles, two-step arrows)
- Every level is generated from a seed and proven solvable by a solver before it is shown
- Daily Loop: same seed for everyone, shareable emoji grid of the solve, streak counter
- Boosters earned with stars, never forced ads: undo, extra belt slot, reverse belt
- Haptics and synthesized sound on every clear

## Monetization (later stage)

No interstitials. Rewarded booster refills, a one-time "no limits" purchase, cosmetic belt skins, season pass on the Daily Loop.

## Platform for the prototype

Mobile web (PWA), portrait, offline, canvas rendering, plain JavaScript without a build. Native wrappers are a later decision.
