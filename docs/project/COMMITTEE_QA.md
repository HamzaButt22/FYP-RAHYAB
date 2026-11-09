# Committee preparation: claims, evidence and likely questions

This document prepares the team for the proposal defence, mid-evaluations and the final viva. It follows the university guide *Complex Computing Problems for Final Year Projects*, which says faculty "evaluate evidence", not claims. For each claim the guide lists, it gives our evidence and where it lives. It also shows what is ready now and what each semester must still produce, and answers the questions a committee is likely to ask.

**Status words used below:**
- **Ready:** the document or design exists and has been checked.
- **FYP-1:** to be produced in the first semester (by the mid or final FYP-1 evaluation).
- **FYP-2:** to be produced in the second semester (needs the built app or the pilot).

## 1. Is it a Complex Computing Problem?

Yes. The guide has **one** CCP framework with **nine characteristics**, and asks for a strong mapping to at least 4–5 of them. Rahyaab maps strongly to all nine. The full table, with evidence for each, is in `SRS.md` §3.2.

| # | Characteristic | Rahyaab in one line |
|---|---|---|
| 1 | Range of conflicting requirements | Fun and short play vs measurement precision; personalisation vs privacy of minors; offline vs fresh data |
| 2 | Depth of analysis required | Hidden traits must be estimated from noisy choices, with error bars, then ranked under eligibility rules |
| 3 | Depth of knowledge required | Psychometrics (IRT), recommender ranking, mobile offline sync, security and child-privacy law |
| 4 | Familiarity of issues | No validated game-based interest measure for Pakistani teenagers exists |
| 5 | Level of problem | Beyond routine app development: a psychometric model inside a branching story, calibrated by simulation, on budget phones |
| 6 | Extent of stakeholder involvement | Students, parents, teachers, schools, the ethics committee, boards and councils, with partly opposing goals |
| 7 | Consequences | A wrong stream can cost a student two years; minors' data is at stake |
| 8 | Interdependence | Game → events → offline queue → sync → scoring → ranking → explanation; a fault anywhere changes the result |
| 9 | Requirement identification | "The right stream" has no ground truth; labels must be built with a counsellor panel |

## 2. The guide's claims and our evidence

| Claim (from the guide) | Evidence the guide asks for | Our evidence | Where | Status |
|---|---|---|---|---|
| "Our problem is complex." | CCP characteristics + explanation | Nine characteristics mapped, each with evidence | `SRS.md` §3.2; §1 above | Ready |
| "Our approach is better." | Baseline + experiment + quantitative comparison | Four baselines (random, rules only, questionnaire only, Rahyaab); NDCG@3, top-3 hit rate and κ against a blinded counsellor panel; a learned model is adopted only if it wins by ≥ .05 | `SCIENTIFIC_BASIS.md` §5.2; ADR-0006 | Design ready; results FYP-2 |
| "The model is accurate." | Dataset + metrics + validation/test results | 145,828 open RIASEC responses for a **feasibility** simulation (V1, r ≥ .80); accuracy itself comes from the pilot: O*NET Mini Interest Profiler as the criterion (V2, r ≥ .50 with CI rules), reliability ≥ .70 (V4), with 5-fold cross-validated calibration | `SCIENTIFIC_BASIS.md` §5–5.2; `SRS.md` §14.4 | V1 in FYP-1; V2–V6 in FYP-2 |
| "Our architecture is scalable." | Load/performance evidence | Load, spike (300 joins in 60 s), soak (8 h), break-point and chaos tests; p95 budgets; capacity plan | `TEST_STRATEGY.md` §3.1; `DEPLOYMENT.md`; NFR-75, NFR-76 | Plan ready; results FYP-2 |
| "We worked as a team." | Git history + task allocation + contribution records | Branch and PR rules; merge commits keep authorship; issue templates; roles | `REPOSITORY.md`; `SRS.md` §13.2–13.3; `.github/` | Set-up ready; history builds from Sprint 1 |
| "We used modern tools." | Tool artifacts + demonstrated use | Expo/React Native, FastAPI, PostgreSQL, Docker, GitHub Actions, OpenAPI 3.1, PlantUML, IRT and ranking libraries | `SYSTEM_DESIGN.md`; ADRs; `BUILD_GUIDE.md` | Design ready; use shown in demos |
| "Our requirements are complete." | SRS + stakeholder evidence | SRS v1.3 (106 FRs, 77 NFRs, MoSCoW, use cases, RTM); student, parent and teacher instruments; personas; edge cases | `SRS.md` §2, §9–11, §16–17; `EDGE_CASES.md` | SRS ready; survey results FYP-1 |
| "Our software is reliable." | Test cases + results + failure analysis | 126 test cases with acceptance criteria; resilience and chaos suite; failure analysis per incident | `TEST_CASES.md`; `TEST_STRATEGY.md` | Cases ready; results from Sprint 1 on |
| "Our design is appropriate." | Alternatives + trade-off analysis + justification | 14 ADRs and 4 RFCs, each with options and trade-offs; design rationale for every screen and mechanic | `docs/architecture/adr/`, `rfc/`; `DESIGN_RATIONALE.md` | Ready |
| "The project was managed properly." | Gantt/sprints + progress logs | WBS and Gantt chart; sprint plan; MVP with a cut order | `PLAN.md`; `MVP.md`; `SRS.md` §13 | Plan ready; logs from Sprint 1 |

