# RFC-0005: Game–app contract (version 2)

| | |
|---|---|
| **Status** | Draft (built as a first version for review; changes welcome before it is accepted) |
| **Author(s)** | Hamza Butt (app) |
| **Reviewers** | Zahid Bashir (game) |
| **Created / decided** | 2026-11-15 / — |
| **Requirements** | NFR-52, FR-13–17, FR-35, FR-52, FR-98; ADR-0002, RFC-0002 |
| **Contract version** | 2.0.0 (16 Nov 2026: English only, ADR-0016: `locale` and `rtl` removed from the context, `title` is one string). 1.1.0 (15 Nov 2026): `params` in the context, `week_complete` sent by the host, the week loop. Modules written for 1.x are refused until updated. |

## Summary

The app and the game meet in three small places, and nowhere else: what the app tells a game module (`GameContext`), what a module may do (`GameHost`), and how a module describes itself (`GameModule`). Everything inside a module is the game's choice: story, mechanics, art, screens and timing. The app turns what a module sends into envelope v3.0.0 events, so no module can break the upload rules. The code is in `frontend/mobile/src/game/`.

## Motivation

- The game and the app are built by different people at the same time. Zahid researches and designs the game, and may find something better than the current game design document. Hamza builds the app around it: identity, consent, sync, results and the dashboard.
- Neither should wait for the other, and a new game idea should not mean rewriting the app.
- NFR-52 asks for exactly this: a new task family or storylet is added "with no change to the week loop or the outbox". ADR-0002 named a shared `TaskModule` interface but never defined it. This RFC defines it, for every kind of module, not only tasks.

## Proposal

### Who owns what

| The app owns | The game owns |
|---|---|
| Who the student is, consent, sign-in | What happens on the screen |
| Event ids, order, time, saving and uploading | Which events to send, and when |
| Where saved progress is kept | What progress means, and its shape |
| Results, the dashboard, settings, language choice | Story, mechanics, art, timing, number of screens |

### 1. `GameContext`: what the app tells a module

`week` (0 for the prologue), `practice` (never scored), `a11yMode` (accessible task mode, FR-98: played but stored as not measured), `reducedMotion`, and `params` (1.1.0, optional): what this step of the week plan asks the module to show, such as which pair of options. It is plain JSON from the plan; a module that needs none ignores it.

It never includes the student's name, nickname or id. A module doesn't need them, so it can't leak them.

### 2. `GameHost`: what a module may do

| Call | What it does |
|---|---|
| `emit({ type, itemId?, data? })` | Sends one of the 21 agreed event types (SRS §12.5). The host adds the envelope: UUIDv7 id, run id, `seq` +1, `monotonic_ms` that never goes back, wall clock to the minute, week, practice, accessibility flag, `story_version` = `module@version`, and `content_version` = the content pack in use (`content.ts`). Every `itemId` must be listed in that pack on the server, or the event is rejected as `unknown_item`; until real packs exist, add your item ids to the development pack in `database/seed/dev_seed.sql`. |
| `experiment({ name, data? })` | Records a measurement nobody has agreed on yet. It is kept on the phone and **never uploaded or scored**. This is the room for new ideas: try it first, then propose it. |
| `save(state)` | Saves the module's own progress (≤ 16 KB of JSON). It is given back as `saved` on the next run. |
| `finish({ completed })` | Ends the run. Leaving early sends `quit`. |

The host sends `run_start`, `quit`, `session_start`, `session_end` and `week_complete` itself; a module can't.

**Who owns a run:** whoever starts it (the week loop, or the game lab) creates it with `createRun()` and hears through `onFinish` when the run ends. That happens when the module finishes, the student leaves (`run.abandon()`), or the module crashes. `GameScreen` shows the module for that run.

**When a run starts:** React runs a module's effects before its parent's, so a module may call the host before the screen starts the run. The first call therefore starts the run, and `run_start` always comes first. This was found while testing on the emulator.

If the student leaves the screen, or the module crashes, the run ends with `quit` and the student sees a calm message instead of a crashed app.

**Checks on every call:**
- only agreed event types;
- `itemId` of at most 64 letters, digits and `_ - . :`;
- `data` holding only short strings (≤ 64 characters, so no free text), finite numbers, true/false, lists and plain objects, at most 4 levels deep and 900 bytes.

A broken call **throws in development builds**, so the author sees it at once. In a release build it is **dropped and counted**, because a child's game must never crash over a telemetry mistake.

### 3. `GameModule`: how a module describes itself

| Field | Meaning |
|---|---|
| `id` | Lowercase words joined by dashes, unique in the app |
| `version` | The module's own version, like 1.0.0 |
| `kind` | task, scene, activity or other |
| `measures` | What it gives evidence for (see below) |
| `title` | The module's name in English (for the game lab and logs) |
| `contract` | The contract version it was written for |
| `Screen` | Its React Native component |

Adding a module is one line in `registry.ts`. `registryProblems()` checks every module.

### The one fixed point: what is measured

A module declares what it gives evidence for:
- `interests` (RIASEC);
- `values`;
- `aptitude:SPA|ABS|NUM|LOG|PLN|VRB`, one of the six task families;
- or `none`.

