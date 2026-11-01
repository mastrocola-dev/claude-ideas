# Memory — Loopline build agent

Rewritten by each run; keep it short.

- MVP playable since 2026-10-31: `src/core/` (game, solver, levels, rng) pure; `src/ui/` (board canvas, feedback, progress) plus `src/main.js` wiring DOM screens
- Model: tapping a free tile moves its color to the loop (`belt`); active bins (`bins`) pull their color; three clear a bin and the next color comes from `queue`; loop over `capacity` loses
- Generator places tiles so the reverse placement order is always arrow-solvable; the solver then checks the bin queue; levels are deterministic by number
- `window.loopline` exposes `level`, `status` and `pointFor` for `e2e/play.js`; keep it working
- Cloud runs: Node 22 works; Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` (override with `CHROMIUM`); `playwright-core` only, no browser download
- Biome also formats Markdown; run `npm run fix` before committing
- Fetch `poc` with `git fetch origin +refs/heads/poc:refs/remotes/origin/poc` before `git checkout -B poc origin/poc`
