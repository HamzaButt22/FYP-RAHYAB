# Building Rahyaab with AI coding assistants

How the team uses AI coding assistants (agentic coding tools and chat LLMs) to build Rahyaab quickly **without** losing quality, privacy, authorship or marks. This guide is tool-neutral.

Project rules for agents live in a local, git-ignored `AGENTS.md`. Each tool's own configuration stays on the developer's machine.

## 1. Ground rules

The step-by-step start (tools, monorepo, Sprint 1 issues) is in `GETTING_STARTED.md`.


1. **The docs are the spec. Point the assistant at them every time.**
   - Requirements: `docs/project/SRS.md` (FR and NFR IDs).
   - Scope and timing: `docs/project/MVP.md`.
   - API contract: `docs/api/openapi.yaml`.
   - Database: `database/schema.sql`.
   - Decisions: `docs/architecture/adr/`.
   - Look: `design/tokens/theme.ts` and `design/screens/*.html`.
   - Game data: `design/game/frameworks/*.json`.
   - Errors: `design/specs/forms-and-errors.md`.
   - Exceptions: `docs/project/EDGE_CASES.md`.
   - Tests: `docs/testing/TEST_CASES.md`.
2. **One issue = one branch = one task for the assistant.** Keep each change small enough to review in 15 minutes.
3. **Tests first.** Ask for the test cases (by TC- ID) before the code. Then ask the assistant to run the tests, lint and typecheck before saying it is done.
4. **Plan before editing** anything that touches more than 3 files. Read the plan, correct it, then let it edit.
5. **You commit, not the assistant.** Review the diff line by line, run it, then commit under your own name. Turn off any "co-authored-by" or attribution trailers in your tool's settings.
6. **Never paste real student data**, pilot exports, secrets, `.env` files or tokens into any assistant or LLM. Use the synthetic fixtures.
7. **Understand every line you commit.** FYP LO6 grades each member's own commits, and viva questions will test it. Check and follow Riphah's policy on declaring AI assistance in the FYP report.
8. **Expo moves fast.** Make the assistant read the versioned Expo docs (SDK 58) before writing Expo code (the rules are in `AGENTS.md`).

## 2. Set up once (each developer)

- Install your chosen coding assistant and open it **in the repository folder**. It then reads `AGENTS.md` and the docs.
- Keep tool-specific files local; `.gitignore` already ignores the common tool folders and files, and `AGENTS.md`. If your tool reads a different file name, create it locally and have it include or point to `AGENTS.md`.
- Give the assistant permission to run: `pnpm`, `npx expo`, `uv`/`pytest`, `docker compose`. **Don't** let it push, force-push or change GitHub settings.
- Connect the Figma file if your tool supports it, so it can read the screens and variables.

## 3. The task loop

```
Pick issue (MVP sprint)  →  "Plan this, citing FR/TC IDs and files"  →  correct the plan
→  "Write the tests for TC-…, run them, they should fail"  →  "Implement until they pass; run lint, typecheck, tests"
→  you review the diff and run the app  →  ask a second model to review the diff  →  you commit and open a PR
→  teammate reviews  →  merge
```

**A second opinion is cheap.** Paste the diff, never data, into a different LLM and ask: "Review this for bugs, security problems against docs/security/SECURITY.md, and missing tests." Fix what is real.

## 4. Prompt templates

**Scaffold (once, S1):**
> Read docs/architecture/adr/ADR-0014 and docs/architecture/README.md. Propose the monorepo layout: `frontend/mobile`, `frontend/dashboard`, `backend/api`, `backend/scoring`, `frontend/shared`, `content/`. Don't move or edit the existing prototypes (`RahYaab Application/`, `prototypes/career-game-prototype/`, `archive/riasec-career-game/`, `demos/`). Show the plan first.

**API endpoint:**
> Implement `POST /v1/auth/student/join` exactly as specified in docs/api/openapi.yaml, using the tables in database/schema.sql. Follow FR-03, FR-04, FR-100 and FR-102, and design/specs/forms-and-errors.md (field `errors[]` with message keys; generic code errors per NFR-74). First write pytest tests for TC-ONB-02, TC-ONB-03, TC-ONB-04, TC-VAL-03, TC-VAL-07 and TC-EDGE-06. Then implement, and run `ruff`, `mypy` and `pytest`.

**Mobile screen:**
> Build screens S-01 to S-03 in Expo Router (SDK 58; read the versioned docs first). Use `design/tokens/theme.ts` for every colour, space and font; no hex values in components. Match `design/screens/S-01…`, `S-03…` and `S-03e…` HTML in light and dark. Add `accessibilityLabel`s and a read-aloud button (FR-96). Use pickers for class and birth year. Run `npx expo lint` and `npx tsc --noEmit`.

**Scoring:**
> In `backend/scoring`, implement the congruence recommender from SRS §12.6 M3(b) and the eligibility gates and `routes` from design/game/frameworks/streams.json (FR-44, FR-45, FR-99 with the anti-push rule in EDGE_CASES §3.3). Pure functions only. Tests first: TC-SCORE-01, TC-SCORE-04, TC-EDGE-01 to TC-EDGE-04 and 20 golden profiles.

