# Backlog — Saltscript

The build agent takes items from the top of **Next**, one commit each. Scheduled task `Saltscript build agent`, hourly at :17 from 11:17 to 01:17 (America/Sao_Paulo); it disables itself when Next is empty or after 02:00 on 2026-11-03.

## Next

### S07 More marginalia

Eight more marginalia with rarities (common, uncommon, rare) that open new builds: burn-based, ward-to-wound conversion, salt synergies, short-stroke builds, bag-size builds. Rewards and market roll by rarity. Done when each has a rule test.

### S08 More shrines

Four more shrines with real trade-offs in the world's voice (for example the Ink Leech, the Tide Bell, the Mapmaker's Corpse, the Lamp That Asks). Done when each option has a test.

### S09 Meta progression

Lamplight earned per run (floors cleared plus bosses). Spending it unlocks marginalia into the pools and a second scribe, the Ember Novice (bag tilted to Ember, starts with Ember Psalm). Title screen shows the unlocks; progress stored separately from the run. Done when unlocks persist and change new runs (tests and e2e).

### S10 Daily Tide

A run seeded from the UTC date, one recorded attempt per day, share text (date, floor reached, greatest glyph, a row of ink glyphs) via `navigator.share` with clipboard fallback. Done when two runs on the same date have the same map and the share format is tested.

### S11 Codex and first-fight guidance

A codex sheet reachable from map and combat: glyph tiers table, inks, intents, current marginalia. The first fight of the first run shows three one-line hints in sequence. Done when the hints appear once and the codex opens from both screens (e2e).

### S12 PWA

Manifest, icon, service worker caching the app shell and fonts, offline play after the first visit. Done when e2e reloads offline and starts a run.

### S13 Accessibility

axe in e2e on every screen with no serious or critical violations; a tap alternative to swiping (tap runes in order, then Write); each ink also has a shape mark inside the seal so colour is not the only cue. Done when e2e wins a fight using taps only.

### S14 Showcase

`README.md` with pitch, how to play, how to run, screenshots of title, map, combat and reward; link to `docs/concept.md`. Update the table in the repository root README. Done when it renders on GitHub with the images.

## Needs author

- Board is 4 columns × 5 rows so runes stay large on a phone; the bag starts at 26 and cannot be scraped below 12, so a thin bag leaves empty cells
- Salt runes vanish when written through with Saltwise instead of returning to the bag
- Balance bands rest on bots, not people: the human-like policy never writes past 4 runes, so the Tide and Choirmother were cut to 125 and 110 base health; real players reaching 5-rune Verses may find act 1 easy

## Done

- S01 Playable MVP: map, fights, glyph scoring, rewards, market, rest, shrines, boss, saved runs, e2e (2026-11-02, built in the conversation)
- S02 Map routes: SVG links behind the nodes, walked trail, unreachable nodes dimmed (2026-11-02)
- S03 Combat feel: floats, glyph flourish, 600 ms foe pause, salt cracks, reduced motion (2026-11-02)
- S04 Sound and haptics: synthesized cues per event, persisted mute, guarded vibrate (2026-11-02)
- S05 Balance harness: human-like policy, `npm run balance`, boss and elite tuned, bands pinned by test (2026-11-02)
- S06 Acts two and three: Sunken Nave and Lighthouse, smudge and undertow, bosses offer marginalia, half heal between acts (2026-11-02)

MVP rule: every commit keeps `npm test`, `npm run check` and `npm run e2e` green.

## Later

- Hosting with a public link, native wrapper and store listing
- Scribe skins, ink cosmetics, seasonal Tides
