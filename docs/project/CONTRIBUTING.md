# Contributing

## Workflow

1. Every piece of work starts as a GitHub Issue (use the "User story" or "Bug report" template) linked to SRS requirement IDs.
2. Branch from `main`, one branch per issue: `feat/<issue-number>-short-name`, `fix/<issue-number>-short-name`, `docs/...`, `chore/...`.
3. Commit small and often using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(games): add Power Grid rotation`, `fix(engine): normalise stream scores by measured weight`, `test(engine): parity test for seed 42`, `docs(srs): update roles`.
4. Open a pull request early (draft is fine). Fill in the template. CI and Security must be green.
5. A teammate reviews and approves. The author merges, by default with **"Squash and merge"**, using the PR title (a Conventional Commit) as the commit message. Each pull request becomes one commit on `main`, credited to the PR's author; the individual commits stay visible on the PR page, so each member's work is still on record (SRS §13.3, CI_CD.md §7). "Create a merge commit" and "Rebase and merge" are also allowed; all three keep each author's name on their work. If a teammate also committed to the branch, keep their `Co-authored-by:` line in the message so GitHub credits them too.
6. Delete the branch after merging: GitHub does it on the server; locally use `git branch -D <branch>` after a squash or rebase merge (`git branch -d` does not recognise them).

Each team member commits under their own GitHub account so contributions are visible.

## Definition of Ready (before work starts)

- Issue has a user story, acceptance criteria and requirement IDs.
- Dependencies and designs are available.
- Estimated in story points.

## Definition of Done

- Acceptance criteria met and covered by tests.
- CI and Security green; coverage gate holds.
- Reviewed and approved by a teammate.
- User-facing text is translatable (Urdu and English).
- Accessibility checked for UI changes (48dp targets, contrast, never colour alone).
- SRS or docs updated if behaviour changed.

## Never commit

- Tokens, passwords, `.env` files, keystores (`*.jks`, `*.keystore`).
- Real participant data (`pilot_logs/`, `pilot_exports/`).
- Personal editor or tool folders (`.idea/`, AI-assistant config folders, any `.vscode/` file other than the shared `extensions.json`, `settings.json`, `tasks.json` and `launch.json`), virtual environments, `node_modules/`, coverage output.
