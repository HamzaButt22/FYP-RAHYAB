# Testing

## Automated unit & integration tests (Jest)

```bash
npm test
```

| Suite | What it proves |
|---|---|
| `tests/content.test.ts` | 15 unique pairs; 30-presentation schedule with each pair twice, second time **sides swapped** and in a later week; left/right balance; every category ≥ 2× per week; 30 scenarios mapped 1:1 to slots; balanced option text; no questionnaire wording; buildings unlocked in their week; Ayesha and Bilal across all six kinds of work; planner sets; ≥ 12 puzzles per family, ≥ 3 per level, 4 levels, unique ids; SPA answers unique under rotation; ABS options distinct; NUM answers re-derived; LOG unique-solution checks; PLN optimal routes re-verified; week plans (prologue unscored, 2 puzzles/family/week, 3 planned jobs, never more than 2 puzzles in a row) |
| `tests/scoring.test.ts` | Event validation (incl. rejecting timing fields); planner/reaction decomposition; practice & unmeasured excluded; **parameter recovery on 200 simulated players**; confidence shrinks with evidence; EAP behaviour; only first attempts count; staircase rules and level fallback; every puzzle accepts its answer and rejects a wrong one |
| `tests/engine.test.ts` | Full 4-week playthroughs through `GameEngine`: exact event counts, valid events, recovery of a simulated player's top interests, season projects built, **identical rewards for either choice**, **abilities never change interests**, optional reactions, staircase climbs/falls with no repeats, weekly locking (7 days), no skipping ahead, **clock-moved-back detection**, **restart mid-week**, atomic writes, idempotent steps after a crash, accessible mode (start-of-week and mid-week), recommendations respect eligibility and give 3 + Plan B |
| `tests/sqlite.test.ts` | The real `SqliteStore` on a real SQLite engine (sql.js): migrations, a full playthrough with the app re-opened every week, the `puzzle_performance` view, **transaction rollback of state + events**, reset |
| `tests/story.test.ts` | Recap and letters only make evidence-supported statements and never show scores/labels; town meters and funding; deterministic layout with room for all 40 homes |
| `tests/minigames.test.ts` | Every pipe layout starts unsolved and is solvable |
| `tests/sync.test.ts` | Game ↔ dashboard uploads end to end (see below) |



## Game ↔ dashboard end-to-end (`tests/sync.test.ts`)

Starts the real dashboard server as a separate process with a temporary database, then uses the real
game engine and sync client: unlinked / unconfigured / offline handling; unknown class codes; a full
five-chapter game uploaded week by week (with Week 3 played offline and delivered later), checking
that every event arrives exactly once and that the class CSV and student report show the right
results; a second phone trying to overwrite another phone's results (rejected); and accessible mode
switched on mid-week being reflected on the server.

## Dashboard server tests (`dashboard/test/app.test.js`)

`cd dashboard && npm test` — login and wrong passwords, CSRF protection, admin vs teacher access
(teachers only see their own classes and students), class code lookup, upload validation, token
checks, idempotent re-uploads, retroactive "not measured", HTML escaping of student data, CSV export
with spreadsheet-formula protection, archive/restore, logout.

**Last run:** game 7 suites / 66 tests passed; dashboard 9 tests passed; TypeScript clean.

## Visual checks

During development, the game screens were reviewed in a headless browser at 360 × 640 and the
dashboard pages at desktop and phone widths, light and dark (screenshots in the design PDF). The
shipped game is mobile-only; there is no web version of the game.

## Android checks performed

- `npx expo export --platform android` → Hermes bundle compiles (≈ 4.3 MB).
- `npx expo prebuild --platform android` → native project generates with id `pk.nayashehar.game`
  and only the three permissions listed in BUILD.md.

## Not performed (environment limits)

The build environment had no Android SDK, emulator or physical device (Google's Android and
Gradle download servers were unreachable), so **no APK was compiled and no on-device test,
FPS measurement or Expo Go run was done**. Before release, do the device checks in
BUILD.md › Release checklist on a 2–3 GB RAM Android 10+ phone.