**Content (Daniyal):**
> Draft Week 1 scene 1 in Ink, following GAME_DESIGN.md §6–9 and pairs.json week 1, with tags `#pair`, `#left` and `#voice`. Roman Urdu dialogue, at most 2 lines per message, Grade 6 level. Mark every line for Urdu-editor review.

Treat AI-drafted dialogue and Urdu as a **first draft**. A native editor and a "cringe check" with real teens are still required (T-CONT).

**Tests and resilience:**
> Write a Locust file for the load, spike and soak profiles in docs/testing/TEST_STRATEGY.md §3.1, against staging only, using synthetic tokens from the seed script.

## 5. Who drives what

| Member | Main assistant use | Always does by hand |
|---|---|---|
| Hamza (mobile) | Screens from the HTML designs, task modules, outbox and sync, Maestro flows | Device testing on the reference phone, performance profiling, final UX feel |
| Zahid (backend) | Endpoints from OpenAPI, migrations from `schema.sql`, scoring functions, CI workflows, Locust and chaos scripts | Security review, data-model decisions, deployments, secrets |
| Daniyal (UX and content) | Ink drafts, string tables, dashboard screens, FAQ and help copy | Story voice, Urdu review, usability sessions, ethics forms |

## 6. Don't delegate

- **Ethics and consent decisions:** the consent text, the assent text, research inclusion.
- **Board rules:** verify every route, gate and age rule with a real source; an LLM's memory is not a source.
- **Security keys and production access.**
- **Psychometric conclusions:** the model fits, validity claims and fairness results must be computed and checked by you.
- **The final report's argument.**

## 7. Your AI stack and who does what

The team has three kinds of assistant. Use each for what it is best at, and keep **student data out of all of them**.

| Tool | Best at | Use it for | Don't use it for |
|---|---|---|---|
| **Primary coding agent** (your paid plan, in VS Code or the terminal) | Agentic work across many files: reading the docs, planning, editing, running tests | The task loop in §3: features against FR/TC IDs, refactors, test suites, CI files, migrations, debugging failing tests | Large mechanical rewrites you could script; pasting secrets |
| **Gemini Pro** (student plan; Gemini Code Assist in VS Code, Gemini in the browser, NotebookLM) | Very long context; Google Search grounding; reading PDFs | **Second-opinion reviews** of diffs; research (board rules, Expo and Play policy changes; always confirm with the source); turning `docs/` into report chapters and slides; NotebookLM over the SRS, GDD and research notes to rehearse viva questions | Final facts without a citation |
| **Local Qwen3-32B** (Ollama on your PC; Continue extension in VS Code) | Private, free, offline, unlimited | Autocomplete and quick explanations; drafting **synthetic** test data and fixtures; reviewing anything that must not leave your machine; Roman Urdu dialogue *drafts* | Big multi-file changes (slower, less reliable); anything that needs the latest library versions |

**Setting up the local model (once):**

```bash
ollama pull qwen3:32b
```

- **Continue:** install the extension (it's in the recommended list) and add Ollama as a provider with model `qwen3:32b` for chat and edit. A smaller model (for example `qwen2.5-coder:7b`) makes autocomplete faster.
- **Speed:** a 32B model needs about 20 GB of VRAM or RAM. If it's slow, use the 14B version for chat.

**A typical feature, using all three:**
1. **Plan:** ask the primary agent for a plan citing FR, TC and file names. Correct it.
2. **Tests first:** the agent writes the tests from `TEST_CASES.md`, runs them, and they fail.
3. **Implement:** the agent implements until lint, typecheck and tests pass. Use local Qwen for quick questions while you read along.
4. **Second opinion:** paste the diff (never data) into Gemini: "Review against docs/security/SECURITY.md and the PR checklist; list bugs and missing tests."
5. **You decide:** fix what is real, run the app on a phone, commit under your own name, and open a PR for a teammate.

**Budget tips:**
- Pro plans have usage limits. Use the primary agent for multi-file work and tests, Gemini for reading and reviews, and local Qwen for everything small.
- Start a fresh agent session for each issue, and point it at the specific docs rather than "read everything".

**Keep the repository clean:**
- Agent config files stay local (`.gitignore` covers them, and `AGENTS.md` holds the project rules).
- Turn off co-author or attribution trailers in each tool.
- **You** commit.

## 8. Your first week with an assistant (S1)

1. Commit `design/`, `docs/` and `project-summary/`. Run the `git rm --cached` step in `docs/devops/CI_CD.md` §7.
2. Scaffold the monorepo (prompt above). Add the CI workflows from `CI_CD.md` §2, starting with lint, typecheck and tests.
3. Build the FastAPI skeleton with `/health`, the schema v1 migration, and the join endpoint with its tests.
4. Build the Expo theme from `theme.ts`, plus screens S-01 to S-03 with field help.
5. Write the seed script for schools, classes and consent (MVP §2.3).
6. Demo join → home on the reference phone at the sprint review.
