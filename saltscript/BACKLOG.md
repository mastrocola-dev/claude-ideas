# Backlog — Saltscript

The build agent takes items from the top of **Next**, one commit each. Scheduled task `Saltscript build agent`, hourly at :17 from 11:17 to 01:17 (America/Sao_Paulo); it disables itself when Next is empty or after 02:00 on 2026-11-03.

## Next

### S03 Combat feel

Floating numbers over the foe (wound, burn) and the player (damage, ward); the glyph name flourishes on write; the foe turn resolves 600 ms after the last stroke so the player sees its intent land; salt cracks in visibly. Respect `prefers-reduced-motion`. Done when every combat event has visible feedback and e2e still wins the first fight.

### S04 Sound and haptics

WebAudio synthesized sounds: a quill scratch on each rune added to the path (pitch rises with length), a stamp on write that deepens with mult, wound, burn hiss, salt crackle, victory and defeat. Mute toggle on the title, persisted. `navigator.vibrate` guarded. Done when every event has sound, mute persists after reload (e2e) and nothing plays in Node.

### S05 Balance harness

`src/core/bot.js` gains a human-like policy (random among the top three paths, depth 4, seeded). `npm run balance` prints win rate, floor reached and turns per fight over 50 seeds for both policies. Tune data so the exhaustive bot wins at least 90% of act 1 and the human-like bot 40–60%. Record the table in `docs/balance.md`. Done when a test pins both rates within the bands on 20 seeds.

### S06 Acts two and three

After the Tide, the run continues to act two (The Sunken Nave) and act three (The Lighthouse), each with its own map, 2 new foes, 1 elite and a boss, and at least two new intents (for example `smudge`: lower two runes by one; `undertow`: shift a column down). Heal half the missing health between acts. Victory after the third boss. Done when the bot can finish all three acts on at least one of 10 seeds and tests cover the new intents.

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
- First balance pass: an exhaustive bot (depth 5) wins act 1 on 10 of 10 seeds, sometimes with under 10 health left; human play is expected near half

## Done

- S01 Playable MVP: map, fights, glyph scoring, rewards, market, rest, shrines, boss, saved runs, e2e (2026-11-02, built in the conversation)
- S02 Map routes: SVG links behind the nodes, walked trail, unreachable nodes dimmed (2026-11-02)

MVP rule: every commit keeps `npm test`, `npm run check` and `npm run e2e` green.

## Later

- Hosting with a public link, native wrapper and store listing
- Scribe skins, ink cosmetics, seasonal Tides
