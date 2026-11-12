# Rahyaab: Project Brief

> Read this first. The full specification is [`SRS.md`](./SRS.md) (v1.1, 4 Nov 2026). The game is specified in [`design/game/GAME_DESIGN.md`](../../design/game/GAME_DESIGN.md) (v3), and the visual design in [`design/`](../../design/README.md). If this brief and the SRS disagree, the SRS wins.

## Vision

**"Explore before you lock in."**

Pakistani students choose an academic group at about 14 (end of class 8), again at about 16 (Intermediate), and then a university field, mostly without guidance and under family pressure.

Rahyaab lets **class 8–12 students (ages 14–18)** play one short story game, **"Your Year"**, on an ordinary Android phone. It then gives them an **explained shortlist of paths**, which they can explore and talk over with their family and teachers.

Rahyaab is a BSCS Final Year Project at Riphah International University (FYP-1 Fall 2026, FYP-2 Spring 2027).

- **Team:** Zahid Bashir, Hamza Butt, Daniyal Sarwar
- **Supervisor:** Zeeshan Ali

## Target users

| User | Surface | Core need |
|---|---|---|
| Students, class 8–12 (Matric, Intermediate, O/A-Level), often on shared, low-end phones | Mobile app (Urdu/English) | Discover their interests, strengths and values; see which paths fit and what each one opens or closes |
| Parents/guardians | Web link, no app | A plain Urdu/English report, honest entry odds, alternatives, consent |
| Teachers/counsellors | Web dashboard | Class progress, flags, one-page student summaries, CSV export |
| Admin/researchers | Web console | Schools and class codes, content packs, model versions, audit, de-identified exports |

## The game in one paragraph

Hudhud the hoopoe brings a sealed letter from you, five years from now; most of it is smudged. The student lives one school year as themselves in a Pakistani city, a week at a time (about 5 minutes each):
- they **plan the week** by picking 3 of 6 activities;
- they play three short **scenes**, where two inner voices, **Dil** and **Duniya**, offer choices between interests;
- some scenes hide an untimed **everyday task** (pack the car boot, split the chai bill, find who took the cricket bat);
- a small **value dilemma** comes up each week.

Every Sunday more of the letter becomes readable: that is the AI's real certainty. After 4 weeks the letter opens as the **Blueprint**, with the top 3 paths, a Plan B and a family report, followed by optional **"Try a day"** job simulations. Nothing is called a test, question or score.

## Outputs

The app recommends, by class:

- **Class 8 → Matric group:** Science-Biology, Science-Computer, Humanities.
- **Class 9–10 → Intermediate stream:** FSc Pre-Medical, FSc Pre-Engineering, ICS, I.Com, FA/Humanities, General Science, DAE; or A-Level bundles.
- **Class 11–12 → university field and entry tests:** medicine, engineering, computing, business, sciences, arts and design, social sciences, law, education, media.

Careers appear as "where this path leads". Eligibility rules (e.g. no medicine without Biology) are applied as "doors".

## Scope

**In scope:**

- Bilingual onboarding with class-code join, nickname and PIN, and parental consent before any data leaves the phone.
- **"Your Year":** prologue, 4 weeks, the letter, the Blueprint, and "Try a day" simulations (4 in FYP-2).
- Offline play with event sync.
- Server-side scoring and ranking.
- Results: top-3 + Plan B, with reasons, confidence and doors.
- Stream and career library (O\*NET content, fetched server-side and localised).
- Family share link.
- Counsellor dashboard and admin console.

**Out of scope:**

- Questionnaires inside the product.
- Big Five scoring for recommendations; BART, Emotify and Easy/Hard games.
- Chat or social features, leaderboards, streaks, ads, in-app purchases.
- University search, scholarships, counsellor marketplace.
- Unity, 3D and video interviews.
- Users outside class 8–12.

## Product principles

1. **Game-only.** There are no questionnaires, and each kind of evidence is kept separate:
   - interests come from **story choices** (planner picks and Dil/Duniya forced-choice pairs);
   - abilities come from **everyday tasks** (six ICAR-style families);
   - work values come from **story dilemmas**.

   The O\*NET Interest Profiler is used only as a research benchmark in supervised pilot sessions, never in the app.
2. **No test feel.** No visible timers, no scores out of 100, no right/wrong feedback, a practice scene first. Never use the words "test" or "exam".
3. **Honest AI.** The letter becomes readable only as fast as the model's real certainty, and it can blur again. Every result says why.
4. **Explainable top-3 + Plan B.** Never a single verdict. Every recommendation shows its reasons, confidence, eligibility doors with sources, a Plan B, and the line "a starting point, not a verdict".
5. **Privacy for minors.** Nickname only; no CNIC, phone, email, location or photos from students; no third-party SDKs that receive student data. Parental consent comes before any sync. Research use is opt-in and off by default. Data is exportable and deletable. The ICO Children's Code is the benchmark.
6. **Offline-first.** Every event is written to SQLite before the story advances, and sync is idempotent. Every week is playable without internet on a 4 GB Android phone.
7. **Urdu + English.** Roman Urdu / English dialogue, full Urdu UI (Gulzar, RTL), switchable at any time, at a Grade 6 reading level.
8. **Ethical gamification.** No streaks, loss framing, leaderboards or loot boxes. Rewards are for participation, never for answers. Pause any time with progress kept. Notifications are opt-in only.
9. **Fair on cheap phones and across genders.** Score choices, accuracy and level on the first attempt; response time is logged but never scored. Gender is never a model input, and a fairness audit checks the results.