## 3. What each semester must show (from the guide)

**FYP-1: problem → evidence of complexity → requirements → design → initial prototype**

| The guide expects | Rahyaab | Status |
|---|---|---|
| A clearly formulated, significant problem | `SRS.md` §3.1 | Ready |
| Literature review and identified gap | `docs/research/reports/` (3 reports); gap stated in `SRS.md` §3.1 | Ready |
| Requirements and constraints | `SRS.md` §9–10; `MVP.md` | Ready |
| Proposed technical approach | `SCIENTIFIC_BASIS.md`; `SYSTEM_DESIGN.md` | Ready |
| System, algorithm and software design | 35 diagrams, schema, OpenAPI, ADRs | Ready |
| Feasibility | V1 simulation; budget-phone performance spike | **To do (FYP-1)** |
| Initial working prototype | MVP R1 (`MVP.md`) | **To build** |
| Project plan and progress evidence | `PLAN.md` + sprint records | Plan ready; records to build |
| Active GitHub repository | Repository with branch protection and CI | **To set up** (`REPOSITORY.md`) |

**FYP-2: complete implementation → testing/experiments → results → validation → delivery**

| The guide expects | Rahyaab | Status |
|---|---|---|
| Complete implementation and integration | App, API, scoring, parent page, dashboard | FYP-2 |
| Systematic testing or experiments | Test suite + pilot studies V2–V8 | FYP-2 |
| Quantitative results, compared with requirements and baselines | `SCIENTIFIC_BASIS.md` §5.2 tables | FYP-2 |
| Analysis, limitations and future work | Threats to validity (`SCIENTIFIC_BASIS.md` §7) | Framework ready |
| Final documentation, live demo, viva defence | Demo script (`SCIENTIFIC_BASIS.md` §6); this document | FYP-2 |

## 4. Learning outcomes and evidence (CS mapping)

