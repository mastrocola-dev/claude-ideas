# Memory — Saltscript build agent

Rewritten by each run; keep it short.

- `src/core/run.js` holds the run reducer `act(run, action)`; screens are `map`, `combat`, `reward`, `market`, `rest`, `shrine`, `victory`, `defeat`
- `src/core/combat.js`: 4×5 `cells` (index = row × 4 + column), `pile` and `discard` hold rune objects `{id, ink, value}`; salt cells are `{ink: 'salt', ttl}` and never enter the bag
- `readGlyph(runes, marks)` is the single scoring rule; marginalia add bonuses through their `glyph` function in `src/core/data.js`, flags like `mossRubric` are checked by key
- Randomness: `rng(seed)` then store `rand.state()` back in `run.seed` or `combat.seed`
- `src/core/bot.js`: `bestPath` exhaustive, `humanPath` top three at depth 4, `playRun`, `summarize`; any data change must keep `test/balance.test.js` in its bands (about 15 s) and refresh `docs/balance.md`
- `window.saltscript` exposes `run`, `hint`, `pointFor`, `node` for `e2e/play.js`; e2e blocks Google Fonts to stay offline
- Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (override with `CHROMIUM`); `playwright-core` only
- Biome formats Markdown too; run `npm run fix` before committing
- Fetch `poc` with `git fetch origin +refs/heads/poc:refs/remotes/origin/poc` before `git checkout -B poc origin/poc`
- `run.trail` lists the lane chosen per floor; `openLanes(run)` gives lanes still reachable per floor; `drawRoutes` in `src/ui/routes.js` measures node rects after `show('map')`
- `add_repo` may be missing from the tools; the session's clone already fetches and pushes
- `write` no longer runs the foe: at 0 strokes the UI waits `foePause` then dispatches `endTurn`; `bestPath` returns null at 0 strokes, so bots and e2e fall through to `endTurn`
- A finished fight keeps `run.combat` while `run.screen` has already moved on; `dispatch` holds the combat view for `foePause`, so e2e must wait for the next section to be visible
- `announce` in `src/ui/feedback.js` maps each `combat.events` kind to its feedback; a new intent needs an entry there
- `src/ui/sound.js` is synthesized WebAudio; a new event kind needs an entry in `eventSounds` and the test in `test/sound.test.js` enforces it for foe intents
- Acts live in `acts` in `data.js`; `run.actIndex` selects pools; a boss win calls `nextAct` then goes to `reward`; bands are about act 1 (`firstActRate`), a full bot run takes about 2 s
- Marginalia have `rarity`; `freshMarks` rolls by `rarityWeights`; `readGlyph(runes, marks, bagSize)` and `combat.bagSize` serve bag builds; bots never take marginalia from rewards
- Shrines: text and options in `data.js`, effects by option index in `shrineEffects` in `run.js`; an option without an effect walks away; `run.freeStep` lets `reachable` open every lane once
- `src/core/meta.js` is pure; `createRun(seed, runOptions(meta))`; `run.locked` filters marginalia offers; meta lives under `saltscript.meta`, banks once per `run.origin` and on load
- `src/core/daily.js`: `createDailyRun(date)` sets `run.daily`; `meta.daily` holds `{date, result}`; `run.stats.inks` records every written glyph's ink
