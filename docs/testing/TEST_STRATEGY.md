# Test strategy and test plan

How we will know that Rahyaab works, is safe, and measures what it claims to measure. This expands SRS §14, which keeps the test-level IDs (T-UNIT, T-PAR, T-INT and so on). The concrete cases are in [`TEST_CASES.md`](TEST_CASES.md).

| | |
|---|---|
| **Version** | 1.0 (4 Nov 2026) |
| **Scope** | Mobile app, API, scoring package, parent web pages, dashboard, content packs, infrastructure |
| **Owner** | QA is shared. Each member tests their own code, and Daniyal leads accessibility and usability testing |
| **Standards** | ISO/IEC/IEEE 29119-3 (document structure, simplified), ISTQB terms |

## 1. Objectives

1. **Correctness:** every Must FR has passing acceptance tests before its release (R1 for R1 items).
2. **No data loss:** 0 events lost under crashes, kills and offline play (NFR-31).
3. **Reproducible scoring:** the same inputs and versions give a bit-identical result (T-PAR-04).
4. **Safe for minors:** no data leaves without consent; no critical or high security finding is open at the pilot (NFR-45, NFR-70).
5. **Accessible:** WCAG 2.2 AA; every flow can be completed with TalkBack and Switch Access (NFR-22, NFR-65).
6. **Usable and valid:** SUS ≥ 70, task success ≥ 90%. The psychometric validity is reported honestly (§14.4).

## 2. What we test, and what we don't

**In scope:**
- all FRs and NFRs in SRS v1.1;
- the content packs;
- the OpenAPI contract;
- infrastructure scripts (backup and restore);
- Play store compliance items.

**Out of scope:**
- iOS (not in R1);
- third-party services beyond their contract (O*NET Web Services, the SMS gateway). These are stubbed in tests and smoke-tested on staging.

## 3. Approach: a test pyramid with two extra layers

```
          ┌─────────────┐  Usability + psychometric studies (people)        T-USAB, T-PSY, T-FAIR
          │  E2E (few)  │  Maestro on emulator + real low-end phone       T-E2E, T-DEV, T-REL
        ┌─┴─────────────┴─┐ Contract + integration                         T-INT, OpenAPI drift
      ┌─┴─────────────────┴─┐ Parity / golden replays (TS ↔ Python, Ink)   T-PAR
    ┌─┴─────────────────────┴─┐ Unit (most)                                  T-UNIT
    └─────────────────────────┘
   Cross-cutting on every layer: security (T-SEC), privacy (T-PRIV), accessibility (T-A11Y), localisation (T-L10N), content (T-CONT), performance (T-PERF)
```

| Level | What | Tools | Who | When | Target |
|---|---|---|---|---|---|
| **Unit** | Pure functions: staircase, EAP, the letter reveal, congruence, gates, outbox, i18n helpers | Jest + RNTL; pytest + Hypothesis | Author | Every PR | Coverage (NFR-50): scoring ≥ 85%, API ≥ 70%, mobile domain logic ≥ 70% |
| **Parity / golden** | TS vs Python baselines; Ink coverage; golden playthrough event streams; rescore reproducibility | Shared fixtures in `content/fixtures/` | Hamza + Zahid | Every PR touching games or scoring | 100% match |
| **Contract** | The FastAPI schema matches `docs/api/openapi.yaml`; generated TS types compile | **Drift:** export the schema FastAPI generates and diff it against `openapi.yaml` (`oasdiff`), failing on any difference. **Fuzzing:** Schemathesis (property-based). openapi-typescript for the types | Zahid | Every PR | 0 drift (oasdiff); 0 5xx under fuzzing (Schemathesis) |
| **Integration** | API + PostgreSQL: join, consent gate, batch, idempotency, results, share, RBAC | pytest + httpx + a Testcontainers Postgres | Zahid | Every PR | All pass |
| **E2E** | Onboarding → prologue → week → offline → sync → Blueprint → share (EN + UR) | Maestro | Hamza | Nightly + release | All pass on an emulator and the reference low-end device (RLD) |
| **Fault injection** | Kill, airplane mode, low storage, clock change | adb scripts + Maestro | Hamza | Release | 0 events lost |
| **Performance** | Cold start, frame rate, memory, API load, bundle size | Flashlight, Perfetto, Locust | Hamza (app), Zahid (API) | Release | NFR-04–13 |
| **Security** | MASVS L1 + PRIVACY, ASVS L2, ZAP, SAST, secrets, dependencies, authorisation matrix, pentest | MobSF, ZAP, CodeQL, Semgrep, Bandit, gitleaks | Zahid (lead); pentest by a non-author | CI + pre-pilot | 0 open critical or high |
| **Privacy** | Data inventory vs manifest and network trace; export de-identification; retention | mitmproxy (on a test device), scripts | Zahid | Pre-pilot | 100% match with the inventory |
| **Accessibility** | Scanner + TalkBack + Switch Access + 200% font + high contrast + CVD simulation | Accessibility Scanner, axe-core, manual | Daniyal | Release | 0 critical issues |
| **Localisation** | Missing keys, RTL screenshots, bidi isolation, Urdu editor sign-off | i18n lint, screenshot diff | Daniyal | Release | 100% of keys |
| **Content** | Pair coverage, age-appropriateness, "cringe check", readability, rule sources | Validator + 2-person review | Daniyal | Every content pack | All pass |
| **Usability** | Think-aloud + SUS with 5–8 teens per round | §14.3 | Daniyal | M-A, M-C | SUS ≥ 70 |
| **Psychometric / fairness** | Convergent validity, reliability, DIF, matched-score audit | R, Python | Zahid | M-C, M-D | Reported against hypotheses |