## Brand

- **Logo:** the Branch.
- **Mascot:** Hudhud (chubby hoopoe).
- **Colours:** terracotta and teal on parchment, with a deep-teal dark mode.
- **Fonts:** Bricolage Grotesque + Plus Jakarta Sans + Gulzar.
- **Icons:** Lucide.

Files are in `design/brand`, tokens in `design/tokens`.

## Architecture (one paragraph)

**The app:**
- An **Expo SDK 58 / React Native 0.88 / TypeScript / expo-router** app runs the story with **inkjs** (Ink scripts) inside a shared week loop.
- Tasks are rendered with Skia, Reanimated and Gesture Handler, and characters are animated with Rive.
- Each interaction becomes an event in envelope v3 and goes into an encrypted **expo-sqlite outbox**.
- The outbox syncs in idempotent batches to a **FastAPI** service backed by **PostgreSQL**. Raw events are append-only.

**Scoring** happens in the Python package `rahyaab_scoring`, which grew out of the `career-game-prototype` engine:
- **M1:** interests with **Thurstonian IRT** on the forced-choice data, plus a graded response model on reaction taps, pre-calibrated by simulating game choices from the public 145k RIASEC dataset and recalibrated on the pilot. Scenes are picked adaptively.
- **M2:** abilities with a staircase and then Rasch/2PL.
- **M3:** paths ranked with versioned, config-driven models: counsellor rules and RIASEC congruence as baselines, and a LightGBM ranker with SHAP only if it wins and passes the fairness audit.
- **M4 (optional):** a self-hosted small LLM with LoRA that only rewrites explanations, never ranks.
- Eligibility rules come from `design/game/frameworks/streams.json`. Every result is stored with its contribution vector and model version.

**Other surfaces:** the same API serves a server-rendered **parent view** and a **React + Vite dashboard**. Everything runs with `docker compose` on one small Linux VM, so it can move to an accredited Pakistani cloud.

## Repository layout

**Already in the repo:**

```
design/             Brand (logo, mascot, app icons), tokens (json, css, theme.ts), specs, previews,
                    game/GAME_DESIGN.md, game/frameworks/*.json
docs/               README.md, project/ (this brief, SRS, screens, CI/CD, contributing), research/, archive/
src/                Expo app (current scaffold)
prototypes/career-game-prototype/  Python engine the scoring package grows from
```

**Planned as the build grows:**

```
frontend/mobile/        Expo app: app/ (routes), story/ (Ink), tasks/<family>/, telemetry/, scoring-ts/, i18n/{ur,en}
frontend/dashboard/     Counsellor/admin web (React + Vite + TS)
backend/api/       FastAPI: auth, consent, content, events, results, share, dashboard, admin (OpenAPI 3.1)
services/scoring/   rahyaab_scoring: validation, TIRT/GRM, staircase, rules, ranker, explanations, rescore
content/            Compiled Ink story, task banks, fixtures (frameworks live in design/game/frameworks/)
research/           Notebooks: M1 (TIRT simulation on public RIASEC data), M2, M3, M4; pilot analysis
_archive/           Old prototypes (Big Five Pygame, BART/Emotify/Hanoi, browser RIASEC game)
.github/workflows/  CI: mobile, api/scoring, content and story-tag validation, dashboard, security
```

## Ways of working

- **Process:** Scrum with 2-week sprints. One branch per issue (`feat/<#>-name`) and Conventional Commits.
- **Main branch:** protected; PRs need review by another team member and green CI. Merge with Squash and merge by default (one commit per PR, credited to its author, while the PR page keeps every commit); merge commits and rebase merges are also allowed.
- **Hygiene:** no secrets, `.env` files, `__pycache__` or real session data in the repo.
- **Attribution:** commits, documents and code carry no AI-tool attribution.

## Definition of Done (summary)

A change is done only when all of the following hold:

1. It is merged through a reviewed PR with CI green (tsc strict, ESLint, ruff, mypy, Jest/pytest, coverage gates, content and story-tag validator).
2. Its acceptance criteria are demonstrated, with tests. Scoring changes also need TS↔Python **parity tests**.
3. It works in **Urdu RTL and English** and in light and dark mode. It passes accessibility checks (48 dp targets, design tokens only, labels, no colour-only meaning) and runs on the reference low-end Android device or its emulator profile.
4. New telemetry events are documented. Docs, ADRs and OpenAPI are updated. It has been demoed in the sprint review.

## Key references

- [`SRS.md`](./SRS.md) v1.5: requirements (108 FRs, 77 NFRs), the game's requirements view, UX and visual system, architecture, ML experiments M1–M4, test plan, risks, traceability, research instruments.
- [`SCREENS.md`](./SCREENS.md): every screen per user, with IDs matching the SRS.
- [`design/game/GAME_DESIGN.md`](../../design/game/GAME_DESIGN.md): the final game design, frameworks, models and datasets.
- [`docs/research/`](../research/): the three research reports and all research notes.