| LO (marks) | What the guide wants to see | Rahyaab evidence |
|---|---|---|
| LO1 Knowledge (10) | Maths, statistics, models, theory | IRT models, congruence formula, NDCG, κ, reliability (`SCIENTIFIC_BASIS.md` §4) |
| LO2 Analysis and requirements (15) | Problem, literature, stakeholders, FRs, NFRs, constraints | `SRS.md`, research reports, survey instruments |
| LO3 Design and implementation (20) | Architecture, algorithms, database/API, integration, working system | Diagrams, schema, OpenAPI; the built app (FYP-2) |
| LO4 Theory and trade-offs (20) | Algorithm choice, comparisons, accuracy vs efficiency | ADR-0006 model comparison; V1 choices-vs-accuracy curve; offline vs freshness |
| LO5 Modern tools (10) | Frameworks, ML libraries, testing and profiling tools | Expo, FastAPI, LightGBM, SHAP, Schemathesis, Locust, Maestro, ZAP, MobSF |
| LO6 Teamwork and version control (15) | Commits, branches, PRs, issues, sprints, contributions | `REPOSITORY.md`, `.github/` templates, merge commits |
| LO7 Communication (10) | Report, documentation, diagrams, demo, viva | This documentation set; demo script |

`SRS.md` §13.6 lists the evidence the team will collect for each LO.

## 5. Questions the committee is likely to ask

**About the idea**

1. **"Isn't this just a questionnaire with graphics?"** No. Every choice is a forced choice between two career types inside a story, scored by a model built for that kind of data (Thurstonian IRT). We test whether this matches a real questionnaire (V2) and whether students prefer it (V8). Forced choice also reduces "everything sounds good" answers.
2. **"How can a game know the right stream?"** It doesn't, and we never claim it does. It estimates interests, abilities and values with a margin of error, ranks the paths a student is eligible for, explains why, and always gives a Plan B (`SCIENTIFIC_BASIS.md` §1).
3. **"What is new here?"** No validated, game-based, offline, Urdu-first stream guide for Pakistani boards exists. The research contribution is the measured agreement between story choices and a standard inventory.

**About the science**

4. **"Which frameworks do you use? Only RIASEC?"** RIASEC is the core (interests, 55% of the fit score). Abilities use ICAR-style task families (35%). Optional school marks add 10%. O*NET Work Values are **not** in the fit score: they word the explanations and break ties between paths whose fit differs by less than 0.02. Board and council eligibility rules are hard gates. The Big Five was considered and dropped. The 55/35/10 weights are starting heuristics, replaced by counsellor AHP weights before the pilot.
5. **"Is RIASEC valid in Pakistan?"** It is the most widely used interest model worldwide, but we don't assume it holds here. One known warning sign: an Urdu adaptation of a RIASEC inventory did not fit Holland's hexagon (Jones et al. 2014). So we do not rely on the hexagon: scoring uses six separate traits, and V3 checks the circular order as an open question, not an assumption. We recalibrate on the Pakistani pilot with cross-validation and test the structure (V3, V4) and fairness (V6).
6. **"How do you prove it is valid, like a benchmark for AI?"** With the five sources of validity evidence from the AERA/APA/NCME *Standards*, and with numeric thresholds against reference measures: r ≥ .50 with the O*NET Mini Interest Profiler (with CI rules), reliability ≥ .70, NDCG@3 above the rule baseline against a counsellor panel, κ ≥ .40, SUS ≥ 70 (`SCIENTIFIC_BASIS.md` §5.1–5.2). The V1 simulation is only a feasibility check, because its game choices are simulated from the same people's ratings.
7. **"What is your dataset?"** 145,828 open RIASEC responses (mostly adult, Western volunteers) for provisional calibration and the feasibility simulation; O*NET data for career profiles; our own pilot (target N = 150, minimum 100) for recalibration and validation, using 5-fold cross-validation so no student is used both to fit and to test. Studies that N ≈ 150 cannot power (structure, 2PL, the learned ranker) are labelled exploratory.
8. **"Why not use machine learning or ChatGPT from the start?"** There are no labels to learn from yet. We start with transparent models, collect panel labels, and only switch to LightGBM if it wins by a set margin and stays fair. An LLM is optional, self-hosted, and only rephrases computed results; no student data goes to outside AI services.
9. **"What if a student plays randomly or lies?"** Timing, straight-lining and consistency checks lower the confidence shown. The student can replay. A low-quality run is never presented as a verdict.

