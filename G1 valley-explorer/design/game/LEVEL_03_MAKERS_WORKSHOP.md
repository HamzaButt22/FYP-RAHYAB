# Level 03 — The Makers' Hall (Open Day)

| Field | Value |
|---|---|
| Level ID (code) | `career_workshop` (existing) |
| Play order | 4 of 8 · Chapter 1 (last stop before the Night camp) |
| Kind | **Interest (RIASEC)** — free allocation of a limited time budget across six benches |
| Location | Makers' Hall (`WORLD_AND_STORY_DESIGN.md` §5.4; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §6) |
| Target duration | 8 min |
| Characters | The six makers, Ustad Mehr at the door |
| Preserved | Time budget of **10 blocks** (each activity costs 2, a bonus round 1), up to **3 visits per bench**, at least **3 activities** before leaving, bonus offer, `ACTIVITY_*` events, workshop task IDs and RIASEC weights (`core/levels/interestLevels.ts`) |
| Changed | Blocks shown as **candles**; six deeper 60–90 s activities with distinct mechanics (`GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5.2); bench positions randomised; tidy-up research opportunity |

---

## 1. Level name
**The Makers' Hall** — "Spend your day where you like."

## 2. Level objective
- **Player objective:** enjoy the Makers' Hall open day — try the trades, help the makers finish festival work, and leave when the candles burn down (or earlier).
- **Assessment objective:** the **strongest interest evidence** in the game. Unlike the Caravan (choice among 3), here every type is available at once and the student must *allocate* a scarce resource. Returning to the same bench (revisit), taking bonus rounds and doing optional steps show depth of interest.

## 3. Story introduction
The caravan has delivered the festival goods (Workshop Orders). Mehr waits at the Makers' Hall door with a candle stand: "Today the makers open their hall to young people." → "You have ten candles of time. Each job uses two." → "Work wherever you like — the same bench again, or a new one. Leave by this door when you're done." (The candle stand lights up; a small card shows the rules with icons.)

## 4. Environment design
A long timber hall with high windows and festival bunting. Six benches line the walls, each with a distinct colour, tools and a maker:
- **Water pump bench** (Rabia, R) — pipes, wrenches, a half-assembled pump;
- **Garden lab** (Dr Zoya, I) — two potted bean plants, a lamp, a notebook, a measuring stick;
- **Poster studio** (Danish, A) — stamps, paint pots, a print press;
- **Study corner** (Usman, S) — a small desk, a younger student with a timetable, tea;
- **Open-day stall** (Sana, E) — a stall frame, pitch cards, a volunteer sign-up board;
- **Records office** (Ammar, C) — drawers, a box of visitor forms, stamps.
A **display wall** near the door fills with the student's finished work (a fixed pump, a poster, a filed drawer…). Ambient: chatter, tools, a kettle.

## 5. Map layout
17 × 10 tiles. Six bench slots (three top, three bottom) at equal walking distance (± 1 tile) from the centre; **each student gets a random assignment of benches to slots** (logged) so that "closest to the door" is not always the same type. Door bottom centre; candle stand beside the door.

## 6. Character movement
Free walking; Action "Work here" at a bench. Makers turn to face the player when within 2 tiles and wave (same animation for all).

## 7. Interactive objects

| Object | Action | Response |
|---|---|---|
| Bench ×6 | Work here | Opens the bench activity (Activity Stage). Blocked with a kind message if 3 visits reached or < 2 candles left |
| Maker ×6 | Talk | One line about the work, e.g., Zoya: "We test ideas to find out why things happen." (same length for all) |
| Candle stand | Look | "Candles left: 6. A job uses 2; a bonus round uses 1." |
| Tool rack ×6 (behind each bench) | Tidy (only after that bench's activity) | Tools return to the rack outline (research signal C-1). No reward, no message beyond a soft click |
| Display wall | Look | Shows the work finished today |
| Door | Close for the day | Allowed after ≥ 3 activities; otherwise Mehr: "Try at least 3 activities before you go (2 so far)." |

## 8. NPC interactions
- Each maker greets when the student starts their activity, gives the goal in one line, and thanks the student at the end with the shared thank-you structure.
- **Bonus offer** (existing): "One more round? It uses one candle." Two equal buttons: **Yes, one more** / **No thanks**.
- Mehr at the door explains rules on entry and only speaks again if the student tries to leave too early or runs out of candles ("Your candles are used up — the open day is over. Head for the door!").

## 9. Main mission
**Spend the open day:** do at least 3 activities and then close the day (or use all 10 candles).

## 10. Optional missions
- **Bonus rounds** at any bench (1 candle each, offered after finishing).
- **Optional steps** inside activities (2 per activity, shown as ★ chips).
- **Tidy the tools** after an activity (never mentioned; research only).

## 11. Exact gameplay mechanics
1. Enter → Mehr's rules → candle stand lights (10).
2. Walk to any bench → **Work here** → 1 candle goes out (existing `PICK` costs 1 block).
3. Bench activity (60–90 s; see catalogue): 6 required steps → **Finish** becomes active; 2 optional ★ steps available.
4. **Finish** → 1 more candle goes out (existing `FINISH_JOB` costs 1) → finished item appears on the display wall → bonus offer.
   - **Leave** mid-activity is always allowed; the candle used to start is not returned (existing rule).
5. After the activity, the tools stay on the bench. The student may tidy them (3 taps) or walk away.
6. Repeat until the student closes the day (≥ 3 activities) or runs out of candles.
7. Close → map piece 4 → **Night camp** scene (chapter break). At the camp the student chooses where to sit: at the **big fire with the travellers** (music, stories) or at the **small fire with Mehr** (quiet, stars). Both lead to the same journal page and the same chapter-break save; the choice is research signal E-1 (`BIG_FIVE_ASSESSMENT_DESIGN.md` §4) and is never scored or mentioned.

Activity catalogue summary (`GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5.2):

