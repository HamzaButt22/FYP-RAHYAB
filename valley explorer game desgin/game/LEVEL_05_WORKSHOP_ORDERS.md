# Level 05 — Workshop Orders

| Field | Value |
|---|---|
| Level ID (code) | `workshop_orders` (existing) |
| Play order | 3 of 8 · Chapter 1 (first puzzle stop) |
| Kind | **Ability evidence — planning & numerical reasoning** |
| Location | Town Workshop (`WORLD_AND_STORY_DESIGN.md` §5.3; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §5) |
| Target duration | 5 min |
| Characters | Nasreen Khala (festival quartermaster — neutral host), customers |
| Preserved | Item bank `wo_practice` + `wo1…wo6` (stock, orders, coins; optimum computed by brute force), scoring rules (first response counts, practice not scored, 1 hint, skip allowed, ≥ 4 attempted for a result), over-budget plans cannot be submitted, `ITEM_PRESENTED / ITEM_RESPONSE / HINT_USED` |
| Changed | Presentation as an order board, a bench and shelves with visibly shrinking materials; story resolution after every item; no multiple-choice look |

---

## 1. Level name
**Workshop Orders** — "Plan the festival orders."

## 2. Level objective
- **Player objective:** help Nasreen Khala decide which festival orders the workshop should make each day so that the festival gets the most value from limited materials.
- **Assessment objective:** six scored items in which the student chooses a set of orders that fits the material stock and reaches the **maximum** total value. Operational construct: *planning under resource constraints with simple arithmetic*. Correctness is defined (one best total); there is no time limit.

## 3. Story introduction
In the Town Square the caravan unloads crates. Nasreen Khala waves from the workshop door with a clipboard: "Rahyaab! The festival orders are piling up." → "We can't make everything — materials are limited." → "Each day, pick the orders that use our materials best. Let's practise one together."

## 4. Environment design
A warm, busy workshop: a cork **order board** with picture cards, **shelves** holding stacks of wood planks, metal sheets and cloth rolls (the stacks are the numbers — 1 plank = 1 unit), a **bench** with three-to-four empty tray spaces, a brass **bell** for "make these today", and a coin box. Through the window, the festival preparations in the square continue (progress visible).

