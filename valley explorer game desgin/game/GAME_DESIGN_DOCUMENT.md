# Valley Explorer — Game Design Document (master)

**Version:** 1.0 design proposal · 19 Nov 2026 · **Status:** for review; nothing here is implemented yet unless marked "existing".
This is the master document. It contains (1) the audit of the existing implementation, (2) the core game design, and (3) pointers to the detailed documents.

---

## Part A — Audit of the existing project (Phase 1)

### A.1 What was inspected

| Area | Files inspected (React Native project unless stated) |
|---|---|
| Journey and levels | `src/valley/core/journey.ts`, `core/levels/*.ts` (pure state machines), `levels/*.tsx` |
| World and controls | `game/engine/{tilemap.ts, World.tsx, TileLayer.tsx, Avatar.tsx, sprites.tsx}`, `game/maps.ts`, `game/ValleyWorld.tsx` |
| Mini-games | `game/minigames/{kinds.ts, MiniGameStage.tsx, items.tsx}`, `core/tasks.ts` |
| RIASEC | `core/riasec/{scoring.ts, units.ts, riasec_config.json}` (parity-tested port of the Python `analytics/riasec_scoring.py`) |
| Big Five | `core/bigfive/{items.ts, scoring.ts, journal.ts}`, `game/Journal.tsx`, `docs/BIG_FIVE.md` |
| Ability puzzles | `core/items/{workshopOrders, mapRoom, patternGate, vaultLocks}.ts`, `core/ability/scoring.ts` |
| Events, storage, sync | `contract/{events.ts, versions.ts}`, `services/{session, eventStore, sync, sinks, storage}.ts` |
| Results | `core/summary.ts`, `screens/Results.tsx`, `game/rewards.ts` |
| Backend (Python) | `analytics/event_schema.py`, `analytics/valley_bigfive.py`, `backend/routes/api.py`, `dashboard/templates/player.html` |
| Research documents | Phase 1 package (`literature_review.md`, `personality_indicator_matrix.md`, `riasec_assessment_design.md`, `pakistan_education_pathways.md`, validation and ethics documents) |
| Reports | `COMPLETION_REPORT.md`, `docs/{ARCHITECTURE, SCORING, INTEGRATION}.md` |

Quality gates at the time of inspection (from the 16 Nov report): 133 unit/UI tests, 162 Python tests and the backend integration test passing; scripted web play-through of the full journey with 0 errors. **Not yet verified:** on a physical Android phone.

### A.2 What already works — preserve

| Item | Why it should be preserved |
|---|---|
| **Pure level state machines** (`reduce(state, action) → {state, events}`) and `GameSession.commit` (atomic save of events + progress) | Clean separation of game logic from rendering; makes resume-after-kill and testing reliable. New levels should use the same pattern. |
| **Event contract** (`AssessmentEvent`, validation, `event_id` idempotency, `seq`) and **offline outbox + sync** | Correct foundations for research data; the backend already ingests it. Extend additively only. |
| **RIASEC scoring rule: preference + engagement only; completion and performance weight 0** | Directly implements "interest ≠ ability". Parity with the Python prototype keeps results comparable. |
| **Balanced offer design in the Caravan** (each type offered equally often, position recorded) | Required for fair preference measurement. |
| **Ability scoring rules** (first response counts; practice not scored; skip allowed; ≥ 4 attempted items or "insufficient evidence"; no norms, no bands, no IQ-like total) | Honest and defensible. |
| **Big Five from verbatim Mini-IPIP items, skip allowed, ≥ 3 of 4 items per trait, no coins for answers** | Keeps the personality result on a published instrument. |
| **Behaviour estimates kept research-only; E and A not estimated from RIASEC choices** | Avoids circular "agreement". |
| **Fair reward rules** (`game/rewards.ts`: same coins for every activity type, none for optional/bonus steps or correctness) | Rewards cannot bias evidence. |
| **Tile engine** (collision, reachability tests, camera), **D-pad + Action button**, **avatar creator**, tap-or-drag fallback in mini-games | Working, tested foundations for the larger world. |
| **Privacy design** (pseudonymous ID only, no names in events, cosmetic prefs never uploaded, local purge) | Required by the project's ethics rules. |

