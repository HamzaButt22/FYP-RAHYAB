# Architecture

## Layers and boundaries

```
 ┌───────────────────────────── RahYaab app (host) ─────────────────────────────┐
 │ auth · consent · navigation · encrypted storage · ingestion API · pathways    │
 └───────────────┬───────────────────────────────────────────────▲───────────────┘
                 │ RahYaabHostAdapter (adapter.ts)               │ onComplete(AssessmentOutput)
 ┌───────────────▼───────────────────────────────────────────────┴───────────────┐
 │ ValleyExplorer.tsx  — module root, internal screen state machine, AppState,    │
 │                       Android back button                                       │
 │ game/ screens/ levels/ ui/ — PRESENTATION: walkable world, mini-games, puzzles; │
 │                       render state, dispatch actions; rewards derived from events│
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │ core/levels/*       — MECHANICS: pure machines reduce(state, action) → events   │
 │ core/items/*        — item banks + solvers                                      │
 │ core/riasec, core/ability, core/summary — ASSESSMENT LOGIC (pure, versioned)    │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │ services/session.ts — EVENT GENERATION + checkpoint (single write path)        │
 │ services/eventStore.ts — LOCAL PERSISTENCE (log + outbox + checkpoint)         │
 │ services/sync.ts, sinks.ts — BACKEND COMMUNICATION (batched, idempotent)       │
 └─────────────────────────────────────────────────────────────────────────────────┘
```
Rules: screens never touch storage or the network; `core/` imports no React Native; scoring reads only stored events.

## Data flow for one tap
1. A screen calls `dispatch(action)` (`ui/useLevel.ts`).
2. `LevelRunner` runs the machine. A disallowed action (double tap, wrong phase) returns no change and records nothing.
3. `GameSession.commit()` gives events `seq` numbers, validates them (`contract/events.ts`) and writes the events, the journey checkpoint and the clock in **one** `multiSet`.
4. `SyncWorker` uploads the unsent events later (debounced, batches of 50, exponential back-off). An event is marked sent only after the sink confirms. Sinks de-duplicate by `event_id`.

## Game layer (presentation only)
- `game/engine/tilemap.ts` is pure: the grid, collision, what the traveller faces, camera. `World.tsx` draws the tiles in one memoised SVG and moves only the traveller and camera (Animated), so walking does not re-render the map.
- Moving and talking never record assessment events. Only the actions the original game also recorded (reading a sign, choosing a road, starting/finishing/leaving an activity, a step, a puzzle answer) are dispatched to the level machines.
- `game/rewards.ts` computes coins from the event log; nothing is stored or uploaded for rewards.

## Persistence keys
`ve:prefs:<studentId>` (cosmetic: traveller look and last valley position; not uploaded) · `ve:active` (the active session) · `ve:<sid>:meta` (seq counter, active ms, student) · `ve:<sid>:journey` (JourneyState incl. per-level state) · `ve:<sid>:evt:<seq>` (event + sent flag). After results are delivered and every event is acknowledged, `purgeIfDelivered()` deletes the session from the device.

## Recovery behaviour (all covered by tests)
| Situation | Behaviour |
|---|---|
| App killed mid-level | Resumes the same session, the same level and the same step. Emits `SESSION_RESUMED`; no events are lost or duplicated |
| App in background | `GAME_PAUSED`/`GAME_RESUMED`; background time is excluded from `t_mono_ms` |
| Offline | Events stay in the outbox; retry with back-off up to 60 s |
| Resend after crash | Server de-duplicates by `event_id` (prototype backend change included) |
| Repeated taps | Machines are idempotent; scored puzzles accept one submission |
| Storage write fails | One retry, then a visible warning on the map |
| Different student on a shared phone | Never resumes another student's session; `purgeAllLocalData()` for logout |
| No consent | Module refuses to start; nothing is written |

## Why no router inside the module
RahYaab's navigation library is unknown. A tiny internal state machine lets the module mount on any screen of any navigator without adding routes to the host.

## Performance choices
No image assets: all art is vector (react-native-svg), so the Android bundle is 1.9 MB of Hermes bytecode. Animations use the native driver (except progress-bar widths). No reanimated and no game engine. ScrollViews only, with no heavy lists.
