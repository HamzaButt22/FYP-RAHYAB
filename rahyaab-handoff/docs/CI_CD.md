# CI/CD pipeline

How Rahyaab's code is checked and shipped. Everything runs on GitHub Actions (free for public repositories).

## Overview

```
feature branch ──PR──► CI (lint, typecheck, tests, coverage) + Security (secrets, CodeQL, dependency review)
                         │ all green + 1 teammate approval
                         ▼
                       main ──manual──► Release Android build (EAS) ──► test APK for the team / pilot
```

| Workflow | File | Runs on | What it checks |
|---|---|---|---|
| CI | `.github/workflows/ci.yml` | every PR, every push to `main` | **Mobile** (only if app files changed): `pnpm lint`, `tsc --noEmit`, unit tests, Expo dependency check. **Engine** (only if `career-game-prototype/` changed): ruff lint, pytest on Python 3.13 and 3.14, coverage gate of 90% on the scoring logic |
| Security | `.github/workflows/security.yml` | every PR, push to `main`, weekly | gitleaks secret scan over full history, CodeQL static analysis (TypeScript and Python), dependency review (blocks new high-severity vulnerable packages) |
| Release Android build | `.github/workflows/release-android.yml` | manual ("Run workflow") | Builds an APK on Expo EAS with the chosen profile |
| Dependabot | `.github/dependabot.yml` | weekly / monthly | Opens update PRs for npm, pip and GitHub Actions. Expo and React Native packages are excluded: upgrade those together with `npx expo install --fix` |

Coverage today (measured 31 Oct 2026): the scoring logic in `career-game-prototype/engine` is at 96% (801 statements). The pygame window files (`*_app.py`, `session_report.py`) are excluded from the gate in `.coveragerc` because they need a display.

## One-time setup on GitHub (repository owner)

1. **Protect `main`**: Settings → Branches → Add branch ruleset (or classic rule) for `main`:
   - Require a pull request before merging, with 1 approval.
   - Require status checks to pass: `Mobile app (lint, typecheck, test)`, `Scoring engine ... - Python 3.13`, `Scoring engine ... - Python 3.14`, `Secret scan (gitleaks)`, `CodeQL (javascript-typescript)`, `CodeQL (python)`. (They appear in the list after the workflows have run once.)
   - Block force pushes and deletions.
2. **Enable security features**: Settings → Code security → turn on Dependabot alerts, Dependabot security updates and Secret scanning (with push protection).
3. **Expo build secret** (only when you want cloud APK builds): create an access token at expo.dev → Account settings → Access tokens, then GitHub → Settings → Secrets and variables → Actions → New repository secret named `EXPO_TOKEN`. Run `npx eas-cli@latest build:configure` once locally to create `eas.json`.

## Run the same checks locally before pushing

App (repo root):
```
pnpm install
pnpm lint
pnpm exec tsc --noEmit
```

Engine (`career-game-prototype/`):
```
python -m pip install -r requirements-dev.txt
python -m ruff check engine tests
python -m pytest --cov=engine --cov-fail-under=90
```

## Raising the bar sprint by sprint

| When | Change |
|---|---|
| Sprint 1 | Add Jest (`jest-expo`) and React Native Testing Library; add a `test` script so the CI test step runs |
| Sprint 2 | Make the Expo dependency check blocking; widen ruff rules (`B`, `I`, `UP`); add a TS/Python parity test job (same seed, same puzzle) |
| Sprint 3 | Add the FastAPI backend job (ruff, mypy, pytest against a PostgreSQL service container) and an OpenAPI schema check |
| Sprint 4 | Add Maestro end-to-end flows on an Android emulator; app-size check (≤ 35 MB download, NFR in SRS) |
| FYP-2 | Deploy staging automatically from `main` (Docker image → server), production on a version tag with manual approval |

## Rules the pipeline enforces (and why)

- Nothing reaches `main` without review and green checks: this is the evidence for teamwork and quality (FYP-LO6).
- Secrets never enter the repo: gitleaks fails the build, and GitHub push protection blocks known token formats.
- Participant data never enters the repo: `pilot_logs/` and `pilot_exports/` are gitignored; never commit real session files.
