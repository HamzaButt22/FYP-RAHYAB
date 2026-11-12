# Rahyaab: project summary (updated 13 Nov 2026)

What has been done so far, in detail. Everything listed here is in this repository. Sections 1–11 cover the documents and designs made before development; section 12 covers development from 9 Nov 2026. The live status is in `docs/project/GETTING_STARTED.md` §4. Links below are relative to this folder.

## 1. Research (`docs/research/`)

- **3 full reports:**
  - career-guidance games for Pakistan;
  - a literature review (measurement validity, guidance interventions, South Asia studies, recommender systems, serious games);
  - teen, parent and school needs and app design.
- **24 research notes:**
  - assessment frameworks;
  - competitors (CareerCoachs, YouScience, Mindler and others);
  - game-based assessment;
  - stream mapping;
  - tech stack and privacy;
  - colour and logo research;
  - game design research;
  - notes on the full-text papers.
- **A claim-verification log** that corrects earlier citations.
- Superseded drafts are in `docs/archive/`, marked as old.

## 2. Brand (`design/brand/`)

- **What was chosen:**
  - the **Branch** logo;
  - the **chubby Hudhud (B2)** mascot in **terracotta and teal**, the same bird in light and dark.
- **What was rejected:** the "Night hoopoe" mascot, the storybook look, the "AI-app" look, and the roots and GT Road logo ideas.
- **The logo adapts to its background:** twig and leaf in light mode, cream and green in dark mode, white on terracotta. It also comes in one-colour versions and side-by-side lockups.
- **Mascot:** 10 poses (messenger, listening, curious, thinking, reading, headphones, sleeping, waving, celebrating, plain), each in light and dark, as SVG plus PNG at 1×, 2× and 3×. The dark versions have a cream outline, drawn as real shapes so React Native can render it.
- **App icons:** iOS/Expo, the Android adaptive set (foreground, background, monochrome), light and dark splash screens, and favicons.
- **Other:** the Play Store feature graphic (1024 × 500) and `BRAND_GUIDELINES.md`.
- **Index:** [`design/APPROVED.md`](../design/APPROVED.md) lists every approved design and where its editable file is.

## 3. Design system (`design/tokens/`, `design/specs/`, Figma)

- **Colour tokens**, light and dark:

  | Token | Light | Dark |
  |---|---|---|
  | Primary (terracotta) | #B54A2F | #E07A5C |
  | Secondary (teal) | #1F7A7A | #4FB3AE |
  | Accent | #F2B33D | #F2B33D |

  The full set also covers surfaces, text, success, danger and focus colours.
- **Fonts:** Bricolage Grotesque for headings, Plus Jakarta Sans for the interface, Gulzar for Urdu.
- **Icons:** Lucide.
- **Screen sizes:** compact, phone, tablet and desktop breakpoints.
- **The same tokens in four formats:**
  - `tokens.json` (the master);
  - `tokens.dtcg.json` (for Figma);
  - `tokens.css` (for the web);
  - `theme.ts` (for React Native, type-checked).
- **Specs:** components, responsive rules, and accessibility.
- **Figma file "Rahyaab – Final Design v1":**
  - page 01 has the design-system sheet and 58 colour and spacing variables;
  - page 02 has the light screens;
  - page 03 has the dark screens.

  The link is in `design/figma/README.md`.

## 4. Game design (`design/game/`)

- **GAME_DESIGN.md v3, "Your Year":**
  - **Prologue:** Hudhud brings a letter from future you.
  - **Each of the 4 weeks:**
    - plan the week by picking 3 of 6 activities;
    - play 3 scenes, each with Dil vs Duniya choices, sometimes an everyday task, and a quick reaction tap;
    - a value moment;
    - the Sunday diary.
  - **The letter:** it becomes more readable as the app gets surer about you.
  - **After week 4:** the Blueprint (results), then "Try a day" job simulations.
- **What it recommends by class:**
  - class 8 → Matric group;
  - classes 9–10 → FSc or other stream;
  - classes 11–12 → university field.
- **Frameworks:**
  - RIASEC interests (core);
  - 6 ability families modelled on ICAR item types: spatial, abstract, numerical, logic, planning, verbal;
  - O*NET work values, used only to break ties;
  - eligibility rules for each board.

  Big Five is not used.