### A.3 What is incomplete

| Gap | Consequence |
|---|---|
| No physical-device testing of touch controls, drag, hold, swipe | Unknown usability on entry-level Android phones |
| No sound, music or haptics | World feels flat; no non-text feedback for weak readers |
| No read-aloud of text; English only | Reading load excludes weaker readers (Section 5 of `GAME_VISION.md`) |
| No story connecting the eight stops (each level has its own short intro) | The journey feels like a menu of tasks, not an adventure |
| Results show *fields* for interests but not Pakistani **pathways** (ICS, FSc, I.Com, FA, DAE …); RahYaab's pathway engine is specified (Phase 1) but not connected to the game's results | The student's question "what should I study next?" is not answered in the game flow |
| No validation data for any score (RIASEC game, ability items, behaviour signals) | All results are exploratory |
| Item difficulty orders are provisional | Puzzle progression may not rise smoothly |

### A.4 What is poorly designed

| Problem | Evidence from inspection | Why it matters |
|---|---|---|
| **The 18 "work" activities are the same three micro-actions** — every activity type is *tap ×3 → drag → hold* with different art (`kinds.ts`) | "Investigating" never involves investigating; "Creating" is three colour taps | Weak **content validity**: a student choosing *Investigative* does not experience investigative work, so engagement data says little about interest in that work; also repetitive |
| **Caravan: 10 identical forks** | Same screen pattern ten times | Boredom; later choices may become careless |
| **Puzzle levels are multiple-choice screens with a skin** (choose 1 of 4) | Map Room and Pattern Gate in particular | Exactly what the brief asks to avoid |
| **Journal is a separate form-like screen** | Works, but breaks the world | Feels like a questionnaire inserted into a game |
| **RIASEC engagement includes "dwell" (time spent ÷ expected time)** | `riasec_config.json` weight 0.10 | Time-based: slower readers/devices look "more engaged". Conflicts with "no speed-based scoring" |
| **Conscientiousness behaviour estimate reuses RIASEC engagement events** (optional steps, finishing) | `core/bigfive/scoring.ts` | Shared data → inflated, circular correlations between C and interest engagement |
| **Openness behaviour estimate uses activity variety**, which is the inverse of RIASEC differentiation | same | Circular with the interest profile |
| **Hub is a single vertical path with buildings** | `VALLEY_ROWS` 11×26 | Little to explore; landmarks have no purpose beyond being doors |
| **NPC–work associations are thin**: activities have places but no people | `core/tasks.ts` | Missed opportunity for characters and story; but also a risk if added carelessly (see NPC-liking confound in `RIASEC_ASSESSMENT_DESIGN.md`) |

### A.5 What should be redesigned

1. **Story spine and world** — one coherent quest across eight locations (this package).
2. **Interest activities** — six genuinely different *work-type mechanics* (assemble, investigate, compose, care, persuade, organise), each with 2–3 variants across levels, comparable in length and effort (`GAMEPLAY_AND_INTERACTION_SPECIFICATION.md`).
3. **Caravan** — fewer screens per fork, varied terrain, shorter work moments.
4. **Puzzle presentation** — environmental puzzles (place the piece in the torn map, set the stone in the sluice, plan on the workshop board), **keeping the existing item logic and scoring**.
5. **Journal presentation** — a rest moment in the world with Mehr and Chakor; **items unchanged**.
6. **Research behaviour signals** — new, separate opportunities that do not reuse RIASEC events (`BIG_FIVE_ASSESSMENT_DESIGN.md`).
7. **Results** — "Path Map" with four clearly separated sections and a hand-off to RahYaab pathways.