### 3.1 Performance, resilience and robustness suite

These tests check behaviour **under pressure and failure**, not just correctness. Server tests run against **staging**, never production. Data is synthetic, generated by the bots; the load scripts live in `tests/load/` (Locust) and `tests/chaos/`. The cases are TC-PERF-05 to 10, TC-CHAOS-01 to 08 and TC-MONKEY-01 to 03.

| Type | Question it answers | How | Profile | Pass criteria | When |
|---|---|---|---|---|---|
| **Load** | Does it meet targets at normal peak? | Locust: realistic mix (70% events batch, 15% results, 10% library, 5% share) | Profile `peak_250`: 250 virtual users, one per app session, 3-minute think time between scene batches (= the pilot peak of 250 concurrent sessions, NFR-57), 30 min | NFR-09: p95 ≤ 800 ms, p99 ≤ 2 s; errors < 0.5% | Nightly (smoke, 5 min); release (full) |
| **Stress** | How does it degrade above target? | Same mix | 750 virtual users (3× the pilot peak), 30 min | No 5xx storm: graceful 429/503 with `Retry-After`; no data loss; recovers in ≤ 5 min after load drops | Release |
| **Spike** | A whole school joins at once | Ramp 0 → 300 joins + batches in 60 s, hold 5 min, drop | "Monday 8 am, 10 classes" | Join success ≥ 99% (the rest get 429 and retry); p95 ≤ 3 s during the spike; the outbox absorbs it on phones | Release |
| **Soak (endurance)** | Leaks, connection-pool exhaustion, log or disk growth | Load profile at 60% | 8 hours (12 h before the pilot) | Memory growth ≤ 10% per worker; no rise in p95 latency over time; database connections stable; disk growth as forecast | Weekly + pre-pilot |
| **Break-point (capacity)** | Where exactly does it fail, and how? | Step +25 virtual users every 5 min until the error rate passes 5% or p95 passes 5 s | Until failure | **Record** the break point and the first bottleneck (CPU, database, workers); must be ≥ 3× the pilot peak; failure must be graceful (no corruption) | Each milestone |
| **Volume** | Big tables | Seed 5,000 students, 20 million events, 12 monthly partitions | — | Roster query p95 ≤ 500 ms; rescore job ≤ 1 h; retention job drops a partition in ≤ 1 min | Pre-pilot |
| **Monkey (client)** | Random input crashes or freezes | `adb shell monkey` (50,000 events, seeded, throttle 50 ms) and Maestro random-tap flows on the reference device, in EN and UR | 3 seeds per build | 0 crashes and 0 ANRs; 0 event loss; the app always reachable from Home | Nightly (10k events); release (50k) |
| **Client endurance** | Phone stability across a whole game | Play all 4 weeks without restarting (bot-driven), in the low-memory profile | ~60 min | Memory (PSS) ≤ 300 MB throughout (NFR-07); frames stay within NFR-06; battery ≤ 5% per 20 min | Release |
| **Chaos (server)** | Does it survive real failures? | Scripted faults on staging (see TC-CHAOS) | Database down, worker killed, disk full, slow database, network loss, clock skew, restore from backup | No data loss; clear user messages; automatic recovery; alerts fire; RTO ≤ 4 h, RPO ≤ 24 h | Monthly + pre-pilot |
| **Chaos (client)** | Hostile phone conditions | Airplane-mode flapping, storage 99% full, process kill, OS low-memory kill, time zone and clock change, revoked token mid-sync | — | 0 event loss; resume at the last choice; the user sees what to do | Release (T-REL) |
| **Fuzz (API)** | Malformed input | Schemathesis from `openapi.yaml`, 1,000 examples per operation; plus a gzip-bomb and oversized-payload set | — | 0 5xx; every rejection is problem+json with the right status | Every PR (100 examples), nightly (1,000) |
| **Negative and abuse** | Wrong or hostile input is rejected **with guidance** | TC-VAL and TC-SEC cases; rate-limit and enumeration tests | — | Correct status + a helpful message key; no information leak (NFR-74) | Every PR |
| **Mutation (scoring)** | Are the scoring tests strong enough? | mutmut on `backend/scoring` | — | Mutation score ≥ 70% on the estimators and the recommender | Each milestone |