- **Models:**

  | Model | What it does | How |
  |---|---|---|
  | M1 | Interests | Thurstonian IRT, pre-calibrated on the ~145k RIASEC dataset |
  | M2 | Abilities | Staircase, then Rasch |
  | M3 | Recommender | Rules vs congruence vs LightGBM; the ML ranker is used only if it is clearly better and fair |
  | M4 (optional) | Rephrases explanations | Self-hosted LLM |

- **Data files** in `frameworks/`, as JSON: interests, the choice-pair schedule, abilities, work values, streams with their rules, and scoring settings.

## 5. Requirements and planning (`docs/project/`)

- **SRS v1.2:**
  - 104 functional and 76 non-functional requirements;
  - use cases and personas;
  - a traceability matrix;
  - a risk register;
  - a sprint plan;
  - survey and interview instruments.

  It includes the read-aloud, accessibility and security requirements.
- **Also in `docs/project/`:**
  - `PROJECT_BRIEF.md`;
  - `SCREENS.md` (every screen, with its ID);
  - `BRAND_DECISIONS.md`;
  - `CONTRIBUTING.md`;
  - `FYP_REVIEW.md` (a review of the earlier prototype).

## 6. App screens (`design/screens/`)

- **55 screens, in light and dark** (the main ones below, plus system, dashboard, admin and tablet screens):
  - onboarding;
  - Home;
  - the week planner, a scene, a task and a value moment;
  - the diary and the letter;
  - the Blueprint and "Why this?";
  - sharing;
  - Explore and stream details;
  - Try a day;
  - Family;
  - You, with the accessibility settings;
  - the parent web report;
  - the teacher dashboard.
- **Formats:** editable HTML files, PNG images, and the same screens in Figma.
- **8 Play Store screenshots** with English and Urdu captions.

## 7. Accessibility, security and store

- **Accessibility** (`design/specs/accessibility.md`):
  - read-aloud, including Urdu, with recorded audio when the phone has no Urdu voice;
  - text size up to 200%;
  - high contrast;
  - easy read;
  - a reading font;
  - reduce motion;
  - every task playable with buttons as well as drag;
  - TalkBack and Switch Access support.
- **Security** (`docs/security/SECURITY.md`): a threat model of each part of the system. Four rules apply throughout:
  - no backdoors;
  - no secrets in the app;
  - the server decides results;
  - collect as little data as possible.
- **Store and search** (`docs/project/STORE_AND_SEARCH.md`):
  - the Play listing in English and Urdu, within Play's limits;
  - search terms;
  - the Data safety answers;
  - a website SEO plan;
  - how to get the app cited by AI assistants;
  - a launch checklist.

## 8. Pre-development documents and system design

- **Architecture** (`docs/architecture/`):
  - `SYSTEM_DESIGN.md`;
  - 14 decision records (ADRs);
  - 4 design proposals (RFCs);
  - a PostgreSQL database schema (`database/schema.sql`) that a database parser accepts.
- **API** (`docs/api/`):
  - an OpenAPI specification with 48 endpoints and no validation errors;
  - a readable reference page.
- **DevOps** (`docs/devops/CI_CD.md`): the pipeline, environments, releases, rollback, backups and monitoring.
- **Security** (`docs/security/`):
  - a compliance mapping: Pakistan's draft data protection bill, PECA 2016, Google Play policies, the UK Children's Code, research ethics, licences;
  - the data retention and encryption policy.
- **Testing** (`docs/testing/`):
  - the test strategy and plan;
  - 131 test cases with acceptance criteria (including spike, soak, break-point, monkey and chaos tests);
  - a table of who can access what.
- **35 diagrams** in `docs/architecture/diagrams/`, as PlantUML files in standard notation with SVG and PNG exports (package, composite structure and profile diagrams added on 5 Nov):
  - C4, levels 1 to 4;
  - UML class, object, component and deployment diagrams;
  - a use-case diagram;
  - 5 sequence diagrams;
  - 4 state machines;
  - 3 activity diagrams;
  - data-flow diagrams, levels 0 to 2;
  - 5 entity-relationship diagrams;
  - the CI/CD pipeline.
