# Valley Explorer → RahYaab: completion report (16 Nov 2026)

## Update 20 Nov: mobile controls and landscape
After testing on a phone you reported that walking, the controls, knowing where to go and the portrait view were poor. Changes (same levels, same scoring, same data):
- **Landscape by default** (`expo-screen-orientation`), full-screen world with the controls laid over it; **⟳ Rotate** switches to portrait and is remembered; the host app's orientation is restored when the game closes. `app.json` orientation is now `default`.
- **Smooth walking:** steps chain without pauses while the joystick is held.
- **Joystick:** one round pad; slide your thumb to change direction without lifting it; a quick touch = one step. Screen readers get walk up/down/left/right actions.
- **Tap to walk:** tap any tile to walk there by the shortest route; tap a person/sign/building to walk to it and use it. Routes never cross a Caravan road (a choice) unless that road was tapped.
- **Where to go:** an orange arrow at the screen edge points to the next objective and walks there when tapped; the Action button pulses when something can be used; instructions rewritten for the new controls.
- **Screens in landscape:** wider content area; the journal shows the sentence and all five answers side by side; sheets scroll with their buttons always visible; Map Room/Pattern Gate show the four choices in one row; the Vault shows clues and dials side by side.
- Bug found and fixed while doing this: a background panel covered the ground tiles on web.
- Checks: typecheck and lint clean; **139 tests passed** (incl. new pathfinding/camera tests and a tap-to-walk UI test); backend integration test passed; Android bundle built; scripted play-throughs of the whole journey in **landscape (844×390) and portrait (390×844)**: 39 screens each, 0 errors. **Still not tested on a physical phone by me** — please try the joystick, tap-to-walk and rotation on yours.

## Update 16 Nov (later): Big Five added alongside RIASEC
At your request ("we need both Big Five and RIASEC … more evidence"), the game now measures both. Chosen approach: **in-game questionnaire plus gameplay estimates, compared**.
- A short **Traveller's Journal** page after each stop: 20 Mini-IPIP statements in total (public domain, wording checked against the IPIP key), 2–3 at a time, skip allowed, no coins for answers.
- Results now show "How you usually are" and "Ideas to explore", which combine interests and personality carefully. RahYaab receives the questionnaire scores in `eligible_outputs.bigfive`; gameplay estimates and their comparison are research data only.
- Backend: new event type `BIG5_RESPONSE`, endpoint `GET /api/sessions/<id>/bigfive` and a Big Five section on the dashboard's player page (Python port, identical numbers to the app; checked by the integration test).
- Details and limits: `docs/BIG_FIVE.md`. Versions: event schema 1.1.0, game ve-2.1.0, `bigfive-0.1-mini-ipip`.
- Please record your supervisor's sign-off for including Big Five; the earlier brief required approval.

## Update 16 Nov: rebuilt as a playable game
After your Expo Go test ("more textual than game"), the presentation layer was rebuilt. **Scoring, events, saving, sync and the backend are unchanged**: the same level machines are driven by game controls instead of text buttons.
- **Walkable valley.** The student creates a traveller (style, skin tone, clothes colour), then walks the valley with an on-screen **arrow pad** (hold to keep walking) and an orange **Action button** that changes to what is in front of them ("Read sign", "Open the gate", "Enter", "Work here", "Talk"). Stops are buildings along a path; locked ones show a padlock, finished ones a star stamp. Ustad Mehr and Mayor Saima speak in speech bubbles.
- **Level 1** happens in the valley itself: read signs on foot, open the gate.
- **Caravan:** at each fork the student walks up one of three roads (or to the tent to rest). **Workshop:** walk to a bench to work there; leave by the door. **Park:** talk to the Mayor to choose a role, then walk to any site.
- **Every activity is a hands-on mini-game** (18 activities, 6 kinds): drag a part onto the wheel, tap 3 times, press and hold, pick a colour and paint. Drag also works as "tap the item, then tap the target". Optional extras are shown as sparkly chips.
- **Puzzles** are game scenes: the chosen map piece lands in the empty frame, the chosen stone fills the gap in the gate, vault dials can be swiped, and a solved lock shows the vault opening.
- **Rewards:** coins and stamps (`game/rewards.ts`) are calculated from the stored events and are **not** assessment data. Fairness rules: every activity type pays the same, optional extras and bonus rounds pay nothing, and puzzle coins are for trying, not for being right, so rewards cannot steer interest choices or punish wrong answers. Extra clothes colours unlock as stops are finished. No timers, streaks or loss mechanics.
- The traveller look and position are stored as a cosmetic preference (`ve:prefs:<id>`), never uploaded, and removed by `purgeAllLocalData`.


