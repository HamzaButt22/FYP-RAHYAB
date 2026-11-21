# Technical Architecture (design only — no implementation)

**Version:** 1.0 design proposal · 19 Nov 2026
**Baseline:** the existing Expo SDK 58 / React Native 0.88 / TypeScript project (`src/valley/…`). This document describes how the proposed design fits that architecture, what is reused, what is added, and which changes need approval. **No code is written in this phase.**

---

## 1. Principles

1. **Preserve the contracts.** The event contract (`contract/events.ts`), session/commit/sync services, sinks, `AssessmentOutput`, RIASEC parity with Python, and the backend API are kept; all changes are **additive** and versioned.
2. **Logic is pure, rendering is thin.** Every level remains a pure state machine (`reduce(state, action, ctx) → {state, events, complete}`); scenes, activities and puzzles render state and dispatch actions.
3. **Content is data.** Maps, objects, activities, journal pages, puzzle items and dialogue are data files that can be reviewed, tested and versioned.
4. **Runs in Expo Go and on low-end Android.** Only modules included in Expo Go are planned unless approved otherwise.
5. **Offline first.** Everything works without a network; uploads happen later.

## 2. Layered structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ Host integration   adapter.ts (RahYaabHostAdapter) · index.ts         │  existing
├──────────────────────────────────────────────────────────────────────┤
│ App shell          ValleyExplorer.tsx: view router, consent gate,     │  existing (extended)
│                    prefs/settings, coins, resume                      │
├──────────────────────────────────────────────────────────────────────┤
│ Presentation       game/engine (World, TileLayer, Avatar, sprites)    │  existing (extended)
│                    game/scenes/* (hub, level scenes)                  │  NEW (data-driven)
│                    game/activity (ActivityStage, primitives)          │  NEW (generalises MiniGameStage)
│                    game/puzzles (board, map table, sluice, door)      │  NEW (wrap existing item logic)
│                    game/Journal, Hud, AvatarCreator, Tailor, Settings │  existing + NEW
│                    screens/ (Results → Path Map, Reflection)          │  existing (extended)
├──────────────────────────────────────────────────────────────────────┤
│ Content (data)     content/maps, content/scenes, content/activities,  │  NEW
│                    content/dialogue, content/cosmetics                │
│                    core/items/*, core/bigfive/items.ts, tasks.ts      │  existing
├──────────────────────────────────────────────────────────────────────┤
│ Core logic (pure)  core/levels/* machines, core/riasec, core/ability, │  existing
│                    core/bigfive, core/summary, core/progress          │
│                    core/research (research-signal builders)           │  NEW
├──────────────────────────────────────────────────────────────────────┤
│ Services           session (commit), eventStore, storage, sync, sinks │  existing
│                    audio + speech service                             │  NEW
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Component structure (proposed)

| Component | Responsibility | Status |
|---|---|---|
| `ValleyExplorer` | Root: consent check, session open, view routing (title, creator, world, level, journal, night camp, epilogue, results), prefs, coins | Existing — add views: title, night camp, epilogue, tailor, settings |
| `SceneHost` | Loads a scene definition (map + objects + NPCs + triggers) for the hub or a level; owns camera, input, dialogue queue | NEW (generalises `ValleyWorld`, `CaravanLevel`, `WorkshopLevel`, `ParkLevel` world parts) |
| `World` | Tile rendering, character, camera, D-pad, Action button | Existing — add tap-to-walk, carry slot, NPC facing |
| `DialogueLayer` | Bubbles, portraits, read-aloud, queue (≤ 3) | NEW (extracts message handling from `World`) |
| `ActivityStage` | Renders an activity spec using interaction primitives; emits step/finish/leave | NEW (generalises `MiniGameStage`) |
| `primitives/*` | Drag (with tap fallback), Tap, Hold, Swipe, Paint, Sort, Connect, Toggle, Order | Existing drag/tap/hold/paint + NEW |
| `PuzzleScene` frames | OrdersBoard, MapTable, Sluice, VaultDoor — wrap the existing item logic and `AbilityFrame` rules | NEW presentation; existing logic |
| `Journal` | Journal page | Existing — new notebook frame and rest-spot entry |
| `PathMap` | Results header map + existing result sections + pathways link | Existing `Results` extended |
| `Tailor`, `Settings`, `QuestMap` | Cosmetics shop, settings, full-screen map | NEW |

## 4. Game state management

| State | Where it lives | Persisted? |
|---|---|---|
| Journey progress (completed stops, active level) | `JourneyState` in `GameSession` | Yes (existing, atomic with events) |
| Level state (fork index, candles, shift, puzzle index, job in progress) | Each level machine's state in `journey.levelStates` | Yes (existing) |
| Scene state (player position/facing in the current scene, picked-up item, NPC talked-to flags) | `SceneHost` local state; **checkpointed** to prefs on scene exit and every N steps | Yes, as cosmetic prefs (not assessment data) |
| Hub position, avatar look, settings, cosmetics owned, feathers | `ve:prefs:<studentId>` (existing key; extended) | Yes, local only, never uploaded |
| Coins | Derived from events (`game/rewards.ts`) | Derived (existing) |
| Assessment events | Event store (outbox) | Yes; uploaded |

Rule: anything that affects assessment is a **machine action** that produces events in the same commit as the state change; anything purely cosmetic or navigational stays in prefs. This preserves the existing guarantee that progress and evidence can never disagree after a crash.

New machines needed (pure, tested like the existing ones):
- L01 latch mission state (parts placed) — extends `valleyGate`.
- Caravan: add `variant` to job state (A/B) — additive.
- Makers' Hall: bench slot assignment (seeded), revisit variant index — additive.
- Park: site slot and role-order assignment (seeded), phase task variant — additive.
- Puzzle levels: unchanged machines; new presentation only.

## 5. Movement, collision and interaction

| System | Design |
|---|---|
| Grid movement | Existing `tilemap.step()` with walkable/blocking characters; 150 ms step animation; hold-to-repeat 175 ms |
| Collision | Tile-based (existing); NPCs and solid objects occupy tiles; no physics engine needed |
| Tap-to-walk **[A]** | Breadth-first search on the walkable grid (the engine already has `reachable/canReach`); path executed step by step through the same `step()` function so triggers fire identically; cancelled by any D-pad input |
| Triggers | Objects with `trigger: true` fire on entry (existing — used for Caravan road ends); add a 1 s confirm banner for choice triggers |
| Interaction | Existing `interactable()` picks the faced tile, then neighbours, then own tile; each object declares `{ verb, enabled, onAction }`; the Action button label = verb |
| Carry system | Single carry slot in scene state; `Place` enabled on slots that accept the carried item type |
| Camera | Existing clamped camera; add look-ahead of 1 tile in walking direction |
| Reachability tests | Existing test pattern extended to every scene: all objects reachable; option equidistance check for interest scenes (±1 tile) |

## 6. Mini-game (activity) architecture

```
ActivitySpec (data)                            ActivityStage (component)
{ id, taskId, type: 'R'…'C', variant,          ├─ renders backdrop + targets from spec
  backdrop, targets[], items[],                ├─ current step = first unfinished required step
  required: Step[], optional: Step[],          ├─ step → primitive component (drag/tap/hold/…)
  expectedMs, maker, goalLine }                ├─ on step done → dispatch {STEP, stepId}
Step = { id, primitive, params, hint }         ├─ Finish enabled when all required done
                                               └─ Leave always enabled → dispatch {LEAVE_JOB}
```
- The level machines keep owning jobs (`startJob`, `jobStepEvent`, `canFinish`); `ActivityStage` only maps UI completion to `STEP` actions — exactly as `MiniGameStage` does today.
- Balance checks are automated: a test asserts every activity in a level has the same number of required steps (±1) and the same `expectedMs` (±15%).
- New primitives are small, independent components with an accessibility label, a tap fallback and a reduced-motion variant.

## 7. Level and scene management

- `JOURNEY` (existing) stays the source of truth for order, kind and family. Play order remains as implemented (D-01).
- Each level gets a **scene definition** file: map rows, objects, NPCs, dialogue IDs, rest-spot position, entry/exit points.
- The hub scene unlocks districts based on `journey.completed` (existing `valleyMap(journey, …)` pattern).
- Chapter break: a non-assessment "night camp" scene shown after stop 4 completes (state: shown/not shown in prefs).

## 8. Assessment event collection

### 8.1 Unchanged
`SESSION_*`, `LEVEL_*`, `EXPLORATION`, `ROUTE_CHOICE`, `ACTIVITY_*`, `ROLE_*`, `ITEM_*`, `HINT_USED`, `REFLECTION_RESPONSE`, `BIG5_RESPONSE` — same names, required fields and validation.

### 8.2 Additive changes **[A]**
| Change | Type | Backward compatible? |
|---|---|---|
| New event type `RESEARCH_SIGNAL {signal_id, …}` for curiosity spots, tidy-up, persistence, night-camp seat, ribbon, preview reads, control familiarity | New type | Yes (backend must add it to `event_schema.py`, otherwise rejected) |
| Extra optional fields on `ACTIVITY_*`: `variant`, `bench_slot`/`site_slot`, `role_order`, `phase_task_variant` | Optional fields | Yes |
| `EVENT_SCHEMA_VERSION` 1.1.0 → 1.2.0; `GAME_VERSION` ve-3.0.0 | Version bump | Yes |
| RIASEC config: dwell weight 0, new `model_version` (D-07) | Config | Changes scores → parity fixture regenerated on both sides |
| Big Five behaviour estimates: retire O-variety, C-optional/finish, N-retry; add research signals (D-08) | Scoring module | Changes research output only |

### 8.3 Separation of research data
- `RESEARCH_SIGNAL` events are never read by `computeRiasec`, `scoreAbility`, `scoreQuestionnaire` or the student summary (enforced by a unit test that scans scorers' inputs).
- They are uploaded only if the host's consent covers research use (adapter flag `researchConsent` **[A]**); otherwise they are not recorded at all.

## 9. Local persistence

| Key (existing pattern) | Content |
|---|---|
| `ve:active`, session keys, outbox | Existing (events, journey, meta) — atomic `multiSet` |
| `ve:prefs:<studentId>` | Look, hub position, settings, cosmetics owned, feathers, scene checkpoints |
| Purge | Existing `purgeAllLocalData` also clears new prefs fields |

Storage size budget: < 2 MB per student session (events are small JSON).

## 10. Backend synchronisation and offline support
- Existing `SyncWorker` (back-off, idempotent by `event_id`) and `PrototypeBackendSink` unchanged.
- Backend changes: add `RESEARCH_SIGNAL` to `analytics/event_schema.py`; extend `analytics/valley_bigfive.py` with the new research signals (Python port kept identical to TypeScript, checked by the integration test as now); dashboard shows research signals beside the questionnaire.
- Offline: full play offline; HUD shows an offline icon; uploads resume automatically.

## 11. Audio, read-aloud and haptics
| Feature | Module | Notes |
|---|---|---|
| Read-aloud **[A]** | `expo-speech` (Expo SDK 58 docs list Android, iOS, Web, included in Expo Go) | Uses the phone's text-to-speech engine; English voice quality and availability vary by device — test on target phones. Alternative: pre-recorded English voice lines (better quality, adds ≈ 10–20 MB) — decision D-05 |
| Music and sound effects | `expo-audio` (SDK 58, included in Expo Go) | Short OGG/MP3 clips, ≤ 3 MB total; respects silent mode and settings |
| Haptics | Expo haptics module (verify SDK 58 docs before use) | Light/medium impacts only |

Package versions must be installed with `npx expo install` (project rule in `AGENTS.md`).

## 12. Performance budget (entry-level Android)
Pakistan's market is dominated by budget brands — Transsion (Tecno/Infinix) had 44% unit share in Q2 2025 — so design for entry-level hardware **[D]**:
| Target | Value |
|---|---|
| Device floor (assumption, to verify in the pilot) | Android 10+, 3–4 GB RAM, 720 p screen |
| Frame rate | 60 fps target in scenes; never below 30 fps during walking |
| Rendering | One memoised SVG tile layer per scene (existing approach); characters/camera via `Animated` with native driver where possible; sprite PNG atlases for detailed art |
| Memory | < 250 MB |
| Install size | Game assets ≤ 25 MB (art 15, audio 3–20 depending on D-05) |
| Cold start | < 4 s to title on a reference low-end phone |
| Battery | No continuous animations off-screen; pause rendering when app backgrounded |

## 13. Accessibility implementation
- Every interactive element: `accessibilityRole`, `accessibilityLabel`, state (existing practice; `aria-disabled` on web fixed 16 Nov).
- Settings: text scale, reduced motion (respect the OS setting by default), left-handed mirror, read-aloud, hold → double-tap, high-contrast outlines.
- World navigation for screen-reader users: focusable list of nearby objects with "walk to" action (uses tap-to-walk) **[H — test feasibility]**.
- No time limits anywhere.

## 14. Testing strategy
| Test | Purpose |
|---|---|
| Machine unit tests (existing pattern) | Every level's logic, resume after kill |
| Scene reachability + equidistance tests | Layout rules |
| Activity balance tests | Equal steps / expected time per type |
| Scorer isolation test | Research signals never enter scores |
| Parity tests (TS ↔ Python) | RIASEC (existing), Big Five (existing integration test) |
| Persona bots (existing `testing/bots.ts`) | Full journeys, journal answers |
| Scripted web play-through (existing) | Screens, no errors |
| **Physical device matrix** | ≥ 3 entry-level Android phones (e.g., Tecno/Infinix/Redmi), 1 tablet; touch, drag, hold, TTS, performance |

## 15. Changes that require approval
| # | Change | Why approval |
|---|---|---|
| T1 | New event type `RESEARCH_SIGNAL` + schema 1.2.0 | Contract and backend change |
| T2 | RIASEC dwell removal (new model version) | Changes scores; breaks continuity with earlier data |
| T3 | Retire circular Big Five behaviour estimates | Changes research outputs |
| T4 | Read-aloud (TTS or recorded audio) | Bundle size / voice quality / cost |
| T5 | Adapter extension: `researchConsent`, optional pathway suggestions back to the game | Host app integration |
| T6 | Tap-to-walk | Changes control covariates; must be logged |
| T7 | Larger art and audio bundle | Install size on low-end phones |
