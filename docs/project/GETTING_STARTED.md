# Getting started: from documents to code

The first two weeks of development, in order. The scope comes from `MVP.md` (Sprint 1–2), the repository steps from `docs/devops/REPOSITORY.md`, and how to use AI assistants from `BUILD_GUIDE.md`.

## 1. Before anyone writes code (this week)

| # | Task | Who | Done when |
|---|---|---|---|
| 1 | Supervisor meeting: approve SRS v1.3, MVP, Template-04 v1.5 and the open questions (GAME_DESIGN §19) | All | Signed change record |
| 2 | Submit the ethics application (DPIA, consent forms, protocol) | Daniyal | Submission receipt |
| 3 | Push the pre-development pack and merge the prototype branch (REPOSITORY.md §3, steps 1–4) | Hamza | Both PRs merged; old branches deleted |
| 4 | GitHub settings: branch protection, secret scanning, Dependabot, private repository (REPOSITORY.md §7) | Hamza (owner) | Settings screenshot in the first sprint review |
| 5 | Replace the Expo template `LICENSE` with your own (ask the supervisor which) | Hamza | New `LICENSE` merged |
| 6 | Create the GitHub Project board, with Sprint 1 issues from §4 | Zahid | Issues assigned |

## 2. Install the tools (each developer)

| Tool | Version | Why |
|---|---|---|
| **VS Code** | latest | IDE (the recommended extensions are in `.vscode/extensions.json`; VS Code offers to install them) |
| Git | latest | Version control |
| **Node.js** | 22 LTS (24 also works) + **pnpm** (`npm i -g pnpm`) | Mobile app, dashboard |
| **Python** | **3.13** through **uv** (`pip install uv`, then `uv python install 3.13`) | API and scoring. Python 3.14 is installed on this PC, but some scientific packages lag behind, so pin 3.13 |
| **Docker Desktop** | latest (already installed here) | PostgreSQL and the API locally |
| **Android**: a physical budget phone with USB debugging, **or** Android Studio's emulator (Pixel, API 34, 4 GB RAM profile) | — | Running the app |
| Expo account + `eas-cli` (`npm i -g eas-cli`) | — | Development builds and APKs |
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
cd frontend/mobile && pnpm install && pnpm start
```

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
| `dashboard: dev server`, `mobile: start Expo` | Development servers |

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

**Definition of done** (SRS §13.4):
- code with tests, CI green, one review;
- works in English and Urdu;
- accessibility labels on every control;
- documentation and OpenAPI updated;
- demoed at the sprint review.

## 5. Daily workflow

```
git switch main && git pull
git switch -c feat/<issue#>-short-name
# work with your AI assistant (BUILD_GUIDE.md), tests first
pnpm -r lint && pnpm -r test     # or: uv run ruff check . && uv run pytest
git add -p && git commit -m "feat(join): field-level errors (#12)"
git push -u origin HEAD           # open a PR, link the issue, ask a teammate to review
```

**Commit style:** Conventional Commits (`feat`, `fix`, `test`, `docs`, `chore`), naming the issue number. Merge with a merge commit.

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