How a module measures it is entirely the game's choice. Changing *what* is measured is a team decision, because the recommender, the validation studies (V1–V8), the SRS and the ethics application all depend on it.

### Changing the contract

**No proposal needed for:**
- new modules, mechanics, story, art or screens;
- new `data` fields inside an agreed event type;
- experiments.

**A one-page proposal is needed for:**
- a new event type (it becomes a server change and a minor schema version);
- a change to what is measured;
- anything that changes what minors are shown after the ethics application is submitted.

The proposal says what changes, why, and what it does to measurement. It is reviewed for measurement and child safety only, not for taste. Compatible additions raise the minor contract version (1.1.0). A breaking change raises the major version, and old modules are then refused by `moduleProblems()` until they are updated.

### The week loop (1.1.0)

The week loop (`src/game/weekLoop.ts`, FR-13–17) plays modules in the order the game's content sets. A **week plan** is data: weeks 0–4 in order (week 0 is the practice prologue, never scored), each a list of **steps**, and each step names a module from the registry plus the `params` it should get. The app only walks the plan; the game decides what is in it.

- **Home** shows this week, the step and the time left, and one button that starts or continues it.
- **The player** (`src/app/play.tsx`) runs each step as its own run. After a step finishes, the place is saved and the next step starts. After a week's last step the host sends `week_complete` (data `{week}`) once, uploads, and the student goes back home. "Take a break" leaves at any time (`quit`) and keeps the place; "?" explains the screen. There is no timer.
- **Saved progress** (FR-15): the place in the plan and each step's own saved state are kept per student in the encrypted local database (`src/game/progress.ts`), so a shared phone keeps students apart and closing the app resumes the same step.
- **Results** open after 4 scored weeks (FR-52); Home says why they are locked until then. The server counts `week_complete` events from non-practice runs (RFC-0003).
- `planProblems()` names plan mistakes: unknown modules, repeated step ids, weeks outside 0–4 or out of order, empty weeks.

Until the game's content exists, the active plan is `src/game/samplePlan.ts`: the sample module over the 30 pairs of `design/game/frameworks/pairs.json`, in its target schedule (a test checks they match).

### The game lab

The game lab is a developer-only screen (`src/app/game-lab.tsx`, locked with `Stack.Protected guard={__DEV__}`, opened from Home). It:
- lists every module with any contract problems;
- plays a module as a practice run, with accessible task mode on or off;
- shows exactly what the run sent: the envelope events for the outbox, the experiments kept on the phone, and anything dropped.

### The sample module

`modules/samplePickOne.tsx` is a two-option choice that uses every part of the contract:
- the context (the recorded `side` is where the picked option was on screen);
- `params` from the week plan (`left`, `right`, `item`), or a random order when played alone;
- saved progress ("played before");
- `scene_start` and `choice_made`, with the options in random order;
- an experiment (`changed_mind`);
- `finish`.

It is not game content. Copy it as a starting point.

## Security, privacy and accessibility

- Modules never receive the student's identity.
- Events can't carry free text: only short strings, and the size is capped per event.
- Experiments never leave the phone.
- The game lab exists only in development builds.
- Accessible task mode is passed to every module and recorded on every event, so an accessible run is never scored as a measured one (FR-98).
- Reduced motion is in the context, so every module can respect it.

## Alternatives

- **One big game component that the app calls with no contract.** Fast to start, but every game change would touch the app, and nothing would stop a module from breaking the upload rules.
- **Letting modules build envelopes themselves.** That would mean more freedom over fields nobody needs to change, and the risk of broken ordering, which the server would quarantine.
- **A free-form event type for anything new.** It would upload unagreed data from minors and make results hard to explain. Experiments give the same room without uploading anything.

## Rollout and testing

- `src/game/contract.test.ts` (`pnpm test`) covers the module, event and data checks, the envelope fields and limits, the never-decreasing time, `quit` on leaving, development versus release behaviour, experiments and saved progress, and UUIDv7.
- `src/game/weekLoop.test.ts` covers the week loop: every step in order, each week finished once, results opening only after four scored weeks, resuming and fitting saved progress to a changed plan, plan mistakes, the sample plan matching `pairs.json`, `week_complete` sent once and only by the host, and per-step saved state.
- **Built:** events go to the encrypted SQLite outbox (ADR-0010) and `POST /v1/events:batch`; saved progress and the week's place are in the same database. Modules did not change.
- **Tested on the emulator (15 Nov 2026):** the prologue and the first steps of week 1 played through Home and the player; the server received the planned pairs, the practice flag on week 0 and one `week_complete`; a break and a full app restart resumed at the same step.

## Open questions

1. **Grade or stage in `GameContext`:** should modules receive grade 9–10 versus 11–12, or should content packs handle that (RFC-0001)?
2. **FR-35:** an event must be committed before the story advances. With the SQLite outbox, does `emit` stay synchronous (the outbox queues writes in order), or should modules await it at scene boundaries?
3. **Ink (ADR-0009):** does the story run inside a module, or as a host service that several modules share?
4. **Skia, Reanimated, Gesture Handler and Rive** (ADR-0002) are not installed yet. Add them when the first module needs them (each is a download to approve).
5. **Review:** Zahid reviews this RFC and the sample module, then the status becomes *Accepted*, or it is changed.
