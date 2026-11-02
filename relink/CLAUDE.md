# Rules for agents — Relink

Read `docs/concept.md`, `BACKLOG.md` and `MEMORY.md` before anything else. Work only inside `relink/`.

## Run protocol

1. Take the first item under **Next** in `BACKLOG.md`; repeat steps 2–5 per item while the run has time (no new item 45 minutes after the run began)
2. Implement it until its done criteria hold; `npm test`, `npm run check` and `npm run e2e` green. The game must stay playable after every commit; a change that breaks e2e is reverted, not pushed
3. Self-review the diff: minimal, readable, no dead code; look at the e2e screenshots after any UI change
4. Move the item to **Done** with the date; record lessons in `MEMORY.md` (rewrite, keep it short)
5. One commit per item, author `Claude <noreply@anthropic.com>`, pushed to `poc`; never `main`, never force-push. Do not commit regenerated screenshots unless the item changed the UI
6. A decision you cannot make: build the most reasonable default, record it under **Needs author**, continue

## Code

- Plain JavaScript ES modules, no build, no framework, no runtime dependencies
- Node 22+ with `node:test`; Biome pinned for lint and format (`npm run check`, `npm run fix`)
- No `;`, single quotes, no comments; names carry the meaning
- Game rules are pure and deterministic in `src/core/` and every state change goes through `act(run, action)`; rendering and input live in `src/ui/` and `src/main.js`
- Every random choice goes through the seeded generator, and its state is stored back in the run
- Portrait first, 360 px wide minimum, touch first, readable without colour alone
- Every visible string in English and Brazilian Portuguese (`src/ui/locales/`), in the voice of the world in `docs/concept.md`
- Internal names predate the theme and stay: `rune` = cell, `ink` = charge, `glyph` = link, `marginalia` = module, `shrine` = terminal, `scribe` = chassis, `gold` = scrap, `lamplight` = data
