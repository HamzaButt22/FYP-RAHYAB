# Rahyaab: Project Brief

> Intended location: `docs/PROJECT_BRIEF.md`. Read this first. The full specification is in [`docs/SRS.md`](./SRS.md) (SRS and design spec, v1.0, 31 Oct 2026). If this brief and the SRS disagree, the SRS wins.

## Vision

**"Explore before you lock in."**

Pakistani students choose an academic group at about 14 (Matric) and again at about 16 (Intermediate), mostly without guidance and under family pressure. Rahyaab lets Grade 9–12 students play short games on an ordinary Android phone. It then gives them an **explained shortlist of streams**, which they can explore and talk over with their parents and teachers.

Rahyaab is a BSCS Final Year Project at Riphah International University (FYP-1 Fall 2026, FYP-2 Spring 2027).

- **Team:** Zahid Bashir, Hamza Butt, Daniyal Sarwar
- **Supervisor:** Zeeshan Ali

## Target users

| User | Surface | Core need |
|---|---|---|
| Students, Grades 9–12 (Matric, Intermediate, O/A-Level), often on shared, low-end phones | Mobile app (Urdu/English) | Discover their interests and strengths; see which streams fit and what each one opens or closes |
| Parents/guardians | Web link, no app | A plain Urdu/English report, honest entry odds, alternatives, consent |
| Teachers/counsellors | Web dashboard | Class progress, flags, one-page student summaries, CSV export |
| Admin/researchers | Web console | Schools and class codes, content packs, model versions, audit, de-identified exports |

## Outputs

The app recommends:

- **Matric groups:** Science-Biology, Science-Computer, Humanities, Technical.
- **Intermediate streams:** FSc Pre-Medical, FSc Pre-Engineering, ICS, I.Com, FA/Humanities, General Science, DAE.
- **A-Level bundles.**

Careers appear as "where this stream leads".

## Scope

**In scope:**

- Bilingual onboarding with school-code join and parental consent.
- Journey map with 4 chapters:
  - **Career Bazaar** (interest swipe cards);
  - **Story Town** (branching interest story);
  - **Puzzle Lab** (Power Grid, Glyph Sequence, Pattern Gates, Rotate & Fit, Dukaan Hisaab);
  - **Stream Sims** (optional).
- Offline telemetry with sync.
- Server-side scoring and ranking.
- Results: top-3 + Plan B, with reasons, confidence and doors.
- Stream and career library (O*NET content, fetched server-side and localised).
- Parent share link.
- Counsellor dashboard and admin console.

**Out of scope:**

- Questionnaires inside the product.
- Big Five scoring for recommendations; BART, Emotify and Easy/Hard games.
- Chat or social features, leaderboards, ads, in-app purchases.
- University search, scholarships, counsellor marketplace.
- Unity and video interviews.
- Users outside Grades 9–12.

## Product principles

1. **Game-only.** There are no questionnaires. Interests are measured by **choice games**, abilities by **puzzles**, and the two are never mixed. The O*NET Interest Profiler is used only as a research benchmark in supervised pilot sessions, never in the app.
2. **No test feel.** No visible timers, no scores out of 100, no right/wrong feedback on choices, a practice round first. Never use the words "test" or "exam".
3. **Explainable top-3 + Plan B.** Never a single verdict. Every recommendation shows its reasons, confidence, eligibility "doors" with sources, a Plan B, and the line "starting points, not limits".
4. **Privacy for minors.** Nickname only; no CNIC, phone, location, photos or third-party SDKs that receive student data. Parental consent comes before any sync. Research use is opt-in and off by default. Data is exportable and deletable. The ICO Children's Code is the benchmark.
5. **Offline-first.** Every event is written to SQLite before the UI advances, and sync is idempotent. All chapters are playable without internet, on a 4 GB Android phone.
6. **Urdu + English.** Full Urdu (Noto Nastaliq, RTL, line-height about 1.8) and English, switchable at any time, at a Grade 6 reading level.
7. **Ethical gamification.** No streaks, loss framing, leaderboards or loot boxes. Rewards are for participation, never for answers. Pause any time with progress kept. Notifications are opt-in only.
8. **Fair on cheap phones.** Score accuracy, level reached and first attempt. Response time is logged but never compared across devices; a calibration block exists for research. Gender is never a model input.

