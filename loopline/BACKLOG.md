# Backlog — Loopline

The build agent takes items from the top of **Next**, one commit each. Scheduled task `Loopline build agent` (`trig_01XrJeVriWSmRyxgE9ooXJuS`), runs at 22:32, 23:32, 00:32 and 01:32 (America/Sao_Paulo), disables itself after 01:30.

## Next

### L07 Juice

Haptics (`navigator.vibrate`, guarded), WebAudio synthesized sounds (tap, slide, bin clear, win, lose) with a mute toggle, clear particles, screen shake on loss. Done when every event has feedback and mute persists.

### L08 Boosters

Undo, extra belt slot, reverse belt direction; earned by stars, counts persisted. Done when each booster has a rule test and a button.

### L09 Daily Loop

Seed from the UTC date, one attempt record per day, streak, share text built from emoji (moves, stars, a small ring glyph) through `navigator.share` with clipboard fallback. Done when two runs on the same date produce the same level and share text format is tested.

### L10 PWA

Manifest, SVG icon, service worker caching the app shell, offline play. Done when the page loads offline after the first visit (Playwright check).

### L11 Accessibility check

`npm run e2e` already plays levels 1–4 through real taps on 390×844 and checks progress after reload. Add axe (`axe-core` injected into the page) on the title, game and result screens. Done when no serious or critical violations remain.

### L12 Showcase

`README.md` with pitch, how to play, how to run, screenshot of a level and of the win overlay in `docs/screenshots/`, link to `docs/concept.md`. Done when the README renders on GitHub with the images.

## Needs author

- Bins pull matching tiles from the loop at once (the loop is a holding ring), instead of only when a tile passes the bin as `docs/concept.md` describes. Default built: instant pull, because it keeps the puzzle deterministic and readable; positional pull is a candidate hard mode
- Hosting: the MVP runs locally (`npm run serve`) and as a private claude.ai artifact; GitHub Pages needs a repository setting only the author can change

- Locked tiles open after a count of moves (badge on the tile) rather than by a neighbour or key; generator caps each lock at the tile's position in its proven order so solvability holds
- The solver's optimum (lowest loop peak) is 0 on most generated levels, so three stars are easy; a tighter bin order is a candidate difficulty knob

## Done

- L01 Project skeleton (2026-10-31, built in the conversation)
- L02 Core model (2026-10-31, built in the conversation)
- L03 Solver and generator (2026-10-31, built in the conversation)
- L04 Renderer and input (2026-10-31, built in the conversation)
- L05 Game flow (2026-10-31, built in the conversation)
- L06 Difficulty curve and tutorial (2026-10-31)

MVP rule: every commit keeps `npm test`, `npm run check` and `npm run e2e` green; a run that breaks e2e reverts its own change.

## Later

- Hosting (GitHub Pages or Static Web Apps) and a public link
- Native wrapper (Capacitor) and store listings
- Analytics on level funnels, rewarded refills, belt skins, season pass
