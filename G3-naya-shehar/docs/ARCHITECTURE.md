# Architecture

## Layers

```
src/
├── app/                  Expo Router screens (thin: layout + wiring only)
├── screens/
│   ├── session/          Weekly session steps (season, dialogue, planner, choice, puzzles, build, letter…)
│   ├── puzzles/          Puzzle runner + one view per puzzle kind
│   └── minigames/        Six unscored activity mini-games
├── ui/                   Design system: tokens, text, buttons, panels, icons, HUD, controls
├── art/                  Original SVG art: isometric town, buildings, characters, vignettes, logo
├── state/                GameProvider (React bridge to the engine), flow (what to do next)
├── game/
│   ├── engine/           GameEngine (single owner of the save) + SaveGame types
│   ├── world/            Districts & buildings (data)
│   ├── characters/       Cast (data)
│   ├── content/          Forced-choice scenarios, planner sets (data)
│   ├── progression/      Week plans, town-building rules
│   ├── story/            Dialogue scripts, letters, end-game recap
│   └── avatar.ts         Avatar options & approved nicknames
├── assessment/
│   ├── riasec/           Pair schedule
│   ├── abilities/        Puzzle types, 96-item bank, geometry, staircase, answer checking
│   ├── scoring/          Interim interest & ability models
│   ├── recommendations/  Versioned pathway rules + engine
│   └── events.ts         Event validator
├── database/             Store interface, SQLite store, migrations, web/test memory store
└── services/             Scheduling, audio, speech, haptics
```

**Rules of the codebase**

- `assessment/**` never imports from `game/progression` or `art/`; town rewards are invisible to scoring.
- Screens never write storage directly; every change goes through `GameEngine`.
- Content (scenarios, puzzles, rules) is plain typed data with unique ids, checked by tests.

## GameEngine and saving

`GameEngine` (`src/game/engine/GameEngine.ts`) owns the save game. Each public action:

1. computes the new state purely,
2. validates any assessment events,
3. writes the changed state keys **and** the events in **one SQLite transaction**,
4. returns the new state.

So the save is always either entirely before or entirely after an action, even if the app is killed.
Steps are **idempotent**: the session stores per-step state, so a step resumed after a crash cannot
record its choice, reaction, plan or puzzle twice (tested).

### Database (`expo-sqlite`, synchronous API)

| Table / view | Purpose |
|---|---|
| `kv(key, value, updated_at)` | Save-game sections: `avatar`, `settings`, `schedule`, `town`, `session`, `stairs`, `student`, `history`, `unmeasuredWeeks`, `unmeasuredSessions`, `introSeen` |
| `events(seq, recorded_at, session_id, week, type, item_id, measured, payload)` | Append-only assessment evidence |
| `puzzle_performance` (view) | Per-puzzle results for inspection/export |

Migrations are forward-only, versioned through `PRAGMA user_version`, each in a transaction
(`src/database/migrations.ts`). Tested against a real SQLite engine (sql.js) in `tests/sqlite.test.ts`.

The web preview (used only for design review and automated UI tests) uses an in-memory store
persisted to `localStorage` (`storeFactory.web.ts`). Android/iOS always use SQLite.

## Weekly scheduling (`src/services/scheduling.ts`)

- Prologue always available → Week 1 opens when the prologue is finished →
  each later week opens **7 days** after the previous week was completed.
- A started week can always be resumed and finished.
- **Clock protection (offline):** the highest wall-clock time ever seen is stored. If the phone's
  clock is later found to be earlier than that by > 10 minutes, it is counted as an anomaly and the
  stored time is used instead, so moving the clock back never helps.
- Development builds only: a "fast weeks" switch (2-minute gaps) for testing. It is forced off in
  release builds.

### Limitation: forward clock changes

Without a trusted server, an app cannot detect a phone clock moved **forward** while offline.
A determined student could unlock the next week early by changing the date. The anomaly counter
catches the common "move forward, then move back" pattern after the fact, and is shown on the
locked screen. If schedule integrity matters (for example in a school study), add an optional
time check against a trusted server when the phone is online, or have a teacher unlock weeks.

## Rendering & performance

- The town is one memoised SVG (≈ 210 tiles + 24 buildings + decor), re-rendered only when the
  town changes. Moving things (walkers, rickshaw, clouds, birds, smoke, rain, construction hammers,
  markers) are separate small `Animated.View`s driven on the UI thread by Reanimated.
- Reduced motion (phone setting or in-game) removes all ambient animation and transitions.
- Panning uses nested native ScrollViews (no gesture JS on the JS thread).
- Assets: no bitmaps in the game itself except the app icon; sounds are ~620 KB of original
  synthesised WAVs. Total game assets are far below the 40 MB per-week budget.

## Accessibility

Read-aloud button on every text block (on-device TTS via `expo-speech`), optional auto-read,
reading speed, three text sizes, ≥ 48 dp touch targets, state shown with icons and words (never
colour alone), reduced motion, dark theme, accessible task mode, screen-reader labels on all
interactive elements (including map buildings and puzzle options).

## Privacy & safety

No network calls, no accounts, no ads, no purchases, no external links, no chat, no free text.
The only personal inputs are an avatar, a nickname from an approved list, and (at the end) the
student's class and Matric group. Android permissions: none requested; camera, microphone,
location and contacts are explicitly blocked in `app.json`.

## Known limitations

- Weekly locking can be bypassed by moving the clock forward offline (see above).
- Scoring models are interim and uncalibrated (see MEASUREMENT.md).
- Pathway eligibility rules are unverified drafts (see MEASUREMENT.md §7).
- The planner uses ↑/↓ reordering rather than free drag-and-drop.
- Read-aloud depends on the phone having an English TTS voice installed.
- No native Android build or real-device performance test could be run in the build environment
  (see TESTING.md).
