# Rahyaab (راہ یاب)

A game-based stream and career guidance app for Pakistani students in classes 8–12. Students play a short story game, "Your Year", on an ordinary Android phone; from their choices and puzzles the app estimates their interests and abilities and suggests three education paths they are eligible for, with reasons and a Plan B. Families read the result through a WhatsApp link; teachers follow their classes on a dashboard.

Final Year Project, BS Computer Science, Riphah International University (2026–27). Team: Zahid Bashir, Hamza Butt, Muhammad Daniyal Sarwar. Supervisor: Zeeshan Ali.

## Repository layout

| Folder | What | Start here |
|---|---|---|
| `frontend/mobile/` | Student app: Expo SDK 58, React Native, TypeScript | `frontend/mobile/README.md` |
| `frontend/dashboard/` | Teacher and admin dashboard: React + Vite (FYP-2) | `frontend/dashboard/README.md` |
| `backend/api/` | API: FastAPI, Python 3.13, Alembic migrations | `backend/README.md` |
| `backend/scoring/` | Scoring models: interests (M1), abilities (M2), ranking and eligibility (M3) | `backend/README.md` |
| `database/` | PostgreSQL 16 schema design, role set-up, development seed | `database/README.md` |
| `infra/docker/` | Docker Compose for local development and the pilot server; Caddy | `docs/devops/DEPLOYMENT.md` |
| `infra/k8s/` | Kubernetes manifests (Kustomize: staging and production overlays) | `infra/k8s/README.md` |
| `infra/backup/` | Nightly encrypted, off-site database backup image | `infra/backup/Dockerfile` |
| `.github/` | CI/CD workflows, Dependabot, PR and issue templates | `docs/devops/CI_CD.md` |
| `design/` | Brand, design tokens, 55 screen designs, game design and framework data | `design/README.md` |
| `docs/` | SRS, MVP, plan, architecture, API spec, security, privacy, tests, research | `docs/README.md` |
| `project-summary/` | One-page overview of the project so far | `project-summary/README.md` |
| `prototypes/` | Earlier prototypes, kept as read-only reference | — |
| `archive/` | Superseded work (Big Five demo, RIASEC browser game, draw.io diagrams) | — |

## Quick start

You need Git, Node.js 24 with pnpm, Python 3.13 with [uv](https://docs.astral.sh/uv/), and Docker Desktop. The full guide is `docs/project/GETTING_STARTED.md`.

```bash
cd backend/api && uv sync && uv run pytest
```

```bash
cd frontend/mobile && pnpm install && pnpm start
```

```bash
cd infra/docker && cp .env.example .env && docker compose up -d db api
```

## How work flows

1. Pick an issue on the GitHub project board and create a branch (`feat/…`, `fix/…`, `docs/…`).
2. Open a pull request; the `ci` and `security` workflows must pass and a teammate reviews it.
3. Merge with "Create a merge commit". `main` deploys to staging automatically; a `v*` tag deploys to production after approval (`docs/devops/CI_CD.md`).

Rules that apply to every change are in `docs/project/CONTRIBUTING.md`. Never commit secrets, real student data or `.env` files; the CI secret scan blocks them.