## Decisions taken with you
1. RahYaab's app source was not in the upload → **standalone Expo module behind an adapter** (your choice).
2. Pygame cannot run in Expo/Android → **client re-implemented in React Native/TypeScript** (approved).
3. **8-level revised journey** (approved): 3 RIASEC levels, 4 ability levels and 1 unscored welcome level, built from the original 10.

## Status
| Category | Items |
|---|---|
| **Fully implemented and tested** | All 8 levels as a walkable game: tile world with collision, arrow pad + Action button, avatar creator, 18 mini-games (drag/tap/hold/paint), game-styled puzzles, coins and stamps. Intros, reflection, results. Design system and vector art. Event contract with runtime validation and versions. Durable outbox, atomic checkpointing and mid-level resume after an app kill. Pause-safe clock (app backgrounding). Offline retry with back-off. Idempotent upload. Repeated-tap protection. Consent gate. Android back button. RIASEC scoring (exact parity with the Python original, 40 cases). Ability scoring with counts only. Explainable student summary. Adapter + `PrototypeBackendSink`. End-to-end upload to the real Flask backend. Android Hermes bundle builds |
| **Partially implemented** | Accessibility: labels, roles, ≥48 dp targets and non-colour cues are in place, but no TalkBack session was run. Localisation: `language` passes through to events, but **all UI text is English**; Urdu strings need human translators (not machine translated, as you asked) and an i18n layer is not yet built |
| **Requires backend support** | RahYaab's real ingestion endpoint and contract, idempotent by `event_id`. Server-side storage of `AssessmentOutput`. The pathway engine consuming `eligible_outputs` |
| **Requires a host/RahYaab decision** | An encrypted `KeyValueStore` (the default AsyncStorage store is unencrypted). Real sign-in and consent screens (`App.tsx` is a labelled demo stand-in). Expo SDK alignment if RahYaab is not on SDK 58 |
| **Requires supervisor approval** | Final 8-level structure and the exclusion of levels 3, 5, 6 and 9. Written sign-off for the Big Five journal (now implemented at your request, `docs/BIG_FIVE.md`). Provisional display threshold `MIN_TOP_SCORE = 25` and minimum 4 attempted items |
| **Requires real-world validation** | Every interest and ability interpretation. Item difficulty order. RIASEC agreement with a licensed questionnaire. Fairness by gender, language and device (see `docs/SCORING.md` §6) |
| **Not implemented** | Verbal reasoning family. Urdu UI. Sound/voice-over. Physical-device testing (see below). Multi-session replay of completed levels (disabled on purpose to avoid double-counting) |

## Verification actually performed
| Check | Result |
|---|---|
| `npm test` | **133 passed** (incl. 12 Big Five tests: keying, page assignment, scoring, skips, resume of an interrupted page, student wording); (core, items, RIASEC parity, session/recovery, tile-map collision and reachability, rewards, rendered game flows: walking with the arrows, reading a sign, opening the gate, choosing a road on foot, each mini-game interaction, resume after a kill) |
| `npm run typecheck` / `npx expo lint` | clean / clean |
| Integration test against the real Flask backend | passed: full journey uploaded once, re-sent batch ignored, only the pseudonymous id reached the server, backend Big Five identical to the app's |
| Original Python suite after backend change | **162 passed** (154 original + 8 new) |
| `npx expo export --platform android` | Hermes bundle built (785 modules) |
| Scripted play-through of the whole game | React Native Web in headless Chrome at a 390×844 phone viewport: created a traveller, walked to every stop with the arrow pad, played mini-games of all 4 interaction types, solved/skipped the puzzles, reached the results. filled all 8 journal pages; 39 screens reviewed, 0 page errors |

**Not verified:** running the new game controls on a physical Android phone or an emulator. Neither was available in this environment. The web render shares the component code but not native rendering, touch handling, Hermes runtime behaviour or low-end-device performance. Please do one Expo Go run on an ordinary Android phone (steps in `README.md`), including: walking with the arrow pad (tap and hold), dragging items in the mini-games, the press-and-hold steps, swiping the vault dials, kill the app mid-level, airplane mode.

