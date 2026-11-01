# Backlog — Loopline

The build agent takes items from the top of **Next**, one commit each. Scheduled task `Loopline build agent` (`trig_01XrJeVriWSmRyxgE9ooXJuS`), runs at 22:32, 23:32, 00:32 and 01:32 (America/Sao_Paulo), disables itself after 01:30.

## Next

### L01 Project skeleton
`package.json` (type module, scripts `test`, `check`, `fix`, `serve`), Biome pinned, `index.html` loading `src/main.js`, a static dev server script with no dependency beyond Node. Done when `npm test` and `npm run check` pass with one trivial test and `npm run serve` serves the page.

### L02 Core model
`src/core/`: seeded RNG (mulberry32), grid of tiles `{color, dir}`, path-clear check, ring belt with `capacity` slots around the grid, bins on the ring with color and fill, `tap(state, x, y)` returning a new state, belt step, bin pull, clear on three, win and lose. Done when tests cover every rule including blocked tap, full belt loss and a scripted win.

### L03 Solver and generator
Breadth-first or best-first solver over `tap` with a state budget; generator that builds levels from parameters `{size, colors, capacity, bins}` and a seed, keeping only solvable ones. Done when 200 seeds per difficulty tier generate solvable levels in under 50 ms each on average (test asserts solvability; timing printed).

### L04 Renderer and input
Canvas renderer sized to the viewport with device pixel ratio, tiles as rounded squares with arrow glyphs, ring belt and bins drawn around the grid, tap hit-testing, tile slide and belt rotation animated with easing. Done when level 1 is playable in a mobile viewport by touch and mouse.

### L05 Game flow
Title screen, level select by number, win and lose overlays, restart, next level, progress and stars (by taps used vs solver optimum) in `localStorage` with try/catch. Done when a player can go from level 1 to 3 and reload without losing progress.

### L06 Difficulty curve and tutorial
Parameter table for levels 1–∞ (size, colors, capacity, bins, locked tiles from level 15), first three levels hand-tuned as tutorial with one-line hints. Done when the solver reports the optimum and branching for levels 1–50 rise smoothly (test on a table of expectations).

### L07 Juice
Haptics (`navigator.vibrate`, guarded), WebAudio synthesized sounds (tap, slide, bin clear, win, lose) with a mute toggle, clear particles, screen shake on loss. Done when every event has feedback and mute persists.

### L08 Boosters
Undo, extra belt slot, reverse belt direction; earned by stars, counts persisted. Done when each booster has a rule test and a button.

### L09 Daily Loop
Seed from the UTC date, one attempt record per day, streak, share text built from emoji (moves, stars, a small ring glyph) through `navigator.share` with clipboard fallback. Done when two runs on the same date produce the same level and share text format is tested.

### L10 PWA
Manifest, SVG icon, service worker caching the app shell, offline play. Done when the page loads offline after the first visit (Playwright check).

### L11 End-to-end test
Playwright on a 390×844 viewport: open, play level 1 using the solver's move list through real taps, see the win overlay; axe has no serious violations. Done when the test passes headless (Chromium at `/opt/pw-browsers/chromium`).

### L12 Showcase
`README.md` with pitch, how to play, how to run, screenshot of a level and of the win overlay in `docs/screenshots/`, link to `docs/concept.md`. Done when the README renders on GitHub with the images.

## Needs author

## Done

## Later

- Hosting (GitHub Pages or Static Web Apps) and a public link
- Native wrapper (Capacitor) and store listings
- Analytics on level funnels, rewarded refills, belt skins, season pass
