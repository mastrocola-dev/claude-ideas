# Memory — Saltscript build agent

Rewritten by each run; keep it short.

- `src/core/run.js` holds the run reducer `act(run, action)`; screens are `map`, `combat`, `reward`, `market`, `rest`, `shrine`, `victory`, `defeat`
- `src/core/combat.js`: 4×5 `cells` (index = row × 4 + column), `pile` and `discard` hold rune objects `{id, ink, value}`; salt cells are `{ink: 'salt', ttl}` and never enter the bag
- `readGlyph(runes, marks)` is the single scoring rule; marginalia add bonuses through their `glyph` function in `src/core/data.js`, flags like `mossRubric` are checked by key
- Randomness: `rng(seed)` then store `rand.state()` back in `run.seed` or `combat.seed`
- `bestPath(combat, depth)` in `src/core/bot.js` is an exhaustive search; depth 5 takes about 50 ms
- `window.saltscript` exposes `run`, `hint`, `pointFor`, `node` for `e2e/play.js`; e2e blocks Google Fonts to stay offline
- Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (override with `CHROMIUM`); `playwright-core` only
- Biome formats Markdown too; run `npm run fix` before committing
- Fetch `poc` with `git fetch origin +refs/heads/poc:refs/remotes/origin/poc` before `git checkout -B poc origin/poc`
- `run.trail` lists the lane chosen per floor; `openLanes(run)` gives lanes still reachable per floor; `drawRoutes` in `src/ui/routes.js` measures node rects after `show('map')`
- `add_repo` may be missing from the tools; the session's clone already fetches and pushes
- `write` no longer runs the foe: at 0 strokes the UI waits `foePause` then dispatches `endTurn`; `bestPath` returns null at 0 strokes, so bots and e2e fall through to `endTurn`
- A finished fight keeps `run.combat` while `run.screen` has already moved on; `dispatch` holds the combat view for `foePause`, so e2e must wait for the next section to be visible
- `announce` in `src/ui/feedback.js` maps each `combat.events` kind to its feedback; a new intent needs an entry there