## Bugs found and fixed during this work
- Game rebuild: a very quick tap on an arrow could be lost on some renderers (now always takes a step). Disabled buttons did not report "disabled" to screen readers on web (now `aria-disabled`). Both found by the scripted play-through.
- Level 10 intro text overflowed its dialog in the Pygame build (now superseded).
- `Tap` left a zero-size touchable around absolutely positioned buttons, so the valley landmarks were invisible and on Android would have been untappable. Found by the visual check.
- The default ID generator could return an empty value without native crypto. Found by the integration test; now validated, with a fallback.
- Top interests could include areas the student "rarely chose", or scored 0 → display threshold added.
- Ability results reported "0 of 6" when everything was skipped → skips no longer count toward the minimum.
- The orders puzzle allowed submitting an over-budget answer the screen already flagged. Pattern stones were hard to count. Completed steps looked locked.
- Privacy: the shipped `data/rahyaab.db` contained a real first name and has been removed from the delivered Python project. Do not commit database files.

## Changed files in the original Python project
`analytics/event_schema.py` (7 new event types) · **new** `analytics/valley_bigfive.py` · `backend/routes/api.py` (`/bigfive` endpoint) · `dashboard/templates/player.html` (Big Five section) · **new** `tests/test_valley_bigfive.py` · `backend/services/assessment_service.py` (event_id de-dup) · `backend/database/repository.py` (`existing_event_ids`) · **new** `tests/test_valley_explorer_ingest.py` · **removed** `data/rahyaab.db`

## New files (React Native project `valley-explorer/`)
Root: `App.tsx` (demo host), `README.md`, `COMPLETION_REPORT.md`, `package.json`, `tsconfig.json`, `jest.setup.js`, `jest.integration.config.js`
`docs/`: `ARCHITECTURE.md`, `SCORING.md`, `INTEGRATION.md`, `BIG_FIVE.md`
`tools/`: `make_riasec_parity_fixture.py`, `run_integration.sh`
`src/valley/`: `index.ts`, `adapter.ts`, `ValleyExplorer.tsx`
- `contract/`: `events.ts`, `versions.ts`
- `core/`: `journey.ts`, `progress.ts`, `tasks.ts`, `caravan.ts`, `rng.ts`, `summary.ts`, `ability/scoring.ts`, `riasec/{scoring.ts, units.ts, riasec_config.json}`, `items/{workshopOrders, mapRoom, patternGate, vaultLocks}.ts`, `levels/{machine, interestLevels, abilityLevel, runner}.ts`
- `services/`: `storage.ts`, `eventStore.ts`, `session.ts`, `sync.ts`, `sinks.ts`
- `game/`: `engine/{tilemap.ts, TileLayer.tsx, World.tsx, Avatar.tsx, sprites.tsx}`, `maps.ts`, `ValleyWorld.tsx`, `AvatarCreator.tsx`, `Hud.tsx`, `rewards.ts`, `minigames/{kinds.ts, items.tsx, MiniGameStage.tsx}`
- `ui/`: `theme.ts`, `components.tsx`, `icons.tsx`, `ValleyArt.tsx`, `JobPanel.tsx`, `AbilityFrame.tsx`, `PopIn.tsx`, `useLevel.ts`
- `levels/`: `CaravanLevel`, `OrdersLevel`, `WorkshopLevel`, `MapRoomLevel`, `PatternGateLevel`, `ParkLevel`, `VaultLocksLevel` (`.tsx`), `types.ts`
- `screens/`: `LevelIntro`, `Reflection`, `Results` (`.tsx`)
- `testing/bots.ts`; tests in `__tests__/` (6 suites + parity fixture) and `__integration__/`

## Known limitations
English-only UI. Unencrypted default storage. Demo host instead of the real RahYaab flows. Not run on a physical device. Mini-game artwork is simple vector art; no sound yet. Provisional item difficulty. Six items per ability family is too few for reliable individual results. Interest profile from about 25 choices. Expo SDK 58 assumed. Completed levels cannot be replayed. A different student's unsent data stays on a shared phone until the host calls `purgeAllLocalData`.
