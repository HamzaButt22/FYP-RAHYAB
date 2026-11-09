# Assessment frameworks as data

These files turn the frameworks in `design/game/GAME_DESIGN.md` (sections 11–12) into data that the game script, the app and the scoring service can all read. Version 1.0.0, 2026-11-04; `streams.json` 1.2.0, 2026-11-05.

| File | What it holds |
|---|---|
| `riasec.json` | The six RIASEC types in plain words, and the 12 week-planner activities with their hidden type tags |
| `pairs.json` | The 15 Dil/Duniya type pairs, coverage targets, and a balanced 4-week target schedule (sides and voices counterbalanced) |
| `abilities.json` | The 6 ability task families, the ICAR item family each follows, and scoring rules |
| `work_values.json` | O\*NET's six work values and the 6 story dilemmas that measure them |
| `streams.json` | Paths by class with RIASEC profiles, ability support and eligibility gates:<br>• **class 8:** 4 Matric groups, including Matric Technical;<br>• **classes 9–10:** 10 paths, including DAE, technical and vocational (TEVTA/NAVTTC), A Level, and early nursing or allied health;<br>• **classes 11–12:** 19 fields, including engineering technology, nursing and allied health, pharmacy, agriculture and veterinary, CA/ACCA, armed forces, hospitality, IT skills, and fine arts and fashion.<br>Paths marked `verify: true` must be checked before the pilot. Since v1.1.0 it also holds:<br>• `routes`: switch group, re-take class 9, additional subject, switch stream, alternatives, and the anti-push rule;<br>• `age_rules`: age bands, consent by age, the over-age soft check;<br>• `situations`: the "My situation" options.<br>See `docs/project/EDGE_CASES.md` |
| `scoring.json` | Settings for models M1–M3, confidence levels, the letter reveal, fairness limits and what is never scored |

**Rules:**
- Writers tag Ink choices with the codes used here (`#pair:R-A #left:R #voice:dil`).
- A CI check compares the script's tags against `pairs.json`.
- Stream profiles and gates are a first version: replace the profiles with O\*NET-derived values and counsellor AHP weights, and re-check the gates every year before each pilot or release.
- Every `routes` entry starts as `verified: false`. The app hides an unverified route's board-specific details and shows "Check with your board" instead.
