# Repository: cleanup, layout and what to push

The GitHub repository (`HamzaButt22/FYP-RAHYAB`) and the local folder (`W:\Development\student-career-app`) were scanned on 5 and 9 Nov 2026. The local folder was **cleaned and reorganised on 9 Nov 2026**. Nothing has been committed or pushed for you: the commands in §3 are yours to run.

## 1. Branches

| Branch | Where | What it holds | Action |
|---|---|---|---|
| `main` | GitHub (default) | Merged PRs #1–#3 (Big Five demo, draw.io diagrams, game levels) and the `RahYaab Application` update of 2 Nov (`32c3a0a`, GitHub user NotLighter). Still tracks 3 compiled `.pyc` files and a participant session file | Receives the reorganisation through a PR (§3) |
| `wip/hamza-career-game-prototype` | GitHub + local (checked out) | The career-game-prototype engine and the blank Expo scaffold | Becomes the base of `chore/reorganise` (§3), then is deleted |
| `zahid/game-levels-research` | GitHub | Big Five game levels, already merged into `main` (PR #3) | **Delete** on GitHub |
| `master` | Local only | An unrelated Expo template commit, never pushed | **Delete** locally |

## 2. What was done locally on 9 Nov 2026

**Deleted (all regenerable or junk; nothing that is in Git was lost):**
- `node_modules/` (≈ 460 MB), `.expo/`, `expo-env.d.ts`: recreated by `pnpm install` and `pnpm start`;
- `career-game-prototype/venv/` and every `__pycache__/` and `.pytest_cache/`;
- `riasec_career_game/tmp_check.js` and the participant session file `riasec_career_game/sessions/session_f0ad5760e2bd.json` (both were already staged for removal from Git; the session file is still in Git history, see §5).

**Kept on your machine only (git-ignored, never pushed):** your local AI-assistant settings, `AGENTS.md`, the `review/` tooling, `docs/university/*.docx` (team phone numbers), every `.env` and `secrets/` folder.

**Moved into the new layout:**

| Before | After | Why |
|---|---|---|
| Root Expo scaffold (`package.json`, `app.json`, `src/`, `assets/`, `tsconfig.json`, `eslint.config.js`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`) | `frontend/mobile/` (renamed to Rahyaab, package `pk.rahyaab.app`, EAS profiles added) | The student app |
| — | `frontend/dashboard/` (new: React + Vite skeleton, Dockerfile) | Teacher and admin dashboard (FYP-2) |
| — | `backend/api/` (new: FastAPI skeleton with `/v1/health`, CORS allowlist, problem+json errors, settings checks, Alembic migration `0001`, Dockerfile, tests) | The API |
| — | `backend/scoring/` (new: congruence ranking with tests) | Scoring models (M1–M3) |
| `docs/architecture/data/schema.sql` | `database/schema.sql` (+ `set_role_passwords.sql`, `seed/dev_seed.sql`) | The database |
| `docs/devops/templates/` | `infra/docker/` (Compose, Caddy, `.env.example`) | Deployment on one VM |
| — | `infra/k8s/` (new: Kustomize base + staging and production overlays) | Deployment on Kubernetes when needed |
| — | `infra/backup/` (new: backup image: `pg_dump` → `age` → off-site) | Nightly encrypted backups |
| — | `.github/workflows/` (`ci.yml`, `security.yml`, `release.yml`, `mobile-build.yml`) and `.github/dependabot.yml` | CI/CD |
| `career-game-prototype/` | `prototypes/career-game-prototype/` | Reference for porting the planning task and telemetry |
| `RahYaab Application/` | `prototypes/rahyaab-application/` | Reference only. **Never give a build of it to students:** it shows a demo admin login, uses a non-cryptographic password hash, keeps data in plain storage, and has no role, ownership or consent checks (`docs/project/REVIEW_LOG.md`, prototype pack) |
| `riasec_career_game/`, `demos/big-five-game/`, `System Design/` | `archive/riasec-career-game/`, `archive/big-five-game/`, `archive/system-design-drawio/` | Superseded; kept for history. They can be removed from `main` later after a tag (§4) |

The full layout is described in the root `README.md`.

## 3. Commands, in order (run them yourself)

Run these in VS Code's terminal (Git Bash) in `W:\Development\student-career-app`. Each command is its own block.

**Step 1: tidy local branches.**

```bash
git fetch origin --prune
```

```bash
git branch -D master
```

**Step 2: put the reorganisation on its own branch and check what will be committed.**

```bash
git switch -c chore/reorganise
```

```bash
git add --all --dry-run
```

Read the list. It **must not contain** any `.docx`, `.env`, `secrets/`, `review/`, `node_modules/`, `.venv/`, AI-assistant settings, or session file. Git never adds ignored files, but a file that was force-added in the past would still appear. Then:

```bash
git add --all
```

```bash
git status
```

Moves show as `renamed:`; the 4 junk files show as `deleted:`.

```bash
git commit -m "chore: reorganise into frontend, backend, database and infra; add CI/CD, Docker and Kubernetes"
```

**Step 3: bring in the latest `main` before opening the PR.** `main` has a newer `RahYaab Application` than your branch.

```bash
git merge origin/main
```

Git usually applies `main`'s changes to the moved files by itself. If it reports conflicts, keep the new folder paths (`prototypes/rahyaab-application/…`, `archive/…`) and resolve each file, then `git add` it and `git commit`. Afterwards, stop tracking anything `.gitignore` now covers (for example the `.pyc` files `main` still had):

```bash
git ls-files -ci --exclude-standard
```

If that prints anything:

```bash
git rm -r --cached $(git ls-files -ci --exclude-standard)
```

```bash
git commit -m "chore: stop tracking ignored files"
```

**Step 4: push and open the pull request.**

```bash
git push -u origin chore/reorganise
```

On GitHub: **Pull requests → New → `chore/reorganise` → `main`**. The CI workflow runs on it. Merge with **"Create a merge commit"** (not squash), so everyone's commits stay attributed.

**Step 5: delete the old branches** (after the merge):

```bash
git push origin --delete zahid/game-levels-research
```

```bash
git push origin --delete wip/hamza-career-game-prototype
```

```bash
git switch main
```

```bash
git pull
```

**Step 6: replace the `LICENSE`.** The current file is Expo's template ("Copyright 650 Industries"). Ask the supervisor whether to use MIT with the team's names or "All rights reserved", then commit it on a branch with a PR like every other change.

## 4. Removing the archive later (optional)

When nobody needs the archived folders in the working tree any more:

```bash
git tag archive/pre-rahyaab-v1 -m "Prototypes before the Rahyaab v1 layout"
```

```bash
git push origin archive/pre-rahyaab-v1
```

```bash
git rm -r archive
```

They stay recoverable with `git checkout archive/pre-rahyaab-v1 -- archive`.

## 5. Removing the participant file from history (before the repository is public)

The session file was committed in the past, so it is still in old commits on GitHub. If the repository is, or will become, public:
1. Make sure everyone has pushed their work.
2. Install `git-filter-repo` (`pip install git-filter-repo`).
3. **Tell the team and agree a time.** Merge or close every open PR (their commits will no longer match), and note every tag (`git tag -l`).
4. In a **fresh clone**, remove the file from all history:

```bash
git filter-repo --path riasec_career_game/sessions/session_f0ad5760e2bd.json --invert-paths
```

5. Force-push all branches and tags, and re-create any tags and GitHub releases that pointed at rewritten commits. Old image digests and SBOMs from CI refer to old commit SHAs; note that in the release notes.
6. Ask every teammate to delete their old clone and re-clone. An old clone pushed again would bring the file back.
7. Decide with the supervisor whether the file was a real participant's data. If it was (not a team member's own test play), record a short incident note for the ethics file: what was exposed, for how long, and what was done.

Keep the repository **private** until this is done and the pilot data rules are settled.

## 6. Keeping tool files out of Git

`.gitignore` lists the shared rules. Files that only one person's tools create (for example an AI assistant's settings folder) go in **your own** `.git/info/exclude`, which works like `.gitignore` but is never committed. Before every commit, `git status` should show only project files.

## 7. GitHub settings to switch on before development

- **Visibility:** private during development.
- **Branch protection on `main`:** require a PR with 1 review and the passing `ci` checks; block force pushes and deletions; do not require linear history (CI_CD.md §7).
- **Code security:** secret scanning with push protection, Dependabot alerts and security updates, CodeQL.
- **Environments:** create `staging` and `production` (add a required reviewer to `production`). Per environment, set the variables `DEPLOY_TARGET` (`compose` or `k8s`), `DEPLOY_HOST` and `API_URL`, and the secrets `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS` (Compose) or `KUBECONFIG` (Kubernetes). Add `EXPO_TOKEN` as a repository secret for `mobile-build.yml`.
- **Packages:** after the first `release` run, set the three GHCR images (`rahyaab-api`, `rahyaab-dashboard`, `rahyaab-backup`) to private and give the repository access.
- **Collaborators:** only the team (and the supervisor, if asked). Remove any apps or integrations you don't recognise.
