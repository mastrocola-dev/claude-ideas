# Memory — Loopline build agent

Rewritten by each run; keep it short.

- MVP playable since 2026-10-31: `src/core/` (game, solver, levels, rng) pure; `src/ui/` (board canvas, feedback, progress) plus `src/main.js` wiring DOM screens
- Model: tapping a free tile moves its color to the loop (`belt`); active bins (`bins`) pull their color; three clear a bin and the next color comes from `queue`; loop over `capacity` loses
- Levels 1–3 are hand-made in `tutorials`; `paramsFor` is a step table; `analyze` gives optimum (min loop peak) and branching; `test/curve.test.js` pins band means of branching for 1–50, retune it when the table changes
- Locks: `tile.lock` = moves before it opens; use `tappable`/`isOpen`, not `isFree`, for playability
- Generator places tiles so the reverse placement order is always arrow-solvable; the solver then checks the bin queue; levels are deterministic by number
- `window.loopline` exposes `level`, `status` and `pointFor` for `e2e/play.js`; keep it working
- Feedback events `tap`, `slide`, `blocked`, `clear`, `win`, `lose` in `src/ui/feedback.js`, guarded for Node; sparks and quake are CSS in `main.js`, off under reduced motion
- Boosters: rules `undo`, `widen`, `reverse` in `game.js`; stock in `progress.boosters` (`recordWin`, `spendBooster`); buttons below the board share ids with the kinds
- Daily: `src/core/daily.js` (seed from UTC date key, `recordDaily`, `shareText`); daily levels carry `day` and `number: 'daily'`, so use `begin(level)` not `start(number)` to replay
- `begin` draws the board at once: the e2e taps right after a level starts and the cell size changes with board size
- PWA: classic `sw.js` (network first, cache fallback, `shell` list); `test/pwa.test.js` fails when a new `src/` file is missing from `shell`, bump `cache` name on shell changes
- e2e runs axe-core (pinned dev dependency) on title, game and result; icon buttons need an aria-label that contains their visible count
- Cloud runs: Node 22 works; Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (override with `CHROMIUM`); `playwright-core` only, no browser download
- Biome also formats Markdown; run `npm run fix` before committing
- Fetch `poc` with `git fetch origin +refs/heads/poc:refs/remotes/origin/poc` before `git checkout -B poc origin/poc`