- **FigJam copies:** 21 of the diagrams are on the [FigJam board](https://www.figma.com/board/G0iIP3edAdYZb6N6ePf6r6).

## 9. Edge cases, MVP and AI build guide (5 Nov 2026)

- **Joining midway:**
  - the class sets the next real decision (class 9 → Intermediate stream);
  - classes 9–12 also get a **fit check of the current group or stream** (FR-99);
  - if a better path is behind a closed door, the app shows the routes: stay (shown first), switch while the board allows, **re-take class 9**, add a subject, or an alternative;
  - costly routes are never pushed;
  - see `docs/project/EDGE_CASES.md` and screen S-10c.
- **Late and older learners:**
  - under 13: neutral stop;
  - 13–17: parental consent;
  - 18+: self-consent;
  - over-age learners: allowed, with routes (private candidate, open schooling, technical);
  - age stored as a band only (FR-100);
  - class check-in for promotion or repeating (FR-101, screen S-31);
  - O/A-Level, DAE, private, returning and madrassa learners (FR-104).
- **Guided errors:**
  - every field says what is wrong, how to fix it, and gives an example, in EN and UR, with read-aloud;
  - secrets and existence checks stay generic, so attackers learn nothing (FR-102, NFR-73, NFR-74);
  - see `design/specs/forms-and-errors.md` and screen S-03e.
- **Resilience tests:** load, stress, spike, soak, break-point, volume, monkey, client endurance, server and client chaos, fuzzing and mutation testing (NFR-75, NFR-76), plus a weekly `resilience.yml` workflow.
- **MVP:** one plan for both semesters in `docs/project/MVP.md`, with a cut order.
- **AI build guide:** `docs/project/BUILD_GUIDE.md`, plus project rules in a local, git-ignored `AGENTS.md`.
- **`.gitignore`:** rewritten for caches, builds, secrets, participant data, logs and local AI-tool files.

## 10. Gaps closed (5 Nov 2026, evening)

- **Everyone included:** boys and girls (gender never used to choose a path; collected only in an opt-in research table for the fairness audit); every class 8–12; every board.
- **Technical and other paths:** Matric Technical, DAE, TEVTA/NAVTTC, engineering technology, nursing and allied health, pharmacy, agriculture and veterinary, CA/ACCA, armed forces, hospitality, IT skills, and fine arts and fashion (`streams.json` 1.2.0).
- **Security:** a CORS policy (NFR-77); staff password reset (FR-106); PIN messages no longer show the tries left.
- **Parents with several children:** a browser-only "My children" list (FR-105).
- **Schools:** many classes per school, teachers linked to several classes, a school admin.
- **New documents:**
  - `SCIENTIFIC_BASIS.md` (how to prove validity to the committee);
  - `DESIGN_RATIONALE.md`;
  - `PLAN.md` (WBS and Gantt);
  - `docs/security/DPIA.md`;
  - `docs/legal/` (privacy policy, terms);
  - `docs/ethics/CONSENT_FORMS.md` (English, with Urdu drafts).
- **Screens:** 55 in total, including splash, loading, offline, saved, career detail, history, PIN, help, school, reminders, re-link, individual sign-up, parent "my children" and consent, staff login with two-step and reset, dashboard and admin, and 2 tablet layouts.
- **MVP:** includes every class mode (including O/A-Level), the technical paths and the adaptive-selection simulation. Re-planned on 9 Nov 2026: 20 h per person per week, individual sign-up moved to post-MVP, and a 6-week pilot with classes 8–10 (5 Apr – 14 May 2027).
- **SRS v1.3:** 106 FRs and 77 NFRs; 131 test cases.

## 11. Diagrams, repository and start-up (5 Nov 2026, night)

- **Diagrams:** all 35 redrawn in PlantUML, in the style of the university's reference examples (UML class, object, component, deployment, package, composite structure, profile, use case, sequence, state and activity; C4; DFD; ERD; pipeline; Gantt). Sources are `.puml`; SVG and PNG exports sit beside them.
- **Repository audit:** `docs/devops/REPOSITORY.md` has the verdict for every folder; the branches (merge the prototype branch, delete `zahid/...` and local `master`); the exact Git commands; the history clean-up for the participant file; and the LICENSE fix.
- **Deployment:** `docs/devops/DEPLOYMENT.md` covers Docker Compose for dev, staging and production, capacity targets, monitoring, and why Kubernetes is not used (with the point at which it would be). Templates (compose, Caddyfile, Dockerfile, `.env.example`) validate.
- **Getting started:** `docs/project/GETTING_STARTED.md` covers the tools, the monorepo, Sprint 1 issues, the daily workflow and what to push. Also added: `.vscode/extensions.json` and `.github` PR and issue templates.
- **AI stack:** `BUILD_GUIDE.md` §7 covers the primary coding agent, Gemini Pro and local Qwen3-32B: who does what.
- **University templates:** 01, 02 and 04 (v1.5) regenerated with the current scope (`docs/university/`; the `.docx` files stay local because they hold phone numbers).

## Repository layout (9 Nov 2026)

The folder was cleaned and reorganised: `frontend/mobile` (Expo app), `frontend/dashboard` (React + Vite shell), `backend/api` (FastAPI skeleton, tests, migration), `backend/scoring` (congruence ranking, tests), `database/` (schema, role set-up, dev seed), `infra/docker` (Compose, Caddy), `infra/k8s` (Kustomize staging and production), `infra/backup` (encrypted off-site backups), `.github/workflows` (ci, security, release, mobile-build) and Dependabot; old work moved to `prototypes/` and `archive/`. Details and the push commands: `docs/devops/REPOSITORY.md`.

## 12. Development (9–13 Nov 2026)

All merged into `main` through pull requests, with CI green:
- **Repository and CI/CD (#4, #14):** monorepo, CI (lint, types, tests on a throwaway PostgreSQL, docs audit, token and stream checks), security scans, release images, Dependabot. `main` is protected.
- **API:** join with a class code, with age assurance and school licences (#15); signed token refresh bound to a device key (#16); claiming a consent slip after joining, with seats counted only for consented students (#28). 79 API tests.
- **Scoring:** congruence by profile correlation, with Holland's differentiation gate for flat profiles (#28). 10 scoring tests.
- **Data:** every path's interest profile derived from O*NET 31.0 (#25); `streams.json` entry rules sourced; board routes verified for KPK, partly for others.
- **Licence:** All rights reserved (#28).
- **Mobile app:** Android development build and the Windows build fix (#29); the app shell (#30): theme and fonts from the tokens, English and Urdu with right-to-left layout, the language and welcome screens, navigation and four tabs, the language setting, the brand icon and splash.
- **Guides:** `docs/project/NEW_DEVICE_SETUP.md` (a new computer, step by step, with known errors) (#31).

## Still to do

- **Privacy, first:** an old participant session file (from the first prototype) is still in the public Git history. Follow `docs/devops/REPOSITORY.md` §5 to remove it, and decide with the supervisor whether it was real participant data.
- **Mobile:** the real join screen with the Keystore device key; the other onboarding cards and field help; the encrypted SQLite outbox; the Ink story; the game weeks, tasks and results screens.
- **Feasibility (FYP-1):** run the V1 simulation and a budget-phone performance spike.
- **Ethics approval** for the pilot with minors.
- **Reviews:** a native Urdu review of the app text and the consent forms; ethics office review of the DPIA, privacy policy and consent forms; counsellor review of `path_occupations.json`.
- **Board rules:** verify the Sindh, Balochistan and AJK routes.
- **Confirmations:** the items marked "verify" in `docs/security/COMPLIANCE.md`.
- **Figma:** import the 31 newer screens (`design/figma/README.md`).
- **Design work:** scene illustrations and the avatar builder; Urdu right-to-left versions of the screen designs.
- **Team process:** create the GitHub issues and project board; make the repository private once the team has GitHub Pro.
- **Committee:** rehearse with `docs/project/COMMITTEE_QA.md`.

## Where to start

- [`docs/README.md`](../docs/README.md): all documents.
- [`design/README.md`](../design/README.md): all design files.