| Bench | Mechanic | Required steps (6) |
|---|---|---|
| Water pump (R) | Assemble & fix | Drag 4 pipe sections; bolt (tap ×2); hold to pump |
| Garden lab (I) | Observe & test | Set light/shade; water; advance 3 days; record observation |
| Poster studio (A) | Compose & decorate | Background, 3 stamps, title style, colour, print |
| Study corner (S) | Listen & care | Listen; place 3 subjects in the timetable as asked; encourage; listen |
| Open-day stall (E) | Persuade & organise people | Greet; choose 2 pitch cards; assign 2 volunteers; handshake; open stall |
| Records office (C) | Sort & record | File 6 forms by month; stamp done |

Second and third visits to the same bench use a **variant** of the activity (e.g., the R bench's second visit is an older pump with a different pipe layout) so a revisit is a choice to do *more of this kind of work*, not to repeat the identical screen.

## 12. Player decisions

| Decision | Evidence |
|---|---|
| Which bench first and which next | RIASEC preference (selection share; first choice recorded) |
| Whether to return to a bench (2nd/3rd visit) | Strong preference signal (revisit) |
| Whether to accept a bonus round | Engagement (bonus) |
| Whether to do optional steps | Engagement (optional share) |
| Whether to leave an activity | Engagement (persist) |
| When to close the day | Context (total activities) |
| Whether to tidy tools | Research only (C-1) |

## 13. Challenge and difficulty progression
No ability challenge. The only "challenge" is the trade-off: 10 candles allow at most 5 activities (or fewer with bonus rounds), so the student cannot do everything — which is what makes the choices informative. Activities are equal in length and steps (± 15% expected time, checked in the pilot).

## 14. Rewards
3 coins per finished activity (any bench; bonus rounds and optional steps earn nothing), 20 coins for the level, map piece 4, stamp 4. Finished work on the display wall is the visible reward and looks equally impressive for every bench (each produces one display object of the same size).

## 15. Completion conditions
Day closed via the door with ≥ 3 activities, or candles exhausted. (A student who leaves activities repeatedly can run out of candles with fewer than 3 finished; the level still completes and the scoring decides whether there is enough evidence.)

## 16. Failure and retry behaviour
No failure. Mistakes inside activities bounce back with a hint (logged as performance, weight 0). App kill → resume with candles, visits and any activity in progress (existing).

## 17. Assessment signals collected

| Event | Data | Use |
|---|---|---|
| `ACTIVITY_CHOICE` / `ACTIVITY_START` / `ACTIVITY_STEP` / `ACTIVITY_END` (existing) | task_id, round, steps, optional counts, outcome | RIASEC preference and engagement |
| `ACTIVITY_END` additive fields **[A]** | `variant`, `bench_slot` (position) | Balance and position-bias checks |
| Bonus (existing, within `ACTIVITY_END`/bonus state) | taken yes/no | Engagement (bonus) |
| `RESEARCH_SIGNAL {tools_tidied, task_id, tidied: 0–3}` **[A]** | After each activity | Research only: Conscientiousness indicator C-1 |
| `RESEARCH_SIGNAL {night_camp_seat: big_fire or small_fire}` **[A]** | Night camp | Research only: Extraversion indicator E-1 |
| `BIG5_RESPONSE` | Journal (at Night camp): mi11, mi20, mi14 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** where the student chose to spend limited time when all six kinds of work were available, which kinds they returned to, and how deeply they engaged — the core of the RIASEC result.
- **Cannot:** skill at the work (no performance weight), long-term interest (one session), or reasons for choices (could be novelty, liking the look of a bench, wanting to finish quickly, or the previous Caravan experience). Tidy-up behaviour might reflect orderliness, but also gaming habits ("click everything"), wanting to please the observer, or simply noticing the outline — therefore research-only.

## Journal page after this stop (at the Night camp fire)
**mi11** "I talk to a lot of different people at parties." · **mi20** "I do not have a good imagination." · **mi14** "I get upset easily."

## Changes from the current build
| Current | Proposed | Why |
|---|---|---|
| Blocks shown as dots | Candles burning down | Concrete, story-based time budget |
| Generic tap/drag/hold per bench | Six distinct 60–90 s activities, with variants on revisits | Content validity, variety |
| Fixed bench layout | Random bench-to-slot assignment (logged) | Remove position bias |
| No visible outcome | Display wall of finished work (equal for all types) | Satisfying, fair feedback |
| — | Tidy-up opportunity | Independent C research signal (not from RIASEC events) |