### A.6 What should be removed

| Remove | Reason |
|---|---|
| "Dwell time" component in RIASEC engagement **[A]** | Time-based; replace with the remaining engagement components (re-weighted) after checking parity impact |
| Openness "activity variety" and Conscientiousness "optional steps / finishing" behaviour estimates **[A]** | Circular with RIASEC (see A.4) — replaced by independent research signals |
| The identical tap/drag/hold template for all activity types | Replaced by distinct work mechanics |
| Separate full-screen "Level intro" card before every stop | Replaced by a short in-world arrival scene (NPC greets the student at the door) |

Nothing is deleted from the codebase by this document; these are proposals for the implementation phase.

---

## Part B — Core design

### B.1 Core loop

```
 ┌──────────── Explore the valley (walk, look, talk) ────────────┐
 │                                                                │
 ▼                                                                │
 Reach the next "!" location ─► Arrive: NPC sets a mission         │
        │                                                         │
        ▼                                                         │
 Do the mission: choose work / solve puzzles in the scene          │
        │                                                         │
        ▼                                                         │
 Mission done: map piece + stamp + coins (same for everyone)       │
        │                                                         │
        ▼                                                         │
 Rest moment: Pathfinder's Journal page (2–3 statements)  ─────────┘
```

Secondary loops: buy clothes at the Bazaar tailor with coins; find Chakor's feathers (optional collectible); look at curiosity spots (optional, unrewarded).

### B.2 Structure and session plan

| Chapter | Play order | Stops | Target time |
|---|---|---|---|
| Prologue | 0 | Opening, traveller creation, story intro | 3 min |
| **Chapter 1 — The Road to Rahwali** | 1–4 | Valley Gate · Crossroads Caravan · Workshop Orders · Makers' Hall | ≈ 25 min + journals |
| Night camp | — | Chapter break, everything saved; good stopping point for a class period | — |
| **Chapter 2 — Lanterns for the Festival** | 5–8 | Map Room · Pattern Gate · Riverside Park · Lantern Vault | ≈ 22 min + journals |
| Epilogue | — | Festival night, reflection, Path Map | 4 min |

Total ≈ 55 min including journals, designed for **two sittings** **[D]**. Any stop can be paused and resumed (existing behaviour).

### B.3 Level summary

| Doc | Level | Play order | Kind | Main mechanic | Evidence |
|---|---|---|---|---|---|
| L01 | Valley Gate | 1 | Context / tutorial | Walk, pick up, place, talk; repair the gate latch | None scored; research covariates (control familiarity), O curiosity spots |
| L02 | Crossroads Caravan | 2 | Interest | Walk up the road you choose at 10 forks; 30–40 s work moment at each stop | RIASEC preference (forced choice among 3) |
| L05 | Workshop Orders | 3 | Ability: planning & numbers | Drag order cards onto today's workbench; materials deplete visibly | 6 scored items |
| L03 | Makers' Hall | 4 | Interest | Spend 10 time-candles at six benches; deeper 60–90 s activities; revisit allowed | RIASEC preference + engagement (strongest evidence) |
| L06 | Map Room | 5 | Ability: spatial | Drop the right fragment into the torn map (fragments cannot be rotated) | 6 scored items |
| L07 | Pattern Gate | 6 | Ability: abstract | Set the next carved stone in the sluice and turn the wheel | 6 scored items |
| L04 | Riverside Park | 7 | Interest | Choose a festival role; answer requests at six sites over three phases | RIASEC preference + declared role |
| L08 | Lantern Vault | 8 | Ability: logical | Swipe code dials using the keeper's clue notes; pull the lever | 6 scored items |

### B.4 Progression and unlocking

