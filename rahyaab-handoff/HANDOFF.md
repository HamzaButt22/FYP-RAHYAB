# Handoff: docs and CI/CD for Rahyaab

This folder mirrors the repository layout. Copy its contents into the repo root (`W:\Development\student-career-app`), keeping the folder structure. This HANDOFF.md file itself does not need to go into the repo.

## Files

| Path in repo | What it is |
|---|---|
| `docs/PROJECT_BRIEF.md` | Short project brief: read first |
| `docs/SRS.md` | Full requirements and design specification |
| `docs/CI_CD.md` | How the pipeline works and how to set up GitHub |
| `docs/CONTRIBUTING.md` | Branching, commits, PRs, Definition of Done |
| `.github/workflows/ci.yml` | Lint, typecheck, tests, coverage gate |
| `.github/workflows/security.yml` | Secret scan, CodeQL, dependency review |
| `.github/workflows/release-android.yml` | Manual EAS Android build |
| `.github/dependabot.yml` | Dependency update PRs |
| `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*` | PR and issue templates |
| `career-game-prototype/requirements-dev.txt`, `.coveragerc`, `ruff.toml` | Engine test and lint config |

## Instructions for the coding assistant in the project folder

Paste this as your first message to the assistant running in `W:\Development\student-career-app`:

> Read `docs/PROJECT_BRIEF.md`, then `docs/SRS.md` and `docs/CI_CD.md`. Do not run any git command that changes state (no add, commit, push, merge, reset); I do all git operations myself.
> Then do these setup tasks and stop for my review:
> 1. In `career-game-prototype/`: run `python -m pip install -r requirements-dev.txt`, then `python -m ruff check engine tests --fix` (one known issue: an unused import in `tests/test_game_app_smoke.py`), then `python -m pytest --cov=engine --cov-fail-under=90` and confirm it passes.
> 2. Add these lines to the root `.gitignore`: `.coverage`, `coverage.xml`, `htmlcov/`, `.ruff_cache/`, `.pytest_cache/`, and remove the duplicate `.claude/` line.
> 3. At the repo root, run `pnpm install`, `pnpm lint` and `pnpm exec tsc --noEmit`, and report any failures without fixing anything outside the scope above.
> 4. Summarise what changed and list the files for me to commit.

## Then you (in the terminal)

```
git switch -c chore/ci-cd-and-docs
git add -A
git status
git commit -m "chore: add CI/CD pipeline, project brief, SRS and contribution guide"
git push -u origin chore/ci-cd-and-docs
```

Open a pull request on GitHub, watch the checks run, then follow `docs/CI_CD.md` → "One-time setup" to protect `main`.

## Decisions still open (see SRS §17.6)

- Team roles: the SRS proposes Hamza = mobile and games, Zahid = backend/scoring/ML, Daniyal = UX/content/dashboard. Template-04 had Zahid = mobile, Hamza = ML/backend, Daniyal = games. Agree one and update SRS §13.
- Six questions for the supervisor are listed in SRS §17.6.
