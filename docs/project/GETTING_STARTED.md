# Getting started: from documents to code

The first two weeks of development, in order. The scope comes from `MVP.md` (Sprint 1–2), the repository steps from `docs/devops/REPOSITORY.md`, and how to use AI assistants from `BUILD_GUIDE.md`. **Setting up a new computer** (tools, Android SDK, emulator or phone, debugging, known errors) is in `NEW_DEVICE_SETUP.md`.

## 1. Before anyone writes code (this week)

| # | Task | Who | Done when | Status (13 Nov 2026) |
|---|---|---|---|---|
| 1 | Supervisor meeting: approve SRS v1.5, MVP, Template-04 v1.5 and the open questions (GAME_DESIGN §19) | All | Signed change record | Open |
| 2 | Submit the ethics application (DPIA, consent forms, protocol) | Daniyal | Submission receipt | Open (deferred) |
| 3 | Push the pre-development pack and merge the prototype branch (REPOSITORY.md §3, steps 1–4) | Hamza | Both PRs merged; old branches deleted | Done. `zahid/game-levels-research` has no unmerged work and can be deleted |
| 4 | GitHub settings: branch protection, secret scanning, Dependabot, private repository (REPOSITORY.md §7) | Hamza (owner) | Settings screenshot in the first sprint review | Done, except private: the repository stays public until the team has GitHub Pro (branch protection on private repositories needs it) |
| 5 | Replace the Expo template `LICENSE` with your own (ask the supervisor which) | Hamza | New `LICENSE` merged | Done: All rights reserved (#28) |
| 6 | Create the GitHub Project board, with Sprint 1 issues from §4 | Zahid | Issues assigned | Open: no issues on GitHub yet |

## 2. Install the tools (each developer)

| Tool | Version | Why |
|---|---|---|
| **VS Code** | latest | IDE (the recommended extensions are in `.vscode/extensions.json`; VS Code offers to install them) |
| Git | latest | Version control |
| **Node.js** | **24** (what CI uses) + **pnpm 12** (`npm i -g pnpm@12`) | Mobile app, dashboard |
| **Python** | **3.13** through **uv** (`pip install uv`, then `uv python install 3.13`) | API and scoring. Python 3.14 is installed on this PC, but some scientific packages lag behind, so pin 3.13 |
| **Docker Desktop** | latest (already installed here) | PostgreSQL and the API locally |
| **Android**: a physical budget phone with USB debugging, **or** Android Studio's emulator (Android 16 / API 36 platform; any recent x86_64 image) + **JDK 17** | — | Running the app as a development build. Step by step, including the Windows CMake 3.31.6 fix: `NEW_DEVICE_SETUP.md` §3–6 |
| Expo account + `eas-cli` (`npm i -g eas-cli`) | — | Only for cloud builds and shareable APKs; local builds don't need it |
| **Java 17+ and Graphviz** | — | PlantUML diagram previews in VS Code |
| R (+ `thurstonianIRT`, `mirt`) | 4.4+ | Zahid only: the M1 and M2 calibration notebooks |

## 3. The monorepo (done on 9 Nov 2026)

The layout is in place (ADR-0014): `frontend/mobile`, `frontend/dashboard`, `backend/api`, `backend/scoring`, `database/`, `infra/` (Docker, Kubernetes, backup), `.github/workflows/`, `prototypes/` and `archive/`. The root `README.md` explains each folder. To check it works on your machine:

```bash
cd backend/api && uv sync && uv run pytest
```

```bash
cd backend/scoring && uv sync && uv run pytest
```

```bash
cd frontend/dashboard && pnpm install && pnpm build
```

```bash
cd frontend/mobile && pnpm install && pnpm android
```

(`pnpm android` builds and installs the development build; afterwards `pnpm start` is enough. See `NEW_DEVICE_SETUP.md` §5.)

```bash
cd infra/docker && cp .env.example .env && docker compose up -d db api
```

Generate the shared API types when the app first calls the API: `npx openapi-typescript docs/api/openapi.yaml -o frontend/shared/api.d.ts`.

## 3b. VS Code: one place to run, test and debug

1. Open **`rahyaab.code-workspace`** (File → Open Workspace from File). It shows the root plus four project folders, so each Python package and each app gets its own interpreter, linter and test explorer.
2. Accept **"Install recommended extensions"** (the list is in `.vscode/extensions.json`).
3. First run, in the terminal:

```bash
python tools/dev.py up
```

```bash
python tools/dev.py seed
```

This creates the git-ignored `infra/docker/.env` and local secrets, starts PostgreSQL, applies the migration, sets the role passwords, starts the API and jobs worker, and loads the development seed (class codes `RYB-4K2`, `RYB-7Q9`).

**Tasks** (Terminal → Run Task, or Ctrl+Shift+B for the default):

| Task | Does |
|---|---|
| `stack: up` (default build task) / `stack: down` / `stack: logs` | Local database, API and jobs in Docker |
| `db: start`, `db: migrate`, `db: set role passwords`, `db: seed`, `db: reset (delete local data)` | Database steps on their own |
| `check: tests` (default test task), `check: lint and types`, `check: everything (like CI)` | The same checks CI runs, before you push |
| `api: run tests`, `scoring: run tests`, `mobile: typecheck`, `mobile: lint`, `docs: audit`, `openapi: lint`, `k8s: render staging` | Single checks |
| `dashboard: dev server`, `mobile: start Expo`, `mobile: build and install Android app` | Development servers and the app build |

**Debugging** (Run and Debug, F5):

| Configuration | Does |
|---|---|
| `API: FastAPI (debug on :8001, Docker DB)` | Runs the API from source with breakpoints, against the Docker database, as the `api_rw` role. Port 8001, so it can run next to the API container on 8000 |
| `API: debug tests (current file)`, `Scoring: debug tests (current file)` | Debugs the open test file |
| `Jobs worker (debug)` | Debugs the jobs worker |
| `Dashboard: debug in Edge` | Starts Vite and opens Edge with breakpoints in the TSX |
| `Full stack: API + dashboard` | Both at once |

The mobile app is debugged with Expo's own tools: run the `mobile: start Expo` task, then press `j` in its terminal to open the React Native DevTools.

**Note:** the debug configurations point at `.venv/Scripts/python.exe` (Windows). On macOS or Linux, change it to `.venv/bin/python`. Run `uv sync` in `backend/api` and `backend/scoring` once so the virtual environments exist.

## 4. Sprint 1 issues (2–13 Nov), one branch each

| Issue | Owner | Requirements / tests |
|---|---|---|
| Monorepo layout + CI (lint, types, tests, gitleaks, CodeQL) | Hamza | NFR-41, NFR-71 |
| FastAPI skeleton: `/health`, settings, problem+json errors, CORS allowlist, rate limiter | Zahid | NFR-37, NFR-77, TC-SEC-09 |
| Schema v1 migration (Alembic) from `schema.sql`: school, class, student, consent, device, refresh_token | Zahid | §12.4 |
| `POST /auth/student/join` with field errors and generic code errors | Zahid | FR-03, FR-04, FR-100, FR-102; TC-ONB-02–04, TC-VAL-03, TC-VAL-07 |
| Seed script: schools, classes, consent slips (synthetic) | Zahid | MVP §2.3 |
| Expo app: theme from `theme.ts`, fonts, i18n (en/ur), navigation shell | Hamza | NFR-27 |
| Screens S-00, S-01, S-02, S-03 / S-03e with field help and pickers | Hamza | FR-01–04, FR-102; TC-VAL-01–02 |
| Secure store, tokens, encrypted SQLite set-up | Hamza | NFR-39 |
| Ink: prologue draft, and Week 1 scene 1 with tags | Daniyal | FR-20, FR-95 |
| Verify `streams.json` class 9–10 paths and gates with sources | Daniyal | FR-45, NFR-03 |
| Ethics application submitted | Daniyal | §17 |

**Status on 13 Nov 2026:** done and merged:
- monorepo and CI; FastAPI skeleton; schema migration;
- `POST /auth/student/join` (with age assurance and licences); signed token refresh; `POST /consents:claim` (#28);
- seed data with a pilot licence, a teacher and consent slips (`database/seed/dev_seed.sql`);
- scoring: shape-based interest matching with a differentiation gate; O*NET 31.0 path profiles (#25, #28);
- Android development build and the Windows build fix (#29);
- **Expo app shell** (#30): theme and fonts from the tokens, English and Urdu with right-to-left layout, S-01 Language, S-02 Welcome (first card), navigation and the four tabs, the language setting on You, the brand icon and splash.
- **S-03 Join and S-04 Family OK slip** (14 Nov, branch `feat/join-screen`): field help (S-03e), the under-13 stop, the Keystore device key (our own Kotlin module), signed token refresh, claiming the slip now or later; full names blocked in nicknames on the server too. Tested end to end on the emulator against the local API.

Open: the other two welcome cards; read-aloud on field messages (FR-96); the soft check for an unusual class and age (EDGE_CASES §4); rude-word nickname check (forms-and-errors §2); Urdu tall letters such as the madda on آ are clipped in one-line Urdu labels on Android; the encrypted SQLite outbox; the Ink prologue; `streams.json` board routes for Sindh, Balochistan and AJK; the ethics submission; review of `frontend/mobile/src/i18n/locales/ur.json` by a native Urdu editor.

**Definition of done** (SRS §13.4):
- code with tests, CI green, one review;
- works in English and Urdu;
- accessibility labels on every control;
- documentation and OpenAPI updated;
- demoed at the sprint review.

## 5. Daily workflow

In Windows PowerShell 5.1, `&&` and `#` comments don't work: run each line on its own, or use Git Bash.

```
git switch main && git pull
git switch -c feat/<issue#>-short-name
# work with your AI assistant (BUILD_GUIDE.md), tests first
python tools/dev.py check        # everything CI runs (lint, types, tests, docs and stream checks)
git add -p && git commit -m "feat(join): field-level errors (#12)"
git push -u origin HEAD           # open a PR, link the issue, ask a teammate to review
```

**Commit style:** Conventional Commits (`feat`, `fix`, `test`, `docs`, `chore`), naming the issue number. Merge with **Squash and merge** by default (one commit per PR on `main`; the other merge methods are also allowed); after merging, delete the local branch with `git branch -D` (squash merges are not recognised by `-d`).

## 6. What to push before development starts

1. **The pre-development pack:** `design/`, `docs/`, `project-summary/`, `.gitignore`, `.vscode/extensions.json`, `.github/` templates. This is the PR from REPOSITORY.md §3.
2. **The prototype branch**, merged (PR 1).
3. **The cleanup:** the 4 untracked junk files (already staged), and later the archived folders (Sprint 1 PR).
4. **Never push:**
   - `.env` files or keys;
   - `node_modules` or `venv`;
   - participant data;
   - the filled university templates;
   - local AI-tool files.

   `.gitignore` already blocks all of these. Run `git status` before every commit anyway.
