# ADR-0014: Keep one monorepo with pnpm workspaces

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS §13.3 |

## Context

The app, API, scoring package, dashboard, content (Ink and frameworks) and docs change together. Parity tests need shared fixtures.

## Decision

Everything lives in one Git repository (layout set up on 9 Nov 2026):
- `frontend/mobile` (Expo) and `frontend/dashboard` (React + Vite); `frontend/shared` later holds the types generated from OpenAPI;
- `backend/api` (FastAPI) and `backend/scoring` (Python);
- `database/` (the schema design, role passwords, development seed);
- `infra/` (Docker Compose, Caddy, Kubernetes manifests, the backup image);
- `content/` (Ink story and string tables, when writing starts);
- `design/` and `docs/`;
- `prototypes/` (read-only reference) and `archive/` (superseded work).

Each JavaScript app keeps its own pnpm lockfile for now (a root pnpm workspace can be added once code is shared between them), and uv manages each Python package with its own `uv.lock`. CI runs one job per component.

## Consequences

- **Good:** cross-cutting changes land together; one PR shows the app, API and test changes.
- **Cost:** larger clones, and the CI path filters must be kept up to date.

## Alternatives considered

- **One repository per component:** rejected, because versioning across repositories slows a small team.

## Amendment (11 Nov 2026)

The repository was set up in PR #4 with **one pnpm project per app** (`frontend/mobile` and `frontend/dashboard`, each with its own lockfile and `pnpm-workspace.yaml` for build settings), not one root workspace. The monorepo decision stands; root-level `pnpm -r` commands do not apply. `python tools/dev.py check` runs every app's checks, as CI does.
