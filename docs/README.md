# Rahyaab documentation

Start here. Current design files live in `design/`. This folder holds the project documents, the pre-development engineering documents, and the research behind them.

## Folders

This folder holds the documents. The code and infrastructure live next to it at the repository root (see the root `README.md`): `frontend/` (mobile app, dashboard), `backend/` (API, scoring), `database/` (schema), `infra/` (Docker, Kubernetes, backups) and `.github/` (CI/CD).


| Folder | What |
|---|---|
| `project/` | Requirements and product: SRS, **MVP plan**, **edge cases**, **AI build guide**, brief, screen list, **committee Q&A**, brand decisions, store and search plan, contribution rules, review of the earlier prototype |
| `architecture/` | System design (C4, UML, DFD, ERD), the SQL schema, ADRs, RFCs |
| `api/` | OpenAPI 3.1 specification and a readable reference page |
| `devops/` | CI/CD pipeline design; deployment (Docker, staging, production, Kubernetes decision) with templates; repository audit, cleanup and branch plan |
| `university/` | Riphah FYP templates 01, 02, 04 filled in (the `.docx` files stay local; see the README) |
| `security/` | Threat model, compliance mapping, data retention and encryption policy, DPIA |
| `legal/` | Privacy policy and terms of use (drafts for review) |
| `ethics/` | Consent, assent and permission forms (English, with Urdu drafts) |
| `testing/` | Test strategy and plan; test cases and acceptance criteria |
| `research/` | Research reports and notes |
| `archive/` | Superseded versions, kept for history |

## Pre-development artifacts

| Artifact | Document |
|---|---|
| **Requirements and scope:** SRS | `project/SRS.md` (v1.3: 106 FRs, 77 NFRs, MoSCoW in §4.2, use cases, RTM) |
| **Planning:** WBS and Gantt chart | `project/PLAN.md` |
| **Scope:** MVP for both semesters | `project/MVP.md` |
| **Scope:** exceptions and edge cases | `project/EDGE_CASES.md` |
| **Technical alignment:** RFCs and ADRs | `architecture/rfc/` (4), `architecture/adr/` (14) |
| **Technical alignment:** API specification | `api/openapi.yaml` (validated), `api/README.md`, `api/api-reference.html` |
| **Infrastructure:** CI/CD pipeline design | `devops/CI_CD.md` |
| **Infrastructure:** deployment, Docker, staging, Kubernetes | `devops/DEPLOYMENT.md`, `infra/docker/` (repository root) |
| **Repository:** audit, cleanup, branches, what to push | `devops/REPOSITORY.md` |
| **Getting started:** tools, monorepo, Sprint 1 issues | `project/GETTING_STARTED.md` |
| **Security:** threat modelling | `security/SECURITY.md` (STRIDE per component) |
| **Security:** compliance mapping | `security/COMPLIANCE.md` |
| **Security:** data retention and encryption policies | `security/DATA_GOVERNANCE.md` |
| **Security:** Data Protection Impact Assessment | `security/DPIA.md` |
| **Legal and ethics:** privacy policy, terms, consent forms | `legal/`, `ethics/CONSENT_FORMS.md` |
| **Testing:** test strategy and plan | `testing/TEST_STRATEGY.md` (includes load, stress, spike, soak, break-point, monkey and chaos tests) |
| **Testing:** test cases and acceptance criteria | `testing/TEST_CASES.md` (Gherkin + 131 cases + authorisation matrix) |
| **Evidence for the committee:** how the app measures and is validated | `project/SCIENTIFIC_BASIS.md` |
| **Design decisions:** why each colour, screen, word, game mechanic and model | `project/DESIGN_RATIONALE.md` |
| **Committee preparation:** CCP, the guide's claims and evidence, FYP-1/FYP-2 checklist, likely questions | `project/COMMITTEE_QA.md` |
| **Independent review:** 366 issues from five reviewers, each checked and resolved | `project/REVIEW_LOG.md` |

## System design

| View | Where (`architecture/diagrams/`) |
|---|---|
| **UML structural:** class, object, component, deployment, package, composite structure, profile | `uml/class-domain`, `uml/object-snapshot`, `uml/component`, `uml/deployment`, `uml/package`, `uml/composite-structure`, `uml/profile` |
| **UML behavioural:** use case, sequence, state machine, activity | `uml/use-case`, `uml/seq-01`…`05`, `uml/state-*` (4), `uml/activity-*` (3) |
| **Data flow diagrams** | `dfd/dfd-0-context`, `dfd/dfd-1`, `dfd/dfd-2-scoring` |
| **Entity-relationship diagrams** | `erd/erd-0`…`erd-4`, plus `database/schema.sql` (repository root) |
| **C4 model:** context, containers, components, code | `c4/c4-1-context`, `c4/c4-2-containers`, `c4/c4-3-components-api` and `-app`, `c4/c4-4-code-scoring` |

