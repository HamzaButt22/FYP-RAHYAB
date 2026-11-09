# Contributing

## Workflow

1. Every piece of work starts as a GitHub Issue (use the "User story" or "Bug report" template) linked to SRS requirement IDs.
2. Branch from `main`, one branch per issue: `feat/<issue-number>-short-name`, `fix/<issue-number>-short-name`, `docs/...`, `chore/...`.
3. Commit small and often using [Conventional Commits](https://www.conventionalcommits.org/):
   `feat(games): add Power Grid rotation`, `fix(engine): normalise stream scores by measured weight`, `test(engine): parity test for seed 42`, `docs(srs): update roles`.
4. Open a pull request early (draft is fine). Fill in the template. CI and Security must be green.
5. A teammate reviews and approves. The author merges with **"Create a merge commit"** (not squash), so every member's commits stay in the history as evidence of their work (SRS §13.3, CI_CD.md §7).
6. Delete the branch after merging.

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
- Editor or tool folders (`.vscode/`, `.idea/`, AI-assistant config folders), virtual environments, `node_modules/`, coverage output.