**About fairness and safety**

10. **"Will it push girls away from engineering?"** Gender is never an input to scoring, so a gender-swap test would pass by construction and prove nothing. The real risk is bias through the scores themselves (for example, a task item that is harder for girls for reasons unrelated to ability). We test for that: DIF on every choice pair and task item by gender and school medium, and STEM top-1/top-3 rates by gender at matched interest and ability scores, with 95% CIs; a matched gap above .10 triggers review (V6). All story characters and careers are shown for all genders.
11. **"How do you protect minors' data?"** Consent from parents and assent from students; pseudonymous IDs; encrypted on the phone, in transit and at rest; no third-party analytics or ads; a DPIA; retention limits; deletion on request (`docs/security/`).
12. **"Did you handle SQL injection, XSS, CORS and access control?"** Yes, by design and with tests: parameterised queries (TC-SEC-12), auto-escaping and strict CSP (TC-SEC-13), an exact CORS allowlist (TC-SEC-09), role and tenant checks on every route (TC-SEC-05), mass-assignment protection (TC-SEC-14). The full OWASP Top 10, API Top 10 and Mobile Top 10 mapping is in `SECURITY.md` §5.6.
13. **"Is there an admin backdoor?"** No. There are no default accounts or master passwords, admin routes need MFA, and a release check sweeps for test routes and debug flags (NFR-66, TC-SEC-04).

**About engineering**

14. **"Why does it work offline?"** Many students have weak data and shared phones. The game saves events in an encrypted local queue and syncs later without losing or duplicating anything (TC-SYNC).
15. **"Will it scale?"** One server handles the pilot and a district; spike, soak and break-point tests prove the limits. Kubernetes was considered and not used, and `DEPLOYMENT.md` says when it would be.
16. **"Why these technologies?"** Each choice has an ADR with the alternatives and trade-offs.
17. **"What if board rules change?"** Rules are data, not code: each has a source, an effective date and a last-verified date. The server applies the current rules when it scores, so a rule change on the server takes effect without an app release. Only the offline provisional result (a Should, FR-49) uses the rules bundled in the app, and it is always replaced by the server result after sync.

**About the project**

18. **"Can you finish this in two semesters?"** We estimated it bottom-up: about 1,580 hours of work (after AI help with coding) against about 1,620 hours of capacity (3 people × 20 hours a week × about 27 effective weeks), with the load split evenly (`PLAN.md` §2). The slack is thin, so it is managed with two fixed checkpoints (the FYP-1 demo and the 26 February feature freeze): if we are more than a week behind, the next item in the cut order (about 160 hours in total) goes at once. Individual sign-up is already moved to after the MVP. Sprint velocity from Sprints 1–2 will replace these estimates.
19. **"What if the pilot doesn't reach 150 students?"** We plan for drop-out: recruit about 250 students across 3–4 schools, expecting about 60% to consent and finish. The minimum for the main validity study (V2) is 100. Below 100, we do not claim validity: V2–V6 are reported as a pilot feasibility study with CIs, and the validity claim moves to future work. V1 shows only that the scoring is feasible, not that it is valid.
20. **"How will we know each member contributed?"** Commits, PRs, reviews and issues per member on GitHub; roles in `SRS.md` §13.2.

## 6. Honest limits to state up front

Saying these first builds trust with the committee:
- The validation pilot covers **classes 8–10** (5 April – 14 May 2027). The class 11–12 and O/A-Level modes are built, rule-checked and usability-tested, but their validity is future work.
- The app is **designed, not yet built**. Validity results exist only after the pilot (FYP-2); only V1 can be done in FYP-1.
- Calibration data are mostly adult and Western; they are used as a starting point and recalibrated locally.
- Board and council rules are dated and sourced, but some still need confirming with the boards.
- The Urdu text needs review by a native speaker before the pilot.
- The ethics approval for the pilot is still to be obtained.
