# Level 08 — The Lantern Vault

| Field | Value |
|---|---|
| Level ID (code) | `vault_locks` (existing) |
| Play order | 8 of 8 · Chapter 2 (final stop) |
| Kind | **Ability evidence — logical (deductive) reasoning** |
| Location | Old Fort & Lantern Vault (`WORLD_AND_STORY_DESIGN.md` §5.9; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §10) |
| Target duration | 5 min |
| Characters | Baba Sher (retired keeper — appears at the end), Chakor |
| Preserved | Item bank `vl_practice` + `vl1…vl6` (3-digit codes from 1–6, no repeats; clues report "right number, right place" and "right number, wrong place"; every clue set minimal with a unique solution, checked by the solver in tests), swipeable dials with arrow fallback, scoring rules, events, the existing "open vault" art concept |
| Changed | Six physical doors in a corridor; clue notes written by the keeper with icon tallies; lanterns behind each door; story resolution for unsolved locks |

---

## 1. Level name
**The Lantern Vault** — "Use the clues to open each lock. No timer."

## 2. Level objective
- **Player objective:** open the six doors of the old Fort's lantern store and carry the festival lanterns to the river.
- **Assessment objective:** six scored items. Operational construct: *deducing a unique code from feedback clues* (deductive reasoning, Mastermind-style). Correctness defined; no time limit; no chance element. (This replaces the original Pygame Level 4 "Crumbling Vault", whose countdown, gambles and tremors were removed in Phase 2.)

## 3. Story introduction
The north road climbs to the old Fort. In the courtyard, Chakor finds a ring of keys hanging on a nail with a note: "To whoever comes for the lanterns: the keys rusted years ago. I changed the locks to codes. My notes are on each door. — Baba Sher, Keeper." Chakor: "Six doors… let's try the small one first!" (practice).

## 4. Environment design
A cool stone corridor lit by small windows; six heavy iron doors, each with a brass lock plate holding **three dials** (1–6) and a **lever**; a **keeper's note** pinned beside each door. Each note lists guesses with tally marks: **● = right number in the right place**, **○ = right number in the wrong place** (shape-coded, not colour-coded). Behind each door: racks of paper lanterns that glow when the door opens. The courtyard has an old well (flavour) and the exit to the river path.

## 5. Map layout
Corridor scene (`WORLD_MAP_AND_LEVEL_LAYOUTS.md` §10): doors in two rows of three along a corridor; the next door shows the "!" marker. Walking to a door + Action **Try the lock** opens the door close-up: note (top), dials (centre, large), lever (right), hint/skip (bottom).

## 6. Character movement
Walk between doors (short distances). In the close-up the character is shown at the side, pulling the lever on submit.

## 7. Interactive objects

| Object | Interaction | Response |
|---|---|---|
| Dial ×3 | Swipe up/down, or tap ▲/▼ (existing) | Number changes with a click; the same number can be on two dials while exploring, and a gentle note appears: "Each number is used only once in the code" (existing) |
| Keeper's note | Tap | Enlarges; read-aloud reads each line ("Guess 6-2-4: two right in the right place") **[A]** |
| Lever | Pull (tap) when three different numbers are set | Submits |
| Hint (Chakor) | Tap | Existing hint (e.g., "Compare the two clues: which place keeps the same number?") |
| Skip | Tap | Uses Baba Sher's master key (story) |
| Opened door | Walk in → Pick up | Carry lanterns (flavour; no effect on score) |

## 8. NPC interactions
- **Chakor:** hints; reactions.
- **Baba Sher:** appears after the sixth door: "You opened my vault! The valley will see the lanterns again." → hands over map piece 8 → "Take the lanterns to the river — the festival is starting."

## 9. Main mission
Open the practice door and **six vault doors** (vl1–vl6); carry the lanterns out.

## 10. Optional missions
Look at the well (curiosity spot, O-1 research signal). No other optional content.

## 11. Exact gameplay mechanics
1. **Practice door** (`vl_practice`, code 2-3-6, 2 clues): retries allowed; after a correct answer each clue line ticks to show it fits.
2. **Doors 1–6:**
   1. Walk to the "!" door → **Try the lock** → `ITEM_PRESENTED`.
   2. Set the dials; read the note; optional hint.
   3. **Pull the lever** → `ITEM_RESPONSE` (first response counts).
   4. **Resolution:**
      - Correct: bolts slide, the door swings open, lanterns light up; each clue line ticks ✓ to show why.
      - Not correct: "Not this code." The correct code rolls onto the dials and each clue line ticks to show why it fits; then the **master key** opens the door (lanterns light up the same way).
      - Skipped: master key; code and reasoning shown.
   5. Next door.
3. After door 6: Baba Sher scene → map piece 8 → journal page → **Festival night epilogue** → Path Map.

## 12. Player decisions
The code (the answer); hint; skip; order of doors is fixed (one "!" at a time) so every student meets the items in the same order.

## 13. Challenge and difficulty progression

| Item | Code | Clues | Difficulty driver (from the item hints) |
|---|---|---|---|
| vl1 | 6-1-4 | 2 | Which place keeps the same number |
| vl2 | 6-5-2 | 2 | All three numbers known, positions to deduce |
| vl3 | 1-5-4 | 3 | Start from the clue that fixes two places |
| vl4 | 1-6-4 | 3 | Track one number across clues |
| vl5 | 1-3-5 | 4 | Three clues with exactly one right number each |
| vl6 | 3-6-2 | 4 | Use the "two right, wrong place" clue first |

Codes are listed here for the design review only; the shipped build must not expose answers in client-visible text other than the item bank already in the app (unchanged from the current build).

## 14. Rewards
2 coins per attempted scored door (any outcome), 20 coins for the level, map piece 8, stamp 8, the lantern carried into the festival (cosmetic in the epilogue).

## 15. Completion conditions
Practice + six doors answered or skipped.

## 16. Failure and retry behaviour
Practice: retries. Scored: one attempt; master key resolves. Resume at the current door after app kill.

## 17. Assessment signals collected

| Event (existing) | Data | Use |
|---|---|---|
| `ITEM_PRESENTED` | item_id, family `logical`, difficulty, practice | Exposure |
| `ITEM_RESPONSE` | code entered, correct, attempt, hints_used, response_time_ms | Ability count |
| `HINT_USED` | item_id | "Without hints" count |
| `RESEARCH_SIGNAL {persistence: ms before skip/hint, dial_changes}` **[A]** | per item | Research only (C-2) |
| `BIG5_RESPONSE` | Journal: mi10, mi16 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** how many of six deduction problems the student solved today (with/without hints).
- **Cannot:** intelligence, mathematical talent, or suitability for computing/engineering by itself. Results depend on understanding the clue notation (taught in practice) and familiarity with code puzzles. Skipping says nothing about personality for an individual (only aggregated persistence research uses it).

## Journal page after this stop
**mi10** "I am not interested in abstract ideas." (gloss) · **mi16** "I keep in the background."

## Changes from the current build
| Current | Proposed |
|---|---|
| Single dial screen per lock | Corridor of six doors; walk between them |
| Clues as text lines | Keeper's notes with ●/○ tallies and read-aloud |
| Open-vault picture on success only | Every door opens (master key if unsolved) — progress never depends on correctness |
