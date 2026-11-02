# Backlog — Saltscript

The build agent takes items from the top of **Next**, one commit each. Scheduled task `Saltscript build agent`, hourly at :17 from 11:17 to 01:17 (America/Sao_Paulo); it disables itself when Next is empty or after 02:00 on 2026-11-03.

## Next

### S14 Showcase

`README.md` with pitch, how to play, how to run, screenshots of title, map, combat and reward; link to `docs/concept.md`. Update the table in the repository root README. Done when it renders on GitHub with the images.

## Needs author

- Board is 4 columns × 5 rows so runes stay large on a phone; the bag starts at 26 and cannot be scraped below 12, so a thin bag leaves empty cells
- Salt runes vanish when written through with Saltwise instead of returning to the bag
- Balance bands rest on bots, not people: the human-like policy never writes past 4 runes, so the Tide and Choirmother were cut to 125 and 110 base health; real players reaching 5-rune Verses may find act 1 easy
- Lamplight costs (15, 30, 40) and earnings (1 per floor, 10 per boss) are a first guess; unlocks are not yet in the balance harness
- Daily runs ignore unlocks and scribes so scores compare; starting another run mid-Tide forfeits that day's record

## Done

- S01 Playable MVP: map, fights, glyph scoring, rewards, market, rest, shrines, boss, saved runs, e2e (2026-11-02, built in the conversation)
- S02 Map routes: SVG links behind the nodes, walked trail, unreachable nodes dimmed (2026-11-02)
- S03 Combat feel: floats, glyph flourish, 600 ms foe pause, salt cracks, reduced motion (2026-11-02)
- S04 Sound and haptics: synthesized cues per event, persisted mute, guarded vibrate (2026-11-02)
- S05 Balance harness: human-like policy, `npm run balance`, boss and elite tuned, bands pinned by test (2026-11-02)
- S06 Acts two and three: Sunken Nave and Lighthouse, smudge and undertow, bosses offer marginalia, half heal between acts (2026-11-02)
- S07 More marginalia: eight new with rarities, rolled by weight in rewards and market (2026-11-02)
- S08 More shrines: Ink Leech, Tide Bell, Mapmaker's Corpse, Lamp That Asks; effects moved to a table (2026-11-02)
- S09 Meta progression: Lamplight banked per run, unlockable marginalia and the Ember Novice on the title (2026-11-02)
- S10 Daily Tide: UTC-seeded run, one attempt per date, share text with ink row (2026-11-02)
- S11 Codex and first-fight guidance: codex dialog from map and combat, three hints once (2026-11-02)
- S12 PWA: manifest, service worker with cached shell and fonts, offline play (2026-11-02)
- S13 Accessibility: axe on every screen, tap and Write input, an ink shape on every rune (2026-11-02)

MVP rule: every commit keeps `npm test`, `npm run check` and `npm run e2e` green.

## Later

- Hosting with a public link, native wrapper and store listing
- Scribe skins, ink cosmetics, seasonal Tides
