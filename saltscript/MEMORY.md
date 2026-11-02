# Memory — Saltscript build agent

Rewritten by each run; keep it short.

- `src/core/run.js` holds the run reducer `act(run, action)`; screens are `map`, `combat`, `reward`, `market`, `rest`, `shrine`, `victory`, `defeat`
- `src/core/combat.js`: 4×5 `cells` (index = row × 4 + column), `pile` and `discard` hold rune objects `{id, ink, value}`; salt cells are `{ink: 'salt', ttl}` and never enter the bag
- One ink per stroke: `canExtend` and `isValid` enforce it (Salt is wild only with Saltwise); mult is `multFor(length)` = runes − 2; `draw` ends in `settle`, which rewrites the page until `hasStroke` holds, then forces three of one ink together, and adds a `rewrite` event
- `readGlyph(runes, marks)` is the single scoring rule; marginalia add bonuses through their `glyph` function in `src/core/data.js`, flags like `mossRubric` are checked by key
- Randomness: `rng(seed)` then store `rand.state()` back in `run.seed` or `combat.seed`
- `src/core/bot.js`: `bestPath` exhaustive to depth 8 keeping the top three, `humanPath` top three at depth 6, `longestPath` (the old exploit's heir, must stay at or under 60% full wins), `playRun`, `summarize`; any data change must keep `test/balance.test.js` in its bands (about 15 s) and refresh `docs/balance.md`
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
- `meta.hints` counts first-fight hints shown, advanced on each written stroke; the codex is a `<dialog>` filled on open
- `sw.js` shell must list every `src/` file (`test/pwa.test.js` enforces); stale-while-revalidate, so a new deploy shows on the second load
- Input: a press without a swipe is a tap that keeps the path, and `#write` replaces End turn once 3 runes are held; `window.saltscript.play(run)` forces any screen for e2e audits
- Gate each commit on real exit codes, never a `tail` of `npm run check`: S11 and S12 went out with a lint error that way
- Backlog items can ask for edits outside `saltscript/`; the rule wins, so record them under **Needs author**
- Settings live in `src/ui/settings.js` (`saltscript.settings`: `sound`, `music`, `language`); `onSettings` re-renders, re-syncs music and reapplies static text
- Every visible string goes through `t(key)` from `src/ui/i18n.js`; content names come from `local(section, key)`, glyph names from `glyphName(glyph)`, never `glyph.name`; static HTML uses `data-i18n` and `data-i18n-label`
- A new string or content key needs `src/ui/locales/en.js` and `pt.js` (or a `pt` overlay for `data.js` content); `test/i18n.test.js` enforces both and matching placeholders
- `src/ui/music.js` is generative WebAudio (sea noise, two drones, bells); `show()` sets mood `calm` or `fight`; it starts on the first pointer or key press
