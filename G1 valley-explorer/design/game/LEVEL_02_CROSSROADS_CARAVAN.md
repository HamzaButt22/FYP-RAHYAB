# Level 02 — Crossroads Caravan

| Field | Value |
|---|---|
| Level ID (code) | `crossroads_caravan` (existing) |
| Play order | 2 of 8 · Chapter 1 |
| Kind | **Interest (RIASEC)** — forced choice among three kinds of work at each of 10 forks |
| Location | Caravan Road (`WORLD_AND_STORY_DESIGN.md` §5.2; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §4) |
| Target duration | 8 min (10 forks × ≈ 45 s) |
| Characters | Uncle Faraz (driver), the six makers as work hosts, travellers |
| Preserved | The **balanced incomplete block design** (6 types, 10 stops, 3 roads, each type offered 5 times, each pair together twice — `core/caravan.ts`), randomised type order and road position, the "make camp" option (decline), `ROUTE_CHOICE` events with position, the six caravan task IDs and RIASEC weights |
| Changed | Terrain varies every two forks; each road end shows the work clearly; the job becomes a 30–40 s **work moment** with a type-specific mechanic and two variants per type (`GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5.1) |

---

## 1. Level name
**Crossroads Caravan** — "Pick any road. No road is wrong."

## 2. Level objective
- **Player objective:** ride with the caravan from the valley gate to Rahwali town, helping out along the way.
- **Assessment objective:** obtain **10 forced choices** among three kinds of work, with every kind offered equally often and in balanced positions. This is the cleanest *preference* evidence in the game, because the options are equally rewarded, equally distant and chosen before the work starts.

## 3. Story introduction
In the hub, the "!" sits on a painted wagon at the town road. Uncle Faraz: "Going to town? Hop on!" → "The road splits a lot. At every fork, people need a hand." → "Take any road you like. I'll wait for you at the other end." The wagon rolls; the scene fades to Fork 1 (orchard).

## 4. Environment design
Ten small fork scenes with five terrain themes (two forks each): **apricot orchard** (blossom, beehives), **river ford** (stepping stones), **pine slope** (woodpile, cones), **bazaar edge** (stalls, awnings), **meadow before town** (poplars, stone benches). The road splits into three paths fanning upward. At each road end stands a **painted signpost** with a large work icon and a verb (e.g., 🔧 "Fix", 🔬 "Test", 🎨 "Paint", 🤝 "Help", 📣 "Persuade", 🗂 "Sort"). The maker who hosts the work stands *behind* the signpost, smaller. A rest tent sits to the right of the start point.

## 5. Map layout
9 × 9 per fork. Start (wagon) bottom centre; three road ends at the top-left, top-centre and top-right, **each exactly 4 steps from the start**; the tent 3 steps to the right. The position (left/centre/right) of each type follows the existing balanced, shuffled route; the position chosen is logged.

## 6. Character movement
Free movement in the fork scene. A choice is made by **walking onto a road end** (existing trigger `road:i`), not by tapping a button — choosing feels like going somewhere. Tap-to-walk is allowed (tapping a road end still requires the walk). To prevent accidental choices, stepping onto a road end shows a 1-second "Heading to *Fix the cart wheel*…" banner with a small "Back" button before the work begins **[D]**; going back is logged (`ROUTE_CHOICE` is emitted only when the work starts).

## 7. Interactive objects

| Object | Action | Response |
|---|---|---|
| Road end ×3 | Walk onto it | Banner → work moment for that type |
| Signpost | Read (Action) | One line about the work: "Rabia's cart has a broken wheel." Logged as `RESEARCH_SIGNAL {signal_id: "preview_read"}` (helps interpret choices; not scored) |
| Rest tent | Rest | Choose *not* to work at this fork ("make camp", existing position 3). Faraz: "A good rest. On we go." |
| Uncle Faraz | Talk | Reminder: "Any road is fine." |

## 8. NPC interactions
- **Makers** (work hosts): one greeting line at the start of the work moment and the **same** thank-you line structure at the end ("Thank you — that really helped."). Hosts never comment on the choice itself.
- **Faraz**: only neutral reminders.
- **Chakor** is hidden on the wagon during forks (no nudging).

## 9. Main mission
Reach Rahwali town: pass all 10 forks (each by choosing a road and doing the work moment, or by resting).

## 10. Optional missions
None. Optional content here would compete with the choice and add noise. (Each work moment has one optional extra step — that is part of the activity, not a side mission.)

## 11. Exact gameplay mechanics (flow per fork)
1. Fork scene appears; Faraz line on Fork 1 only (others: a short terrain caption, e.g., "The river ford").
2. Player walks onto a road end → 1 s banner (with Back).
3. **Work moment** (≈ 30–40 s) opens as an overlay in the Activity Stage: maker line → 4 required steps → optional extra appears as a ★ chip after the required steps → **Finish** (or **Leave** at any time).
   - Variant rule: each type has two variants (A/B, e.g., W-R1 cart wheel / W-R2 field gate) alternated across its 5 offers.
4. Return to the wagon; it rolls forward; route line grows on the mini-map (fork *n*/10).
5. After fork 10: arrival in Rahwali Town Square; map piece 2; journal page.

If the player rests at the tent: Faraz line, the wagon moves on (no work moment).

## 12. Player decisions

| Decision | Options | Evidence |
|---|---|---|
| Which road at each fork | 3 work types (balanced) or rest | RIASEC preference (forced choice among the three offered) |
| Whether to do the optional extra | Do it / Finish without it | RIASEC engagement (optional share) |
| Whether to finish or leave a work moment | Finish / Leave | RIASEC engagement (persist) |
| Whether to read signposts before choosing | Read / don't | Context only (preview behaviour) |

## 13. Challenge and difficulty progression
None in the ability sense. Variety comes from terrain and the alternating variants. Fork 1's work moment shows finger-animation guides for each primitive used; later forks do not.

## 14. Rewards
3 coins per finished work moment (any type), 20 coins for finishing the level, map piece 2, stamp 2. Resting earns nothing and costs nothing. Optional extras earn nothing (existing fair rules).

## 15. Completion conditions
All 10 forks passed. The current scoring requires ≥ 3 selections per interest level for that level to count (`min_selections_per_level: 3`); a student who rests at 8+ forks completes the level but the Caravan contributes "insufficient evidence".

## 16. Failure and retry behaviour
No failure. Leaving a work moment returns to the next fork (existing `LEAVE_JOB`). Forks cannot be replayed (the choice is the evidence). App kill → resume at the same fork, or inside the work moment with steps done so far (existing behaviour).

## 17. Assessment signals collected

| Event (existing unless marked) | Data | Use |
|---|---|---|
| `ROUTE_CHOICE` | stop_index, offered (3 task IDs), chosen, position (0–2 or 3 = rest) | RIASEC preference; position-bias check |
| `ACTIVITY_START / STEP / END` | task_id, round, step_id, optional, outcome, required/optional counts, engaged_ms, expected_ms, **+ `variant` (new field, additive) [A]** | RIASEC engagement; variant balance check |
| `RESEARCH_SIGNAL {preview_read}` **[A]** | which signposts were read before choosing | Research context |
| `BIG5_RESPONSE` | Journal: mi03, mi01, mi09 | Big Five questionnaire |

RIASEC scoring for this level is unchanged except for the proposed removal of the time-based "dwell" component (decision D-07, `DESIGN_DECISIONS_AND_OPEN_QUESTIONS.md`).

## 18. What the system can and cannot conclude
- **Can:** which kinds of work the student *chose more often than chance* when each kind was offered equally often, and whether they tended to finish and go deeper in the work they chose.
- **Cannot:**
  - whether the student is *good* at that work (activities cannot be failed; performance carries weight 0);
  - whether the choice reflects the work or something else — e.g., liking a maker, the look of a signpost, wanting a change after the previous fork, or a habit of always taking the left road. Mitigations: equal exposure of makers, work-first signposts, balanced positions, variant alternation, position logging; residual effects are checked in the pilot (`VALIDATION_AND_RESEARCH_PLAN.md` H-R3);
  - real-world career preference: these are short, simplified versions of work; results are a starting point for exploration.

## Journal page after this stop
**mi03** "I get chores done right away." · **mi01** "I am the life of the party." (gloss: party can be a family gathering or wedding) · **mi09** "I am relaxed most of the time."

## Changes from the current build
| Current | Proposed | Why |
|---|---|---|
| 10 visually identical forks | 5 terrain themes | Reduce boredom (P5) |
| Job = generic tap/drag/hold | Type-specific work moment, 2 variants per type | Content validity; variety |
| Road ends show small icons | Big work icon + verb signposts; maker behind | Choose the work, not the person |
| Stepping on a road immediately chooses | 1 s banner with Back | Prevent accidental choices (data quality) |