All 35 diagrams are PlantUML (`.puml`) in standard notation, with SVG and PNG exports. The written walkthrough is `architecture/SYSTEM_DESIGN.md`.

## Which document answers what

| Question | Read |
|---|---|
| What is the game, and how does it measure students? | `design/game/GAME_DESIGN.md` (final, v3) |
| Which frameworks, pairs, streams and gates, as data? | `design/game/frameworks/` |
| What does the app look like? Logo, mascot, colours | `design/README.md`, `design/APPROVED.md`, `design/brand/BRAND_GUIDELINES.md` |
| The app screens (light, dark, Figma, PNG) | `design/screens/README.md` |
| Accessibility and accommodations | `design/specs/accessibility.md` |
| What exactly must the system do? | `project/SRS.md` |
| What do we build, and in which semester? | `project/MVP.md` |
| What about unusual students (re-taking class 9, late or older learners, O/A Level, DAE)? | `project/EDGE_CASES.md` |
| How do forms guide users when they make mistakes? | `design/specs/forms-and-errors.md` |
| How do we build it with AI assistants? | `project/BUILD_GUIDE.md` (including the AI stack: primary coding agent, Gemini Pro, local Qwen3-32B) |
| How do we start development? | `project/GETTING_STARTED.md` |
| Which branches and folders do we keep or remove? | `devops/REPOSITORY.md` |
| How do we prove the results are valid? | `project/SCIENTIFIC_BASIS.md` |
| Why was each design choice made? | `project/DESIGN_RATIONALE.md` |
| How is it built? | `architecture/SYSTEM_DESIGN.md` |
| Why was it built this way? | `architecture/adr/README.md` |
| What does the API look like? | `api/openapi.yaml` |
| How is it secured, and what laws apply? | `security/SECURITY.md`, `security/COMPLIANCE.md`, `security/DATA_GOVERNANCE.md` |
| How is it tested? | `testing/TEST_STRATEGY.md`, `testing/TEST_CASES.md` |
| How does code ship? | `devops/CI_CD.md`, `project/CONTRIBUTING.md` |
| Play Store listing, website SEO and AI search | `project/STORE_AND_SEARCH.md` |
| One-page project summary | `project/PROJECT_BRIEF.md` |
| Every screen, by role | `project/SCREENS.md` (the screen list is still valid; the visuals are superseded by `design/`) |
| How the brand was chosen | `project/BRAND_DECISIONS.md` |
| Review of the earlier prototype and plan | `project/FYP_REVIEW.md` |

## Research

| Folder | What |
|---|---|
| `research/reports/` | Three full reports: career-guidance games for Pakistan, the literature review, and teen needs and app design |
| `research/notes/Career guidance games app Pakistan/` | Assessment frameworks, competitors, game-based assessment, stream mapping, tech stack and privacy |
| `research/notes/Career guidance games literature review/` | Measurement validity, guidance interventions, Pakistan and South Asia studies, recommender systems, serious games |
| `research/notes/Teen career app needs and design/` | Student, parent, counsellor and school needs; mobile context and NFRs; accessibility and colour; competitor features; teen games |
| `research/notes/Design round 2/` | App UI patterns, colour and logo research, game design research |
| `research/notes/Full-text papers/` | Notes from the full-text papers and the claim-verification log (corrections to earlier citations) |

## Archive

`archive/` holds superseded versions: game design v1, the Fern design system, and early app and SRS drafts. They are kept only for history.

The repository-root folder `System Design/` holds the old draw.io diagrams of the Big Five design. They are superseded by `architecture/`.

## Status (4 Nov 2026)

**Done:**
- research;
- brand (logo, mascot, palette, tokens, app icons);
- final game design;
- framework data;
- SRS v1.1;
- the app screens (light, dark, Figma);
- accessibility, security, store and SEO plans;
- all pre-development artifacts and the system design;
- **v1.2 (5 Nov):** edge cases, guided errors, resilience tests, the combined MVP, the AI build guide, 3 new screens, and the `.gitignore` clean-up.

**Still to do:**
- untrack 4 old files (`devops/CI_CD.md` §7) and add the CI workflow files (Sprint 1);
- verify the board rules for routes (switch windows, re-take, additional subject) and the age rules;
- import the 3 new screens into Figma and refresh 5 FigJam diagrams when the Figma limit resets;
- confirm the items marked **verify** in `security/COMPLIANCE.md` with the ethics office;
- draw the scene illustrations and the avatar builder, add high-contrast tokens, and make Urdu (RTL) screens;
- write the Ink script;
- build;
- run the pilot.
