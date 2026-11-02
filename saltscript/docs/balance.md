# Balance

50 seeds, from `npm run balance`, after the one-ink-per-stroke rule (2026-11-02). Enemy health and attack and ward values are the tuning levers; floor scaling is +10% per floor. The human-like band applies to act 1.

| Policy     | Act 1 cleared | Full run won | Mean acts cleared | Turns per fight |
| ---------- | ------------- | ------------ | ----------------- | --------------- |
| longest    | 96%           | 40%          | 2.3               | 3.5             |
| exhaustive | 88%           | 38%          | 2.1               | 4.7             |
| human      | 54%           | 2%           | 0.8               | 5.5             |

- `longest` always writes the longest legal stroke. Before the rule change a zigzag through all twenty runes won 100% of runs; it is now a strong habit, not a solved game
- `exhaustive` scores every stroke up to 8 runes by wound, needed ward and burn
- `human` picks at random among the three best strokes up to 6 runes
