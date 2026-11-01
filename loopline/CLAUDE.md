# Rules for agents — Loopline

Read `docs/concept.md`, `BACKLOG.md` and `MEMORY.md` before anything else.

## Run protocol

1. Take the first item under **Next** in `BACKLOG.md`; one item per run
2. Implement it until its done criteria hold; tests green (`npm test`), check green (`npm run check`)
3. Self-review the diff: minimal, readable, no dead code
4. Move the item to **Done** with the commit date; record lessons in `MEMORY.md` (rewrite, keep it short)
5. One commit, author `Claude <noreply@anthropic.com>`, pushed to `poc`; never `main`, never force-push
6. A decision you cannot make: build the most reasonable default, record it under **Needs author**, continue

## Code

- Plain JavaScript ES modules, no build, no framework, no runtime dependencies
- Node 24 for tests with `node:test`; Biome pinned for lint and format (`npm run check`, `npm run fix`)
- No `;`, single quotes, no comments; names carry the meaning
- Game logic is pure and deterministic (`src/core/`), separate from rendering and input (`src/ui/`)
- Every random choice goes through the seeded generator
- Portrait first, 360 px wide minimum, touch first, 60 fps target
- All text in English