- Stops unlock in play order; the next stop shows a bouncing "!" and a path glow. Completed stops stay visitable (to see the NPC, the stamp, and change clothes) but **cannot be replayed for assessment** (replays would change evidence) **[D]**.
- Each stop awards: **1 map piece** (assembles the Path Map), **1 Pathfinder stamp**, coins by the fair rules.
- Fast-travel signposts unlock in the hub once a district has been visited (reduces walking after Chapter 1).
- Chapter 2 begins only after the Night camp scene, but the student may play straight on.

### B.5 Rewards economy (fair by construction)

| Source | Coins | Rule |
|---|---|---|
| Finish a stop | 20 | Same for all stops |
| Finish an interest activity / work moment | 3 | Same for all six types; nothing for optional extras or bonus rounds |
| Attempt a scored puzzle (answer or skip) | 2 | Same for right, wrong or skipped; nothing for practice |
| Journal statements | 0 | Prevents rushing |
| Chakor's feathers (8) | 0 | Feathers unlock a cosmetic (Chakor's scarf) only |

Spend: Bazaar tailor (clothes colours, caps, scarves, festival accessories). All cosmetic; no gameplay advantage. Existing rule set (`game/rewards.ts`) already implements the coin part.

### B.6 What is measured where

| Stream | Levels | Shown to student | Sent to RahYaab | Detailed in |
|---|---|---|---|---|
| RIASEC interests | L02, L03, L04 | Yes (top interests, plain words) | Yes | `RIASEC_ASSESSMENT_DESIGN.md` |
| Big Five (Mini-IPIP self-report) | Journal after every stop | Yes (one kind sentence per trait) | Yes (questionnaire only) | `BIG_FIVE_ASSESSMENT_DESIGN.md` |
| Problem-solving counts | L05–L08 | Yes ("you solved 4 of 6") | Yes | level docs L05–L08 |
| Behaviour signals | L01, L03, L04, L05–L08 | **No** | Research data only | `BIG_FIVE_ASSESSMENT_DESIGN.md` §4 |
| Covariates (control familiarity, device, reading support use) | All | No | Research data only | `VALIDATION_AND_RESEARCH_PLAN.md` |

### B.7 Non-negotiable fairness rules

1. No timers anywhere; response times are stored as raw research data and never scored for students.
2. No progress gate depends on a correct answer: unsolved puzzles are resolved by the story (the keeper uses the master key; Mehr fills the gap) and the student continues.
3. Interest activities cannot be failed; every activity type has the same number of required actions (± 1) and the same expected duration (± 15%) — verified in the pilot.
4. Rewards identical across choices (B.5).
5. No gendered defaults: the first avatar shown is chosen at random among styles; NPC roles counter-stereotyped.
6. Every instruction has an icon and read-aloud; colour is never the only cue.

---

## Part C — Document map

| Topic | Document |
|---|---|
| Vision, audience, orientation | `GAME_VISION.md` |
| Story, world, chapters | `WORLD_AND_STORY_DESIGN.md` |
| Player character, NPCs, companion | `CHARACTER_AND_NPC_DESIGN.md` |
| Hub map and scene layouts | `WORLD_MAP_AND_LEVEL_LAYOUTS.md` |
| Each level in detail | `LEVEL_01_…` to `LEVEL_08_…` |
| Big Five, RIASEC, career mapping | `BIG_FIVE_ASSESSMENT_DESIGN.md`, `RIASEC_ASSESSMENT_DESIGN.md`, `ASSESSMENT_TO_CAREER_MAPPING.md` |
| Screens, flows | `UI_UX_DESIGN_SPECIFICATION.md` |
| Art | `VISUAL_ART_DIRECTION.md` |
| Controls, interaction primitives, mini-game catalogue | `GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` |
| Architecture (no code) | `TECHNICAL_ARCHITECTURE.md` |
| Studies and validation | `VALIDATION_AND_RESEARCH_PLAN.md` |
| Decisions needing approval, open questions, design review | `DESIGN_DECISIONS_AND_OPEN_QUESTIONS.md` |
