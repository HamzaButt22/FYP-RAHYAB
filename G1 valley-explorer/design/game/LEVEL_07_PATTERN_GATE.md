# Level 07 — The Pattern Gate

| Field | Value |
|---|---|
| Level ID (code) | `pattern_gate` (existing) |
| Play order | 6 of 8 · Chapter 2 |
| Kind | **Ability evidence — abstract (inductive) reasoning** |
| Location | Old Aqueduct (`WORLD_AND_STORY_DESIGN.md` §5.7; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §8) |
| Target duration | 4 min |
| Characters | The builders' plaque (read-aloud "voice"), Chakor, the repair crew (background) |
| Preserved | Item bank `pg_practice` + `pg1…pg6` (four-panel sequences of shape × count × fill; each distractor breaks exactly one attribute; no colour, no words), scoring rules, events |
| Changed | Physical sluice gate: carved stones, empty socket, stone cart, turning wheel; water flow as the payoff; the rule shown as carvings after each item |

---

## 1. Level name
**The Pattern Gate** — "Work out what comes next."

## 2. Level objective
- **Player objective:** reopen the old aqueduct sluice so the path to the Fort can be crossed and water reaches Riverside Park for the festival.
- **Assessment objective:** six scored items. Operational construct: *inferring the rule of a sequence (shape, count, fill) and applying it to the next element*. Distractors each break one attribute, so a wrong choice also records which part of the rule was missed (diagnostic, research use).

## 3. Story introduction
The hill path ends at a stone aqueduct over a dry gorge. A bronze **plaque** (read aloud): "Builders of Rahwali: set each stone in its pattern and the water will run." Chakor hops onto the sluice: "The channel is dry! The gate needs the right stones."

## 4. Environment design
A long stone aqueduct with arches, a dry channel full of pebbles, and a heavy **sluice gate** carved with a row of four stones and one **empty socket**. Beside it, a wooden **stone cart** holds four candidate stones. A large **wheel** turns the sluice. Distant view: Riverside Park waiting for water; the Fort on the ridge beyond. Each stone shows shapes (circle, square, triangle, diamond), counts 1–6 and fill (carved solid vs outline). **No colour coding is used for the rule** (existing item design; colour-blind safe).

## 5. Map layout
Walk-in along the hill path (6 tiles) to the sluice, then the sluice close-up (`WORLD_MAP_AND_LEVEL_LAYOUTS.md` §8): stone row top, socket at the right end, cart below, controls at the bottom.

## 6. Character movement
Walk-in; then the character stands on the walkway beside the wheel and turns it on submit (animation).

## 7. Interactive objects

| Object | Interaction | Response |
|---|---|---|
| Candidate stone (×4) | Drag to the socket (or tap stone, tap socket) | Stone drops into the socket with a stone "clunk"; previous stone returns to the cart |
| Carved stones (×4) | Tap | Enlarges the stone; read-aloud describes it ("three solid squares") **[A]** for low-vision users |
| Builders' guide (hint) | Tap | Chakor hint (existing, e.g., "Count the circles on each stone.") |
| Wheel | Tap (enabled when a stone is in the socket) | Submits |
| Skip | Tap | The repair crew sets the stone |

## 8. NPC interactions
- **Plaque voice:** item 1 introduction only.
- **Chakor:** hints and short reactions ("Water!").
- **Repair crew** (background builders): appear only to set stones after a skipped or unsolved item ("We'll take it from here!").

## 9. Main mission
Set the practice stone and **six gate stones** (pg1–pg6).

## 10. Optional missions
None during items. Curiosity spot on the walk-in: an old carved stone with the builders' marks (O-1 research signal).

## 11. Exact gameplay mechanics
1. **Practice** (`pg_practice`, "one more circle each time"): retries; after a correct answer, the carvings light up one by one to show the rule.
2. **Stones 1–6:**
   1. `ITEM_PRESENTED`.
   2. Place a candidate in the socket (swaps allowed).
   3. **Turn the wheel** → `ITEM_RESPONSE`.
   4. **Resolution:**
      - Correct: the sluice lifts a little and water gushes one section further along the channel; the rule glows on the stones (e.g., "The shapes repeat: circle, square, triangle").
      - Not correct: the chosen stone glows, the part of the rule it breaks is shown (e.g., "The number is going down — this stone goes up"), then the crew sets the right stone and the water moves on.
      - Skipped: the crew sets the stone; rule shown.
   5. Next stone (new sequence carved on the next section of the gate).
3. After stone 6: the sluice opens fully; water runs to the park (visible on the hub later); map piece 6; journal page.

## 12. Player decisions
Which stone to place; hint; skip.

## 13. Challenge and difficulty progression

| Item | Rule (from the item bank) | Attributes changing |
|---|---|---|
| pg_practice | One more circle each time | 1 (count) |
| pg1 | Shapes repeat: circle, square, triangle | 1 (shape cycle) |
| pg2 | One more square each time; solid/outline take turns | 2 |
| pg3 | Triangle and diamond take turns; one fewer each time | 2 |
| pg4 | Add two, then take away one; solid/outline take turns | 2 (non-linear count) |
| pg5 | Shapes repeat in threes, one more each time, every third stone is an outline | 3 |
| pg6 | Four shapes repeat, one fewer each time; solid/outline take turns | 3 |

Order is provisional; re-order by pilot p-values.

## 14. Rewards
2 coins per attempted scored item (any outcome), 20 coins for the level, map piece 6, stamp 6. The water always reaches the park.

## 15. Completion conditions
Practice + six stones answered or skipped.

## 16. Failure and retry behaviour
Practice: retries. Scored: one attempt; the story continues. Resume at the current stone after app kill.

## 17. Assessment signals collected

| Event (existing) | Data | Use |
|---|---|---|
| `ITEM_PRESENTED` | item_id, family `abstract`, difficulty, practice | Exposure |
| `ITEM_RESPONSE` | chosen option (→ which attribute was broken), correct, attempt, hints_used, response_time_ms | Ability count; distractor analysis (research) |
| `HINT_USED` | item_id | "Without hints" count |
| `RESEARCH_SIGNAL {persistence…}`, `{curiosity_spot}` **[A]** | | Research only (C-2, O-1) |
| `BIG5_RESPONSE` | Journal: mi06, mi15, mi19 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** how many of six sequence problems the student solved today; which rule attributes (count, shape, fill) were most often missed (useful for the research team and possibly for study tips).
- **Cannot:** IQ or "intelligence", academic potential, or suitability for any pathway on its own. Six items give a rough count only; familiarity with similar puzzles (school worksheets, puzzle apps) affects results.

## Journal page after this stop
**mi06** "I don't talk a lot." · **mi15** "I have difficulty understanding abstract ideas." (gloss explains "abstract") · **mi19** "I seldom feel blue." (gloss: "feel blue" means feel sad)

## Changes from the current build
| Current | Proposed |
|---|---|
| Sequence card + 4 options + "Check answer" | Carved gate, stone cart, socket, wheel |
| Feedback text | Water flow + rule lit on the stones; wrong part of the rule explained |
