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

**Last run (build environment): 6 suites, 61 tests, all passed.** `npx tsc --noEmit`: no errors.

## End-to-end UI playthrough (headless Chrome)

`e2e/e2e.js` drives the **web preview** with real taps only (no shortcuts into the engine):
splash → welcome → story → avatar → prologue → Weeks 1–4 → final reveal → summary → study
details → results, plus pause, accessibility, progress, building and district screens. Between
weeks it moves the clock forward 8 days and **reloads the app**, which also tests persistence and
weekly unlocking. It solves every mini-game (including an exact pipe solver), answers puzzles
(often wrongly, to exercise retry/reveal), picks random sides of forced choices, and fails on any
page error.

```bash
npm run export:web            # or: npx expo export --platform web --output-dir dist-web
cd e2e && npm install
python3 serve.py ../dist-web 8081 &
node e2e.js http://127.0.0.1:8081 ./screens     # CHROME_PATH=/path/to/chrome if needed
```

**Last run (build environment, 360 × 640 viewport):** completed all 5 chapters; stored events
were exactly 30 `choice_made`, 4 `plan_committed`, 48 `task_result` and the optional reactions;
**no runtime errors**; 57 screenshots captured.

## Android checks performed

- `npx expo export --platform android` → Hermes bundle compiles (≈ 4.3 MB).
- `npx expo prebuild --platform android` → native project generates with id `pk.nayashehar.game`
  and only the three permissions listed in BUILD.md.

## Not performed (environment limits)

The build environment had no Android SDK, emulator or physical device (Google's Android and
Gradle download servers were unreachable), so **no APK was compiled and no on-device test,
FPS measurement or Expo Go run was done**. Before release, do the device checks in
BUILD.md › Release checklist on a 2–3 GB RAM Android 10+ phone.
