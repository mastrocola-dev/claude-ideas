# Balance

50 seeds, from `npm run balance`, after the damage and health pass of 2026-11-02. Enemy health and attack values are the tuning levers; floor scaling is +10% per floor inside each act.

| Policy     | Act 1 cleared | Full run won | Mean acts cleared | Turns per fight |
| ---------- | ------------- | ------------ | ----------------- | --------------- |
| longest    | 94%           | 18%          | 2.0               | 3.3             |
| exhaustive | 98%           | 22%          | 2.0               | 4.5             |
| human      | 78%           | 0%           | 1.0               | 5.4             |
| player     | 72%           | 24%          | 1.5               | 4.9             |

- `longest` always makes the longest legal link
- `exhaustive` scores every link up to 8 cells by damage, needed shield and heat
- `human` picks at random among the three best links up to 6 cells and never takes modules
- `player` links like `human` but plays the run like a person: takes modules, buys at the fabricator, rests when hurt, avoids terminals

## Damage and health pass (30 runs, `player` policy)

Before the pass, normal fights were nearly free and the act 1 boss decided the run:

| Act | Fight  | Damage taken before (share of max integrity) | After         |
| --- | ------ | -------------------------------------------- | ------------- |
| 1   | normal | 12%                                          | 13%           |
| 1   | boss   | 47%, killed 8 of 30 runs                     | 33%, killed 4 |
| 2   | normal | 5%                                           | 7%            |
| 2   | boss   | 23%                                          | 25%           |
| 3   | normal | 2%                                           | 8%            |
| 3   | boss   | 20%                                          | 45%           |

Deaths by act went from 12 / 0 / 3 to 7 / 6 / 9: the difficulty now climbs through the run instead of peaking at the first boss. Changes: act 1 normal attacks +15%, Loader +10%, Dock Overseer health −20% and attack −15%; act 2 normal and elite health +10% and attack +20–25%, Reactor Heart health −5% and attack +10%; act 3 normal and elite health +10% and attack +40–45%, LUMEN attack +45%.