## 5. Map layout
Short walk-in (door → counter, 3 tiles) then the full-screen planning board (sketch in `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §5). Order cards in one row (scrollable horizontally if 6 cards), bench below, shelves below the bench, controls at the bottom (thumb zone).

## 6. Character movement
Walk-in only. On the planning board the player character stands at the side of the bench and reacts (looks at the card being dragged; claps when the bell rings).

## 7. Interactive objects

| Object | Interaction | Response |
|---|---|---|
| Order card | Drag to the bench (or tap card, tap bench) | Card moves; **material stacks show a shadow of what this order would use**; if not enough, the card shakes and the missing material is outlined in red **with an icon** (not colour alone); planned coins update |
| Card on the bench | Drag back to the board (or tap) | Materials return |
| Material stacks | Look (tap) | Number shown: "Wood: 3 left of 8" |
| Hint feather | Tap | Chakor gives the item hint (existing hints, e.g., "Try the pair of orders that uses all 8 wood.") |
| Bell | Tap (enabled when ≥ 1 card planned and the plan fits) | Submits the plan |
| Skip | Tap | Item skipped; Nasreen Khala plans the day herself |

## 8. NPC interactions
- **Nasreen Khala:** introduces the practice day; after each scored day gives neutral feedback (below).
- **Customers:** after each day, one customer collects a finished item (flavour, same for all outcomes).
- **Chakor:** hint channel only.

## 9. Main mission
Plan the practice day plus **six festival days** (items wo1–wo6).

## 10. Optional missions
None (optional content during scored items would add noise). The hint is optional.

## 11. Exact gameplay mechanics
1. **Practice day** (`wo_practice`, stock wood 6, orders Stool 2→10, Shelf 4→18, Box 3→12): unlimited retries; Nasreen explains after each attempt; finger guide on the first drag.
2. **Day 1–6** (`wo1…wo6`, difficulty rising: 1 material → 2 materials → 3 materials; 4 → 6 order cards):
   1. `ITEM_PRESENTED` when the board appears.
   2. Student drags cards to the bench; stacks and coins update live.
   3. Ring the bell → `ITEM_RESPONSE` (first response only counts).
   4. **Story resolution:** the workshop makes whatever was planned (animation of the goods being built and stacked for the festival — the plan is always "useful").
   5. **Feedback panel:**
      - Correct: "That's the best plan — 46 coins of goods!"
      - Not the best: "Good plan — the best plan earns 52. Here's how:" (best set shown with the item's explanation).
      - Skipped: "Nasreen planned this one: …" (best set shown).
   6. Next day.
3. After day 6: the stack of festival goods is complete → map piece 3 → journal page.

## 12. Player decisions
Which orders to plan (the answer); whether to use the hint; whether to skip. There are no interest or personality choices in this level.

## 13. Challenge and difficulty progression

| Item | Materials | Cards | What makes it harder |
|---|---|---|---|
| wo1 | wood 8 | 4 | One constraint; the best pair uses all wood |
| wo2 | wood 9, metal 4 | 4 | Biggest order is not part of the best plan |
| wo3 | wood 10, metal 6 | 5 | Three orders must share metal |
| wo4 | wood 12, metal 7, cloth 6 | 6 | Three materials; best plan uses all wood and metal |
| wo5 | wood 10, metal 6, cloth 5 | 6 | Cloth constraint decides between two good options |
| wo6 | wood 11, metal 6, cloth 6 | 6 | The most valuable single order is a trap |

Order is **provisional** and must be re-ordered by pilot p-values (existing note in `workshopOrders.ts`).

## 14. Rewards
2 coins per attempted scored day (correct, not best, or skipped — identical), 20 coins for the level, map piece 3, stamp 3. The festival-goods stack grows equally for every outcome.

## 15. Completion conditions
Practice + six days answered or skipped.

## 16. Failure and retry behaviour
- **Practice:** unlimited retries.
- **Scored days:** one attempt; no retry (re-submission after feedback is ignored by scoring — existing rule). The story always continues.
- **Leaving mid-level:** saved; resumes at the same day. An item that was presented but not answered before an app kill is presented again (its first *response* is what counts).

## 17. Assessment signals collected

| Event (existing) | Data | Use |
|---|---|---|
| `ITEM_PRESENTED` | item_id, family `planning_numerical`, version, difficulty, practice | Item exposure |
| `ITEM_RESPONSE` | response (chosen order IDs), correct, attempt, hints_used, response_time_ms | Ability count (first response); time stored, **not scored** |
| `HINT_USED` | item_id | Reported as "solved without hints" alongside the main count |
| `RESEARCH_SIGNAL {signal_id: "persistence", item_id, ms_before_skip_or_hint, plan_changes}` **[A]** | per item | Research only: Conscientiousness indicator C-2 |
| `BIG5_RESPONSE` | Journal: mi07, mi13 | Big Five questionnaire |

Ability result (existing): "Planning with numbers: you solved 4 of 6 (3 without hints)" — no band, no percentile; ≥ 4 attempted or "not enough puzzles were tried".

## 18. What the system can and cannot conclude
- **Can:** how many of these six planning problems the student solved today, with and without hints.
- **Cannot:** general mathematical ability, school performance, or "planning personality". Results depend on reading the cards, familiarity with this kind of puzzle, and the day's conditions. No norms exist; the six items have not yet been calibrated. Response time is *not* used (slow phones, reading speed).

## Journal page after this stop
**mi07** "I am not really interested in others." · **mi13** "I like order."

## Changes from the current build
| Current | Proposed |
|---|---|
| Order list with check boxes and totals | Order board + bench + shelves with material shadows |
| Feedback sheet only | The workshop builds the plan; feedback shown in the world |
| — | Persistence research signal (not scored) |