## Architecture (one paragraph)

An **Expo SDK 58 / React Native 0.88 / TypeScript / expo-router** app hosts every game as a native module inside a shared **GameShell** (Intro → Practice → Play → Recap), rendered with Skia, Reanimated and Gesture Handler. Each interaction becomes an event in envelope v3, which goes into an encrypted **expo-sqlite outbox** and syncs in idempotent batches to a **FastAPI** service backed by **PostgreSQL**. Raw events are append-only. The Python scoring package `rahyaab_scoring` grew out of the `career-game-prototype` engine (power_grid, glyph_sequence, calibration, session_log, aggregate, stream_transformation_engine). It validates runs, estimates interest θ (graded response IRT, adaptive in R2) and ability levels (staircase, then Rasch), and ranks streams with versioned, config-driven models: counsellor rules and Holland congruence as baselines, with a LightGBM ranker plus SHAP only if it wins and passes the fairness audit. It then applies data-driven eligibility rules and stores every result with its contribution vector and version. The same API serves a server-rendered **parent view** and a **React + Vite dashboard**. Everything runs with `docker compose` on one small Linux VM, so it can be moved to an accredited Pakistani cloud.

## Repository layout

```
apps/mobile/        Expo app: app/ (routes), shell/, games/<id>/, telemetry/, scoring-ts/ (parity ports), i18n/{ur,en}
apps/dashboard/     Counsellor/admin web (React + Vite + TS)
services/api/       FastAPI: auth, consent, content, events, results, share, dashboard, admin (OpenAPI 3.1)
services/scoring/   rahyaab_scoring: validation, IRT/CAT, staircase, fusion, rules, ranker, explanations, rescore
content/            cards.json, stories.json, puzzles.json, streams.json (rules, doors, Plan B), scoring.json, fixtures/
research/           Notebooks: M1 (IRT/CAT on public RIASEC data), M2, M3, M4; pilot analysis
docs/               PROJECT_BRIEF.md, SRS.md, ADRs, diagrams, report chapters
_archive/           Old prototypes (Big Five Pygame, BART/Emotify/Hanoi, browser RIASEC game)
.github/workflows/  CI: mobile, api/scoring, content validation, dashboard, security
```

## Ways of working

- **Process:** Scrum with 2-week sprints. One branch per issue (`feat/<#>-name`) and Conventional Commits.
- **Main branch:** protected; PRs need review by another team member and green CI. Use merge commits, not squash, so each member's commits stay visible.
- **Hygiene:** no secrets, `.env` files, `__pycache__` or real session data in the repo.
- **Attribution:** commits, documents and code carry no AI-tool attribution.

## Definition of Done (summary)

A change is done only when all of the following hold:

1. It is merged through a reviewed PR with CI green (tsc strict, ESLint, ruff, mypy, Jest/pytest, coverage gates, content validator).
2. Its acceptance criteria are demonstrated, with tests. Scoring changes also need TS↔Python **parity tests**.
3. It works in **Urdu RTL and English**, passes accessibility checks (48 dp targets, contrast tokens only, labels, no colour-only meaning) and runs on the reference low-end Android device or its emulator profile.
4. New telemetry events are documented. Docs, ADRs and OpenAPI are updated. It has been demoed in the sprint review.

## Key references

- [`docs/SRS.md`](./SRS.md): requirements (90 FRs, 63 NFRs), game design document, UX and visual system, architecture, ML experiments M1–M4, test plan, risks, traceability matrix, research instruments.
- Research inputs (project workspace): the reports *"Turning mini-games into trustworthy stream advice"* and *"Career games abound, but none validate Pakistani stream choice"*; the *Teen career app needs and design* notes; *Rahyaab FYP review*; *Rahyaab app and game design*.