All of these produce a report saved as a CI artifact. A regression of more than 10% against the last release blocks it (§14.2).

## 4. Test environments and devices

| Environment | Use |
|---|---|
| Local Docker Compose | Unit, integration and contract tests |
| GitHub Actions runners | CI (Linux), with an Android emulator job for Maestro (API 34, 4 GB profile) |
| Staging VM | E2E against the real API, ZAP, Locust, restore drill |
| **Device lab** | The RLD: a Tecno or Infinix phone with 4 GB RAM on Android 14–15. Plus a Samsung Galaxy A0x/A1x, a Redmi A-series, one Android 11 phone and one 5.5″ small screen (T-DEV) |

**Network profiles:** offline; 1 Mbps with 300 ms latency; flapping connectivity (Android emulator network shaping, plus a real SIM on Jazz or Zong).

## 5. Test data

- **Synthetic only**, outside production:
  - bot-generated playthroughs (`career-game-prototype` bots);
  - 200 golden profiles;
  - vignettes built from public RIASEC vectors.
- **No real student data** in fixtures, screenshots or bug reports. Use pilot data only in the research environment, de-identified.
- **Accounts:** test class codes and staff accounts are seeded per environment from `backend/api/seed/*.example.json`. Production never has test accounts (NFR-66).

## 6. Entry and exit criteria

| Gate | Entry | Exit |
|---|---|---|
| **PR merge** | Story meets the Definition of Ready (SRS §13.4) | Required CI checks green; 1 review; new code has tests |
| **Sprint review** | Stories done | Acceptance criteria demonstrated on the RLD or an emulator, in EN + UR |
| **R1 (FYP-1 demo)** | All R1 Must stories merged | E2E pass; 0 open critical or high defects; T-PERF budgets met on the RLD |
| **Pilot (M-C)** | R2 Must items done; ethics approval | Pentest done with 0 open critical/high; T-PRIV passed; T-A11Y passed; restore drill passed; supervisor sign-off |
| **Store release** | Pilot feedback triaged | Data safety form matches the inventory; Play pre-launch report clean; checklist in `STORE_AND_SEARCH.md` §4 |

**Suspension:** stop testing a build and return it if any of these happens:
- the app crashes on launch;
- sync loses events;
- the consent gate fails.

## 7. Defects

| Severity | Definition | Examples | Fix by |
|---|---|---|---|
| **S1 Critical** | Data leak, consent bypass, data loss, or the app unusable | Events uploaded without consent; a crash on launch | Immediately; blocks release |
| **S2 High** | A main flow is broken, a wrong result, or an accessibility blocker | Blueprint shows the wrong top-3; TalkBack can't reach the choices | Within the sprint; blocks release |
| **S3 Medium** | A workaround exists, or a minor flow is broken | A share link can't be copied | Next sprint |
| **S4 Low** | Cosmetic | Alignment off by 2 px | Backlog |

**Recording defects:**
- File every defect as a GitHub issue with the `bug` template: steps, expected, actual, device, language, build, severity, linked FR or test ID.
- Never put real student data in an issue.
- A fix includes a regression test.

## 8. Schedule (follows SRS §13.5)

| Sprint | Testing focus |
|---|---|
| S1 | Jest, pytest and CI scaffolding; contract test; consent-gate integration tests |
| S2 | Outbox and sync integration; idempotency; golden playthrough for Week 1 |
| S3 | Task parity tests; staircase properties; vertical-slice playtest |
| S4 | Blueprint and gates golden tests; share-link security tests; first accessibility pass |
| S5 | RLD performance; fault injection; E2E in EN + UR; R1 exit |
| M-A / M-B | Usability round 1; Schemathesis; ZAP authenticated scan; MobSF |
| Pre-pilot | Pentest; T-PRIV; restore drill; accessibility walkthrough with 2 students with a disability |
| M-C / M-D | Usability round 2; psychometric and fairness analyses |

## 9. Reporting and traceability

- **Every PR:** the CI summary (coverage, failed tests).
- **Every sprint:** a test summary in the sprint review notes (pass/fail per area, open defects by severity).
- **Every release:** a test report: scope, results per level, open defects, exceptions with approver.
- **Traceability:** FR/NFR → test case ID in `TEST_CASES.md` → automated test name (`test_<case_id>_…`) → CI run. The SRS RTM (§16) links each requirement to its test level.

## 10. Risks to testing

| Risk | Mitigation |
|---|---|
| Too few real low-end devices | Borrow from the pilot schools; emulator profiles; prioritise the RLD |
| Urdu reviewers are not available in time | Book the editor per content pack; RTL screenshot automation catches layout bugs early |
| Pentest skills inside the team | Use the MASTG and ASVS checklists; ask the university security lab; tester must not be the author |
| Flaky E2E tests on CI emulators | Retry once; quarantine flaky tests with an issue; keep E2E few and critical |
