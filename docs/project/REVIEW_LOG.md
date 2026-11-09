# Independent review log (7–9 Nov 2026)

Before development, the full design documentation was split into nine topic packs and reviewed independently by five general-purpose AI models (shown here as Reviewers A–E), with one fixed prompt that required an exact quote as evidence for every issue. The team then checked every issue against the files: each quote was searched for in the repository, and each issue was marked **confirmed** (and fixed), **false** (with the reason), **won't fix** (with the reason) or **team decision**.

This log is evidence for the committee that the design was checked by more than its authors (`COMMITTEE_QA.md`).

**Totals (366 issues):** 256 confirmed and fixed · 32 false · 75 won't fix · 3 team decisions still open.

| Pack | Confirmed (fixed) | False | Won't fix | Open |
|---|---|---|---|---|
| Whole project | 12 | 9 | 7 | 2 |
| SRS | 20 | 7 | 9 | 1 |
| Scope, plan, committee | 26 | 2 | 6 | 0 |
| Architecture, API, database | 46 | 2 | 2 | 0 |
| Security, privacy, legal | 59 | 4 | 6 | 0 |
| Testing, DevOps, repository | 29 | 1 | 0 | 0 |
| Science, game, frameworks | 26 | 0 | 1 | 0 |
| Design system, brand | 34 | 1 | 5 | 0 |
| Research reports | 4 | 1 | 2 | 0 |
| Prototype code | 0 | 5 | 37 | 0 |

**What changed as a result:** SRS v1.4, API spec 1.3.0, schema v1.3, RFC and ADR updates, the security OWASP map (Top 10:2025), privacy and consent texts, the scoring specification, the test cases (131), the design tokens (high-contrast theme), the diagrams and the re-plan of 9 Nov 2026 (`PLAN.md`).

## Every issue

| ID | Reviewer | File | Verdict | Reason or fix |
|---|---|---|---|---|
| 00-A-1 | Reviewer A | docs/architecture/data/schema.sql | Confirmed (fixed) | Marks stay (eligibility needs them) but are now type- and size-checked, classed confidential (minor) in the DPIA and hidden from teachers by default. |
| 00-A-2 | Reviewer A | docs/api/openapi.yaml | Confirmed (fixed) | Real bug was the hard-coded 2013 maximum (stale next year): now birth month + year, compared with today's date; one neutral error code for every out-of-range age. The 'COPPA violation' claim itself was overstated. |
| 00-A-3 | Reviewer A | career-game-prototype/engine/session_log.py | False | Rejecting a log whose footer count mismatches is an intended integrity check, and it is archived prototype code. |
| 00-A-4 | Reviewer A | docs/architecture/data/schema.sql | False | The primary key (event_id) is the partition key, which PostgreSQL 16 allows. |
| 00-A-5 | Reviewer A | docs/project/SRS.md | Confirmed (fixed) | SRS §1.2, FR-93 and the GDD now name the tap as the one short self-report item. |
| 00-A-6 | Reviewer A | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | θ⁺ defined as Φ(θ) in SRS §12.6 and scoring.json; a Pearson-r sensitivity check is added. |
| 00-A-7 | Reviewer A | career-game-prototype/engine/stream_transformation_engine.py | Won't fix | Archived prototype; Big Five is not in v1 and the prototype is marked reference-only. |
| 00-A-8 | Reviewer A | docs/project/SRS.md | Won't fix | Same: prototype code, archived; Glyph Sequence stays dropped in v1. |
| 00-A-9 | Reviewer A | docs/project/SRS.md | Confirmed (fixed) | NFR-04 now measures TTFD with reportFullyDrawn() via Macrobenchmark/Maestro in the nightly job. |
| 00-A-10 | Reviewer A | docs/security/SECURITY.md | False | Without pinning, TLS still stops forgery unless a system CA is compromised; user CAs are not trusted (ADR-0013). The trade-off is documented. |
| 00-A-11 | Reviewer A | docs/project/MVP.md | False | The row has no stated problem (it broke during pasting); the MVP row matches FR-01. |
| 00-A-12 | Reviewer A | docs/project/SCREENS.md | Won't fix | P-04 is marked future and outside scope; you asked for the subscription screen; it is not in the MVP. |
| 00-A-13 | Reviewer A | docs/architecture/data/schema.sql | False | 128-bit random tokens cannot be guessed; a salt adds nothing for high-entropy tokens (OWASP). Tokens come from a CSPRNG. |
| 00-A-14 | Reviewer A | design/game/frameworks/scoring.json | False | The reveal is fully readable exactly at SE ≤ .35, the High-confidence threshold; it starts at 0 with the prior SE of 1. A note was added to scoring.json. |
| 00-A-15 | Reviewer A | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Already a listed threat; simulation diagnostics and sensitivity checks were added (SRS §12.6). |
| 00-A-16 | Reviewer A | docs/project/EDGE_CASES.md | Won't fix | δ_route 0.15 is explicitly provisional and set on the pilot (EDGE_CASES §3.3). |
| 00-A-17 | Reviewer A | docs/devops/DEPLOYMENT.md | Confirmed (fixed) | VM is now 4 vCPU / 8 GB with a memory budget; Uptime Kuma moved off the VM. |
| 00-A-18 | Reviewer A | docs/project/SRS.md | Confirmed (fixed) | FR-45: exact percentages, no rounding, a 1-point 'check with the board' band, boundary tests. |
| 00-A-19 | Reviewer A | docs/project/SRS.md | Confirmed (fixed) | NFR-34 no longer says 'where possible'. |
| 00-A-20 | Reviewer A | docs/api/openapi.yaml | Confirmed (fixed) | ProfileUpdate.nickname now has the same pattern. |
| 00-A-21 | Reviewer A | career-game-prototype/engine/aggregate.py | False | The median call is already guarded by `if sessions else None`. |
| 00-A-22 | Reviewer A | docs/project/STORE_AND_SEARCH.md | False | The row has no stated problem; the short description is 75 characters, under Play's 80 limit. |
| 00-A-23 | Reviewer A | docs/project/SRS.md | Won't fix | Sharing is parent-initiated and the card holds only a nickname; it is the family's choice. |
| 00-A-24 | Reviewer A | design/specs/components.md | Confirmed (fixed) | SRS now uses 'Worth a look', like the specs, screens and schema. |
| 00-A-25 | Reviewer A | docs/architecture/adr/ADR-0010-work-offline-first-with-an-en | Won't fix | Key wrapping is handled by Android Keystore through expo-secure-store; it belongs in code documentation. |
| 00-A-26 | Reviewer A | docs/project/SRS.md | False | Quote is paraphrased; staff login and TOTP are already limited to 5 per 15 minutes (SECURITY §3). |
| 00-A-27 | Reviewer A | docs/project/PLAN.md | Team decision (open) | Check the FYP-1 defence date with the department coordinator and move the plan if needed. |
| 00-A-28 | Reviewer A | docs/project/SRS.md | Confirmed (fixed) | SRS §17.6 marks the class 8 question as answered (FR-50). |
| 00-A-29 | Reviewer A | docs/ethics/CONSENT_FORMS.md | Won't fix | The form says nickname only; quasi-identifiers are handled by k-anonymity in exports, and the form now says 'de-identified'. |
| 00-A-30 | Reviewer A | docs/security/COMPLIANCE.md | Team decision (open) | Confirm the Open-Source Psychometrics dataset licence on its download page and record it in COMPLIANCE.md. |
| 01-B-1 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-21 is now an 'input baseline' used only to flag implausible timing, never to score abilities. |
| 01-B-2 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-46 acceptance is conditional on FR-51 (409 insufficient_evidence). |
| 01-B-3 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-07: PIN required as soon as a phone has two profiles; persistent failure count. |
| 01-B-4 | Reviewer B | docs/project/SRS.md | False | There are 6 story beats over 4 weeks, so 24 scene moments + 6 beats = 30 (pairs.json: 8, 8, 7, 7). |
| 01-B-5 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | Ages are now 'about 13–18' in the SRS, GDD, brief and brand guide. |
| 01-B-6 | Reviewer B | docs/project/SRS.md | Won't fix | You chose to keep every Must (the protected core) and raise capacity to 20 h/person/week; overruns are handled by the cut order at fixed checkpoints. |
| 01-B-7 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | The CCP row now separates offline play from server scoring. |
| 01-B-8 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-90 now has Given/When/Then acceptance criteria. |
| 01-B-9 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | NFR-57 has a workload model (250 concurrent sessions) and thresholds. |
| 01-B-10 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | NFR-75 defines 'flat' (last hour within 10% of the first) and the pilot peak. |
| 01-B-11 | Reviewer B | docs/project/SRS.md | Won't fix | Each NFR row in §10 already carries its own verification method; the grouped RTM is an overview. |
| 01-B-12 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | The RTM legend now explains test-level IDs and TC IDs. |
| 01-B-13 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-68 defines entry odds as published admission figures with source, year and region. |
| 01-B-14 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | FR-05 and RFC-0004 now define the paper-slip and claim-code workflow with audit. |
| 01-B-15 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | §14.3 separates formative rounds from the summative pilot measure. |
| 01-B-16 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | §1.2 states that parents' wishes never enter the ranking. |
| 01-B-17 | Reviewer B | docs/project/SRS.md | Confirmed (fixed) | Simulation diagnostics (parameter recovery, identification, sensitivity) added to §12.6. |
| 01-C-1 | Reviewer C | docs/project/SRS.md | Won't fix | Each of the nine rows has its own evidence; the guide asks for at least 4–5, and claiming more with evidence is fine. |
| 01-C-2 | Reviewer C | docs/project/SRS.md | False | 90 + 16 = 106, and the change log (98 → 104 → 106) is consistent. |
| 01-C-3 | Reviewer C | docs/project/SRS.md | Won't fix | Same as 01-Cha-6. |
| 01-C-4 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | Target kept, but NFR-04 now says the Sprint 1 spike measures the baseline and the target is re-set with the supervisor if missed. |
| 01-C-5 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | Now labelled a feasibility hypothesis, not a product requirement. |
| 01-C-6 | Reviewer C | docs/project/SRS.md | False | The fixed schedule meets coverage on its own; adaptive selection is an improvement tested in V1. |
| 01-C-7 | Reviewer C | docs/project/SRS.md | False | TC-EDGE IDs exist in TEST_CASES.md (the audit confirms); that file was not in pack 01. |
| 01-C-8 | Reviewer C | docs/project/SRS.md | Team decision (open) | Same as 00-Goo-30 (dataset licence). |
| 01-C-9 | Reviewer C | docs/project/SRS.md | Won't fix | SUS ≥ 70 is a hypothesis reported either way; the published average is 68. |
| 01-C-10 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | FR-51: at most one extra week, then the Blueprint opens with Low confidence. |
| 01-C-11 | Reviewer C | docs/project/SRS.md | False | That quote is not in the SRS; §12.6 already keeps gender research-only and out of features. |
| 01-C-12 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | Rule added: weak labels are excluded; under 80 labelled cases, the learned ranker is not trained. |
| 01-C-13 | Reviewer C | docs/project/SRS.md | False | The core evidence is rules (a) vs congruence (b); the learned ranker is optional. |
| 01-C-14 | Reviewer C | docs/project/SRS.md | Won't fix | Zero loss of committed events is achievable with a transactional SQLite outbox and is tested by a defined fault suite. |
| 01-C-15 | Reviewer C | docs/project/SRS.md | Won't fix | It is meant as a release gate; unverified rules are flagged until verified. |
| 01-C-16 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | §7.4: switch only between scenes, story state and outbox committed before the reload. |
| 01-C-17 | Reviewer C | docs/project/SRS.md | False | TC-VAL cases are defined in TEST_CASES.md. |
| 01-C-18 | Reviewer C | docs/project/SRS.md | Confirmed (fixed) | Same as 01-Cha-5 (quote paraphrased). |
| 01-C-19 | Reviewer C | docs/project/SRS.md | Won't fix | One source of truth (scoring.json) is better than copying constants; §12.6 shows the formula. |
| 01-C-20 | Reviewer C | docs/project/SRS.md | Won't fix | M4 is an optional research item; a conditional NFR is clear for that. |
| 02-D-1 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): bottom-up estimate (~1,580 h) vs capacity (~1,620 h at 20 h/week), individual sign-up cut, checkpoints. |
| 02-D-2 | Reviewer D | docs/project/MVP.md | Won't fix | You kept every board in scope; rule verification runs until 26 Feb and unverified rules stay flagged in the app (NFR-03). |
| 02-D-3 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): the cut order now has three large items (~160 h) applied at fixed checkpoints. |
| 02-D-4 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): feature freeze 26 Feb, pentest on the frozen build in S8, a fix sprint in S9. |
| 02-D-5 | Reviewer D | docs/project/diagrams/gantt.puml | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): the planning task is built end to end first and the other families are re-estimated from its real time. |
| 02-D-6 | Reviewer D | docs/project/diagrams/gantt.puml | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): the Ink script is split into an F1 bar (done 18 Dec) and an F2 bar (Feb). |
| 02-D-7 | Reviewer D | docs/project/diagrams/gantt.puml | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): the Gantt chart has dependencies, two buffers and a stated critical path. |
| 02-D-8 | Reviewer D | docs/project/PLAN.md | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): load rebalanced (CI to Hamza; dashboard, parent pages and analysis to Daniyal) and a backup reviewer per package. |
| 02-D-9 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | MVP: F2 gives 30 choices; F1 demo results are labelled demo, low confidence. |
| 02-D-10 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | WBS 1.2 is now a full application package (Urdu and DPIA reviews first). |
| 02-D-11 | Reviewer D | docs/project/diagrams/gantt.puml | Confirmed (fixed) | PLAN §4: an approval deadline (mid-February) and fallbacks. |
| 02-D-12 | Reviewer D | docs/project/diagrams/gantt.puml | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): 6-week pilot, 5 Apr - 14 May 2027, classes 8-10, ending before Eid al-Adha; each school's calendar confirmed at recruitment. |
| 02-D-13 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Under-powered studies are now labelled exploratory with CIs. |
| 02-D-14 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Q18 now answers with the hour estimate, capacity and checkpoints. |
| 02-D-15 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Q19 now gives the recruitment funnel and what is claimed below 100. |
| 02-D-16 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | 5-fold cross-validated calibration; the Urdu hexagon misfit is now in Q5. |
| 02-D-17 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | V1 is labelled feasibility only everywhere. |
| 02-D-18 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Mini-IP named, licence and language protocol defined, threshold justified. |
| 02-D-19 | Reviewer D | docs/project/SCREENS.md | Confirmed (fixed) | Re-planned 9 Nov 2026 (PLAN.md, MVP.md): individual sign-up with parent OTP moved to post-MVP; the pilot uses the school path only. |
| 02-D-20 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | School consent is now slips + claim codes + audit + ethics approval. |
| 02-D-21 | Reviewer D | docs/project/PROJECT_BRIEF.md | Won't fix | You decided not to disclose AI-tool use. |
| 02-D-22 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Q17 now says rules change on the server; only the offline provisional result uses bundled rules. |
| 02-D-23 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Corrected: the 10% is marks; values only break ties. |
| 02-D-24 | Reviewer D | docs/project/COMMITTEE_QA.md | Confirmed (fixed) | Fairness answer and V6 now test proxy bias (DIF, matched rates with CIs). |
| 02-D-25 | Reviewer D | docs/project/MVP.md | Confirmed (fixed) | Audio uses assembled clips for personalised text; no English voice for Roman Urdu; WBS 6.5. |
| 02-A-1 | Reviewer A | docs/project/MVP.md | Confirmed (fixed) | Same as 02-Cla-1. |
| 02-A-2 | Reviewer A | docs/project/MVP.md | Confirmed (fixed) | Same as 02-Cla-4. |
| 02-A-3 | Reviewer A | docs/project/SCREENS.md | Won't fix | Subscriptions are a future, online-only screen; billing never runs offline. |
| 02-A-4 | Reviewer A | docs/project/PLAN.md | False | Calibration uses established R packages (thurstonianIRT, mirt); production only evaluates fixed parameters. |
| 02-A-5 | Reviewer A | docs/project/COMMITTEE_QA.md | Won't fix | M4 is optional research; templates ship by default. |
| 02-A-6 | Reviewer A | docs/project/PROJECT_BRIEF.md | Confirmed (fixed) | COMPLIANCE.md: PTA-registered aggregator, sender ID, school-path fallback. |
| 02-A-7 | Reviewer A | docs/project/EDGE_CASES.md | Won't fix | Data stays only on the phone and is purged after 14 days; nothing reaches the service before consent. |
| 02-A-8 | Reviewer A | docs/project/PLAN.md | Won't fix | Staff can see minors' data, so MFA stays in the MVP. |
| 02-A-9 | Reviewer A | docs/project/COMMITTEE_QA.md | False | The ethics package is already in Sprint 1; now made explicit. |
| 03-E-1 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | GET /results list added; results and recommendations share one id. |
| 03-E-2 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | CHECK on the version nibble (PG 16 has no uuid_extract_version). |
| 03-E-3 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | Uniqueness and monotonic time enforced by the API (a partitioned unique index must include the key); documented. |
| 03-E-4 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | ranked_ok() checks 3 distinct streams and valid bands. |
| 03-E-5 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | Explicit roles and GRANTs added. |
| 03-E-6 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | Batch result now has deferred and rejected; quarantine is server-side. |
| 03-E-7 | Reviewer E | docs/architecture/rfc/RFC-0004-parent-share-and-consent-link | Confirmed (fixed) | Invalid-token threshold and block time defined; lookup by hash index. |
| 03-E-8 | Reviewer E | docs/architecture/diagrams/uml/seq-02-play-sync.puml | Won't fix | Activation bars are optional in UML; cosmetic. |
| 03-E-9 | Reviewer E | docs/architecture/diagrams/uml/activity-recommendation.puml | False | PlantUML renders switch as a UML decision node (diamond). |
| 03-E-10 | Reviewer E | docs/architecture/diagrams/uml/class-domain.puml | False | Multiplicity '3' means exactly three in UML. |
| 03-E-11 | Reviewer E | docs/architecture/SYSTEM_DESIGN.md | Confirmed (fixed) | Partition job and bound formula documented; implausible clocks quarantined. |
| 03-E-12 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | Same fix as 00-Goo-2. |
| 03-E-13 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | Per-code attempt cap added; a format hint does not reveal whether a code exists. |
| 03-E-14 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | The shareToken query scheme is removed; tokens are path-only. |
| 03-E-15 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | Marks constrained; district optional and never scored. |
| 03-E-16 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | CHECK and expires_at index added. |
| 03-E-17 | Reviewer E | docs/architecture/diagrams/c4/c4-3-components-api.puml | Confirmed (fixed) | C4-3 now shows every router's persistence and the external services. |
| 03-E-18 | Reviewer E | docs/architecture/rfc/RFC-0003-scoring-service-and-model-reg | Confirmed (fixed) | Ranker stays inactive until panel labels exist (RFC-0003). |
| 03-E-19 | Reviewer E | docs/api/openapi.yaml | Confirmed (fixed) | POST /admin/models added. |
| 03-E-20 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | 'all' removed; one row per class mode. |
| 03-E-21 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | FK added. One consenting guardian is enough, so multiple guardians are not added. |
| 03-E-22 | Reviewer E | docs/architecture/diagrams/uml/state-consent.puml | Confirmed (fixed) | State machine now has Refused and a deletion guard. |
| 03-E-23 | Reviewer E | docs/architecture/diagrams/uml/use-case.puml | Confirmed (fixed) | UC10 now has the Student actor; including telemetry is kept as valid included behaviour. |
| 03-E-24 | Reviewer E | docs/architecture/SYSTEM_DESIGN.md | Won't fix | The reference device is defined in the SRS and measured in the Sprint 1 spike. |
| 03-E-25 | Reviewer E | docs/architecture/data/schema.sql | Confirmed (fixed) | Grants, append-only trigger and 2-year retention added. |
| 03-D-1 | Reviewer D | docs/architecture/diagrams/uml/seq-01-join-consent.puml | Confirmed (fixed) | Consent slips with claim codes (schema, API, RFC-0004, seq-01). |
| 03-D-2 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | recommendation_id optional for consent links, CHECK added. |
| 03-D-3 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | OTP request and verify endpoints under /c/{token} with SMS caps. |
| 03-D-4 | Reviewer D | docs/architecture/rfc/RFC-0003-scoring-service-and-model-reg | Confirmed (fixed) | input_hash now covers the full ScoringInput; supersedes added. |
| 03-D-5 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | Loose envelope, per-event validation, 400 documented. |
| 03-D-6 | Reviewer D | docs/architecture/rfc/RFC-0002-telemetry-sync-protocol.md | Confirmed (fixed) | Order-dependent reasons are deferred and retried; run_start creates runs. |
| 03-D-7 | Reviewer D | docs/architecture/data/schema.sql | Confirmed (fixed) | Clock check quarantines implausible times; default partition cleaned. |
| 03-D-8 | Reviewer D | docs/architecture/rfc/RFC-0002-telemetry-sync-protocol.md | Confirmed (fixed) | Quarantine linked to the student, capped, 30-day retention. |
| 03-D-9 | Reviewer D | docs/architecture/data/schema.sql | Confirmed (fixed) | item keyed by (id, content_version). |
| 03-D-10 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | Relink-code, consent-slip, flag, staff, share-link list and model endpoints added. |
| 03-D-11 | Reviewer D | docs/architecture/SYSTEM_DESIGN.md | Confirmed (fixed) | Shared state tables (OTP, sessions, re-link, rate limits) in PostgreSQL. |
| 03-D-12 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | Per-device and per-code keys with a high per-IP ceiling. |
| 03-D-13 | Reviewer D | docs/architecture/adr/ADR-0005-store-raw-events-append-only- | Confirmed (fixed) | trait_estimate versioned and unique per input. |
| 03-D-14 | Reviewer D | docs/architecture/rfc/RFC-0001-content-pack-format.md | Confirmed (fixed) | content_pack per class mode, size, URI, manifest; HTTP Range. |
| 03-D-15 | Reviewer D | docs/api/openapi.yaml | Confirmed (fixed) | Birth month + year; band re-checked at check-in. |
| 03-D-16 | Reviewer D | docs/architecture/data/schema.sql | Confirmed (fixed) | Roles, grants and immutability triggers added. |
| 03-D-17 | Reviewer D | docs/architecture/data/schema.sql | Confirmed (fixed) | Model kinds congruence and values; model_versions jsonb. |
| 03-D-18 | Reviewer D | docs/architecture/SYSTEM_DESIGN.md | Confirmed (fixed) | Pilot availability 99%; VM resized. |
| 03-D-19 | Reviewer D | docs/architecture/rfc/RFC-0003-scoring-service-and-model-reg | Confirmed (fixed) | Reproducibility defined (image digest, lockfile, tolerance). |
| 03-D-20 | Reviewer D | docs/architecture/data/schema.sql | Confirmed (fixed) | Missing FK indexes and FKs added. |
| 03-D-21 | Reviewer D | docs/architecture/diagrams/uml/class-domain.puml | Confirmed (fixed) | Class diagram and ERDs corrected; class count fixed. |
| 03-D-22 | Reviewer D | docs/architecture/diagrams/dfd/dfd-2-scoring.puml | Confirmed (fixed) | DFDs rebalanced; store-to-table mapping complete. |
| 03-D-23 | Reviewer D | docs/architecture/diagrams/c4/c4-3-components-api.puml | Confirmed (fixed) | C4-3 routers and relations; external systems listed. |
| 03-D-24 | Reviewer D | docs/api/README.md | Confirmed (fixed) | 403 only for roles; 404 for other tenants; 401s added. |
| 03-D-25 | Reviewer D | docs/architecture/diagrams/uml/state-week-run.puml | Confirmed (fixed) | Week-run state machine uses a deep-history state. |
| 04-B-1 | Reviewer B | docs/security/COMPLIANCE.md | Confirmed (fixed) | Slips + attestation + audit + ethics approval of both methods; the residual OTP limit is stated honestly. |
| 04-B-2 | Reviewer B | docs/ethics/CONSENT_FORMS.md | Confirmed (fixed) | Statement corrected. Urdu versions of forms C, D, E and withdrawal are still to be written (listed as to-do). |
| 04-B-3 | Reviewer B | docs/security/COMPLIANCE.md | Confirmed (fixed) | Form A (English and Urdu) now names flags and notes. |
| 04-B-4 | Reviewer B | design/specs/forms-and-errors.md | Confirmed (fixed) | Likely full names are now blocked. |
| 04-B-5 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | Fixed: API7 is SSRF and API10 is unsafe consumption; my earlier mapping was wrong. |
| 04-B-6 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | Web map moved to OWASP Top 10:2025. |
| 04-B-7 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | Cookie attributes and session rules specified; TC-SEC-17. |
| 04-B-8 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | Egress allowlist and IP checks; TC-SEC-16. |
| 04-B-9 | Reviewer B | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Consent records: study end + 1 year or the ethics period. |
| 04-B-10 | Reviewer B | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Deletion exceptions (backups, consent record) disclosed. |
| 04-B-11 | Reviewer B | docs/legal/PRIVACY_POLICY.md | Confirmed (fixed) | Privacy policy now says de-identified, not unlinkable. |
| 04-B-12 | Reviewer B | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Data safety: device or other IDs = yes (installation ID). |
| 04-B-13 | Reviewer B | docs/legal/PRIVACY_POLICY.md | Confirmed (fixed) | Processors (hosting, SMS, email) listed. |
| 04-B-14 | Reviewer B | docs/security/DPIA.md | Confirmed (fixed) | Paper forms added to the DPIA inventory. |
| 04-B-15 | Reviewer B | docs/security/DPIA.md | Confirmed (fixed) | Controller roles proposed; to confirm with the ethics office. |
| 04-B-16 | Reviewer B | docs/security/COMPLIANCE.md | Confirmed (fixed) | PECA 2016 as amended (2025) referenced. |
| 04-B-17 | Reviewer B | docs/security/COMPLIANCE.md | Confirmed (fixed) | PECA described as criminal law, not data protection. |
| 04-B-18 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | PIN required for shared phones; persistent counter; lock after 10. |
| 04-B-19 | Reviewer B | design/specs/forms-and-errors.md | Won't fix | Self-declared age with a neutral gate is the proportionate standard; the server enforces it and the band is re-checked yearly. |
| 04-B-20 | Reviewer B | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Notes and flags: end of the academic year, at most 12 months. |
| 04-B-21 | Reviewer B | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Key held as a Docker secret file, separate from backups; KMS in production. |
| 04-B-22 | Reviewer B | docs/security/SECURITY.md | Confirmed (fixed) | Play Integrity policy defined (never blocks; marks low-trust). |
| 04-C-1 | Reviewer C | docs/security/COMPLIANCE.md | Won't fix | Same as 04-Cha-19. |
| 04-C-2 | Reviewer C | docs/security/SECURITY.md | Confirmed (fixed) | Integrity checked on every compute; missing verdicts are marked low-trust and excluded from research, never blocking students on budget phones. |
| 04-C-3 | Reviewer C | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Same as 04-Cha-9. |
| 04-C-4 | Reviewer C | docs/security/COMPLIANCE.md | Confirmed (fixed) | Web deletion page is now a launch blocker. |
| 04-C-5 | Reviewer C | docs/security/SECURITY.md | False | TC-SEC-09 already tests the CORS allowlist. |
| 04-C-6 | Reviewer C | docs/security/DPIA.md | Confirmed (fixed) | DPIA R2 monitoring: cadence, threshold, owner. |
| 04-C-7 | Reviewer C | docs/security/SECURITY.md | Confirmed (fixed) | Refresh requests signed with a Keystore key; TC-SEC-18. |
| 04-C-8 | Reviewer C | docs/legal/PRIVACY_POLICY.md | Confirmed (fixed) | Device data reduced to tier + OS major; consent basis. |
| 04-C-9 | Reviewer C | docs/security/COMPLIANCE.md | Confirmed (fixed) | Same as 04-Cha-1. |
| 04-C-10 | Reviewer C | docs/security/SECURITY.md | Won't fix | MFA is still required after a reset, so an attacker needs both the email and the TOTP device. |
| 04-C-11 | Reviewer C | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Same as 04-Cha-21. |
| 04-C-12 | Reviewer C | docs/ethics/CONSENT_FORMS.md | Confirmed (fixed) | Form A explains research data after withdrawal. |
| 04-C-13 | Reviewer C | docs/security/SECURITY.md | Won't fix | Residual risk is documented in ADR-0013; only system CAs are trusted. |
| 04-C-14 | Reviewer C | docs/security/COMPLIANCE.md | Confirmed (fixed) | COMPLIANCE now says voluntary design, not compliance; re-review trigger added. |
| 04-C-15 | Reviewer C | design/specs/forms-and-errors.md | False | The PIN lockout is local to one phone; there is nothing to measure across devices. |
| 04-C-16 | Reviewer C | docs/security/DPIA.md | Confirmed (fixed) | Same as 04-Gro-8. |
| 04-C-17 | Reviewer C | docs/security/SECURITY.md | Confirmed (fixed) | Own whitelisted evaluator with limits and property tests. |
| 04-C-18 | Reviewer C | docs/legal/TERMS.md | Confirmed (fixed) | Terms softened; legal review noted. |
| 04-C-19 | Reviewer C | docs/security/COMPLIANCE.md | Confirmed (fixed) | Terms state O*NET's CC BY 4.0 licence; web-service terms checked before launch. |
| 04-C-20 | Reviewer C | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Research retention: the shorter of graded + 1 year and the ethics period. |
| 04-C-21 | Reviewer C | docs/security/SECURITY.md | Won't fix | security.txt and the disclosure policy are planned before launch (SECURITY §8). |
| 04-C-22 | Reviewer C | docs/ethics/CONSENT_FORMS.md | Confirmed (fixed) | Two-question comprehension check before the assent box. |
| 04-E-1 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Privacy policy states adults are excluded from research unless approved. |
| 04-E-2 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Reset email is queued, so timing is the same. |
| 04-E-3 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | §5.5 now lists the auth mechanism per user group. |
| 04-E-4 | Reviewer E | docs/security/DPIA.md | Confirmed (fixed) | Same as 04-Gro-6. |
| 04-E-5 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Same as 04-Gro-4. |
| 04-E-6 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Same as 04-Gro-19. |
| 04-E-7 | Reviewer E | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Same as 04-Cha-9, now in the privacy policy. |
| 04-E-8 | Reviewer E | docs/legal/PRIVACY_POLICY.md | Confirmed (fixed) | Under-13 deletion timeline stated. |
| 04-E-9 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Same as 04-Cha-22. |
| 04-E-10 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Class-code and share-link limits explicit. |
| 04-E-11 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Cloud First described as guidance, not binding. |
| 04-E-12 | Reviewer E | docs/legal/PRIVACY_POLICY.md | Won't fix | These are drafts; the contacts are set up before launch (DPIA action 4). |
| 04-E-13 | Reviewer E | docs/security/DPIA.md | Confirmed (fixed) | DPIA actions have owners and dates; approval condition stated. |
| 04-E-14 | Reviewer E | design/specs/forms-and-errors.md | False | Students have no free-text fields besides the nickname; 'my situation' is a picker; notes are written by staff. |
| 04-E-15 | Reviewer E | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Re-wrap procedure documented. |
| 04-E-16 | Reviewer E | docs/security/SECURITY.md | False | FLAG_SECURE also blanks the recent-apps thumbnail. |
| 04-E-17 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Same as 04-Cha-1 (second-staff spot check added). |
| 04-E-18 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Quality thresholds in scoring.json and RFC-0002. |
| 04-E-19 | Reviewer E | docs/legal/TERMS.md | Confirmed (fixed) | Session timeouts and a new-device notice added. |
| 04-E-20 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Content strings treated as untrusted for M4. |
| 04-E-21 | Reviewer E | docs/security/COMPLIANCE.md | Confirmed (fixed) | Same as 04-Gro-14. |
| 04-E-22 | Reviewer E | design/specs/forms-and-errors.md | Confirmed (fixed) | Limits apply equally to existing and non-existing accounts. |
| 04-E-23 | Reviewer E | docs/security/DATA_GOVERNANCE.md | Confirmed (fixed) | Breach notice goes through each school's coordinating teacher. |
| 04-E-24 | Reviewer E | docs/security/DPIA.md | Confirmed (fixed) | Same as 00-Goo-1. |
| 04-E-25 | Reviewer E | docs/security/SECURITY.md | Confirmed (fixed) | Jobs shown as their own trust zone. |
| 05-A-1 | Reviewer A | docs/devops/templates/docker-compose.yml | Confirmed (fixed) | Dockerfile creates /backups owned by the non-root user. |
| 05-A-2 | Reviewer A | docs/testing/TEST_CASES.md | Confirmed (fixed) | TC-SHARE rows put in order. |
| 05-A-3 | Reviewer A | docs/devops/templates/Dockerfile.api | Confirmed (fixed) | uv.lock is required, not optional. |
| 05-A-4 | Reviewer A | docs/devops/DEPLOYMENT.md | False | The command had no nested double quotes; it now uses single quotes anyway. |
| 05-A-5 | Reviewer A | docs/devops/CI_CD.md | Confirmed (fixed) | mypy --strict for scoring too. |
| 05-E-1 | Reviewer E | docs/devops/REPOSITORY.md | Confirmed (fixed) | Dry run and an explicit 'must not contain' list before staging. |
| 05-E-2 | Reviewer E | docs/devops/REPOSITORY.md | Confirmed (fixed) | Team, PR, tag, release and ethics steps added to the history rewrite. |
| 05-E-3 | Reviewer E | docs/devops/CI_CD.md | Confirmed (fixed) | One strategy: merge commits; ruleset wording fixed. |
| 05-E-4 | Reviewer E | docs/devops/templates/docker-compose.yml | Confirmed (fixed) | Migrations run in a one-shot container before the API starts. |
| 05-E-5 | Reviewer E | docs/devops/templates/docker-compose.prod.yml | Confirmed (fixed) | Compose v2.24+ required and stated. |
| 05-E-6 | Reviewer E | docs/devops/templates/docker-compose.prod.yml | Confirmed (fixed) | GlitchTip pinned by digest; CI rejects :latest. |
| 05-E-7 | Reviewer E | docs/devops/templates/docker-compose.yml | Confirmed (fixed) | Off-site copy and age encryption defined. |
| 05-E-8 | Reviewer E | docs/devops/CI_CD.md | Confirmed (fixed) | Restore target is a throwaway container. |
| 05-E-9 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | Join rate-limit test rewritten per key. |
| 05-E-10 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | Compute is synchronous; tests aligned. |
| 05-E-11 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | Suppression rule defined (k = 5, complementary). |
| 05-E-12 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | Sibling test narrowed to identifiers in requests. |
| 05-E-13 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | Matrix cell made one outcome (200 with per-event rejections). |
| 05-E-14 | Reviewer E | docs/testing/TEST_STRATEGY.md | Confirmed (fixed) | Drift check (oasdiff) separated from fuzzing. |
| 05-E-15 | Reviewer E | docs/testing/TEST_STRATEGY.md | Confirmed (fixed) | Load test uses the 250-session profile. |
| 05-E-16 | Reviewer E | docs/testing/TEST_STRATEGY.md | Confirmed (fixed) | Monkey runs per pre-set language with device and build recorded. |
| 05-E-17 | Reviewer E | docs/devops/CI_CD.md | Confirmed (fixed) | gitleaks baseline and exception process. |
| 05-E-18 | Reviewer E | docs/devops/CI_CD.md | Confirmed (fixed) | WireGuard VPN and break-glass instead of IP allowlists. |
| 05-E-19 | Reviewer E | docs/devops/templates/.env.example | Confirmed (fixed) | Master key is a Docker secret; format and command given. |
| 05-E-20 | Reviewer E | docs/devops/templates/Caddyfile | Confirmed (fixed) | CSP origin per environment; no inline scripts. |
| 05-E-21 | Reviewer E | docs/devops/DEPLOYMENT.md | Confirmed (fixed) | Same as 4. |
| 05-E-22 | Reviewer E | docs/project/GETTING_STARTED.md | Confirmed (fixed) | Ruleset grows with each sprint's checks. |
| 05-E-23 | Reviewer E | docs/project/CONTRIBUTING.md | Confirmed (fixed) | CONTRIBUTING now says merge commit. |
| 05-E-24 | Reviewer E | .gitignore | Confirmed (fixed) | CI check for tracked files that are ignored. |
| 05-E-25 | Reviewer E | docs/testing/TEST_CASES.md | Confirmed (fixed) | sqlmap moved to the manual pentest. |
| 06-A-1 | Reviewer A | design/game/frameworks/scoring.json | Confirmed (fixed) | MAP + Laplace instead of a 6-D grid. |
| 06-A-2 | Reviewer A | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Feasibility target lowered to r ≥ .80 (stretch .90). |
| 06-A-3 | Reviewer A | design/game/frameworks/scoring.json | Confirmed (fixed) | θ⁺ = Φ(θ) defined. |
| 06-A-4 | Reviewer A | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | One joint TIRT + GRM model on a common scale. |
| 06-B-1 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Simulation = feasibility; final parameters from the pilot. |
| 06-B-2 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Rasch first, ≥ 12 items per family, 2PL only with n ≥ 300. |
| 06-B-3 | Reviewer B | design/game/frameworks/scoring.json | Confirmed (fixed) | Same as 06-Gem-3. |
| 06-B-4 | Reviewer B | design/game/frameworks/scoring.json | Confirmed (fixed) | ability_support and marks_support defined. |
| 06-B-5 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Planner modelled as one ranking block. |
| 06-B-6 | Reviewer B | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Same as 06-Cha-1. |
| 06-B-7 | Reviewer B | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Language protocol for V2 defined. |
| 06-B-8 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Verbal task replaced by inference and meaning items. |
| 06-B-9 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Same as 06-Gem-4. |
| 06-B-10 | Reviewer B | design/game/frameworks/work_values.json | Confirmed (fixed) | Values shown as 'what you chose', not a measured trait. |
| 06-B-11 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Tie-break rule defined; never part of the fit score. |
| 06-B-12 | Reviewer B | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Individual precision via the SE rule. |
| 06-B-13 | Reviewer B | docs/project/SCIENTIFIC_BASIS.md | Confirmed (fixed) | Pre-registered rule with CI bounds. |
| 06-B-14 | Reviewer B | design/game/frameworks/riasec.json | Won't fix | The mapping file is created in the FYP-1 V1 task, before any calibration. |
| 06-B-15 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Cooking scene replaced by neutral school scenes. |
| 06-B-16 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Same as 00-Goo-5. |
| 06-B-17 | Reviewer B | design/game/frameworks/scoring.json | Confirmed (fixed) | δ set by bootstrap stability; not a probability. |
| 06-B-18 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Same as 01-Cha-5. |
| 06-B-19 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Learned ranker exploratory; split by vignette. |
| 06-B-20 | Reviewer B | design/game/frameworks/streams.json | Confirmed (fixed) | Occupation-to-stream mapping defined. |
| 06-B-21 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Weak signals have weight 0 in v1. |
| 06-B-22 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Posterior draws defined; stability, not chance of success. |
| 06-B-23 | Reviewer B | design/game/GAME_DESIGN.md | Confirmed (fixed) | Exposure control and logging stated. |
| 07-C-1 | Reviewer C | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Stale table removed; tokens.json is the master. |
| 07-C-2 | Reviewer C | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Same. |
| 07-C-3 | Reviewer C | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Same. |
| 07-C-4 | Reviewer C | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Focus dark fixed to #6FCBC5. |
| 07-C-5 | Reviewer C | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Strip size is 56px everywhere. |
| 07-C-6 | Reviewer C | design/specs/accessibility.md | Confirmed (fixed) | High-contrast theme added to all token files. |
| 07-C-7 | Reviewer C | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Pose list points to the full set. |
| 07-C-8 | Reviewer C | design/brand/BRAND_GUIDELINES.md | Won't fix | 4.6:1 meets AA and is measured; the high-contrast theme exists for harsher conditions. |
| 07-C-9 | Reviewer C | design/tokens/tokens.json | Confirmed (fixed) | Docs fixed; focus may share the secondary-text value (it is an outline, not text). |
| 07-C-10 | Reviewer C | design/specs/components.md | Confirmed (fixed) | Same as 07-Gro-5. |
| 07-C-11 | Reviewer C | design/brand/BRAND_GUIDELINES.md | Won't fix | A component-level rule, added when the LogoLockup component is built. |
| 07-C-12 | Reviewer C | design/specs/responsive.md | Won't fix | Capped display text stays at least twice the body size; headings are already large. |
| 07-C-13 | Reviewer C | design/specs/accessibility.md | False | content.yml already checks translation completeness (en/ur/roman). |
| 07-C-14 | Reviewer C | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | 'Ghar walon ko dikhao?' replaces 'Ammi Abbu'. |
| 07-C-15 | Reviewer C | design/tokens/tokens.json | Won't fix | 12px is the floor and scales with the system font; used only for short meta labels. |
| 07-D-1 | Reviewer D | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Brand guide now matches the Urdu-script student UI (FR-01). |
| 07-D-2 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | Assembled clips and a 'no audio yet' notice. |
| 07-D-3 | Reviewer D | design/specs/components.md | Confirmed (fixed) | Active tab gets a pill, bold label and selected state. |
| 07-D-4 | Reviewer D | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Accent is decorative with a ring or label. |
| 07-D-5 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | Auto-read off while TalkBack runs (FR-97 too). |
| 07-D-6 | Reviewer D | design/brand/mascot/README.md | Confirmed (fixed) | Ban narrowed to parent-facing pages. |
| 07-D-7 | Reviewer D | docs/project/STORE_AND_SEARCH.md | Confirmed (fixed) | Deletion URL and Data safety rows fixed. |
| 07-D-8 | Reviewer D | docs/project/STORE_AND_SEARCH.md | Confirmed (fixed) | Store copy says under-18s. |
| 07-D-9 | Reviewer D | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Same as 07-Gro-1. |
| 07-D-10 | Reviewer D | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | One mascot colour set per theme. |
| 07-D-11 | Reviewer D | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | tokens.json is the master; check_tokens.py fails on drift. |
| 07-D-12 | Reviewer D | design/specs/responsive.md | Confirmed (fixed) | Rotation supported (WCAG 1.3.4). |
| 07-D-13 | Reviewer D | design/specs/responsive.md | Won't fix | Same reasoning as 07-Gro-12. |
| 07-D-14 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | WCAG 2.2 checklist added. |
| 07-D-15 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | Same as 07-Gro-6. |
| 07-D-16 | Reviewer D | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Choice cards equal in weight (spec). The screen mock-ups still show filled cards and need updating. |
| 07-D-17 | Reviewer D | design/tokens/tokens.json | Confirmed (fixed) | Urdu type scale added. |
| 07-D-18 | Reviewer D | design/specs/components.md | Confirmed (fixed) | One stacking rule in both specs. |
| 07-D-19 | Reviewer D | docs/project/BRAND_DECISIONS.md | Confirmed (fixed) | Copy now says no pass or fail. |
| 07-D-20 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | Assistive technology never recorded. |
| 07-D-21 | Reviewer D | design/specs/accessibility.md | Confirmed (fixed) | Easy read rewrites, never removes. |
| 07-D-22 | Reviewer D | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Audience aligned to classes 8–12. |
| 07-D-23 | Reviewer D | design/brand/BRAND_GUIDELINES.md | Confirmed (fixed) | Reading font token and size budget added. |
| 07-D-24 | Reviewer D | docs/project/STORE_AND_SEARCH.md | Confirmed (fixed) | Store copy says play offline, results after sync. |
| 07-D-25 | Reviewer D | design/tokens/tokens.json | Confirmed (fixed) | Narration uses body-l. |
| 08-A-1 | Reviewer A | Career guidance games app Pakistan.md | Confirmed (fixed) | Primary source cited (Low et al. 2005, Psychological Bulletin). The reviewer's suggested journal (J. Counseling Psychology) was itself wrong. |
| 08-A-2 | Reviewer A | Career guidance games app Pakistan.md | False | Correct as cited (Wai, Lubinski & Benbow 2009, Journal of Educational Psychology). |
| 08-A-3 | Reviewer A | Career guidance games app Pakistan.md | Confirmed (fixed) | Corrected to Fisher's Z = .516 (r ≈ .47). |
| 08-A-4 | Reviewer A | Career guidance games literature review.md | Won't fix | Cannot be checked without the paper; check the 18 samples / 13 articles by hand. |
| 08-A-5 | Reviewer A | Career guidance games literature review.md | Confirmed (fixed) | Crossref: published 2020 (online 2018) in Recent Advances in Computer Science and Communications; fixed. |
| 08-A-6 | Reviewer A | Career guidance games literature review.md | Confirmed (fixed) | Brown & Ryan Krane (2000), summarised by Whiston, Rossier & Barón (2017, Crossref). |
| 08-A-7 | Reviewer A | Teen career app needs and design.md | Won't fix | Consistent with sources to date; re-check before submission. |
| 09-E-1 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-2 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-3 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-4 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-5 | Reviewer E | RahYaab Application/src/screens/Admin.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-6 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-7 | Reviewer E | RahYaab Application/src/scoring.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-8 | Reviewer E | RahYaab Application/src/scoring.js | False | The reviewer's own text shows no reachable bug (impossible case or harmless redundancy). |
| 09-E-9 | Reviewer E | RahYaab Application/src/scoring.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-10 | Reviewer E | RahYaab Application/src/scoring.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-11 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-12 | Reviewer E | RahYaab Application/src/screens/Auth.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-13 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-14 | Reviewer E | RahYaab Application/src/screens/Auth.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-15 | Reviewer E | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-16 | Reviewer E | career-game-prototype/engine/power_grid.py | False | The reviewer's own text shows no reachable bug (impossible case or harmless redundancy). |
| 09-E-17 | Reviewer E | career-game-prototype/engine/power_grid.py | False | The reviewer's own text shows no reachable bug (impossible case or harmless redundancy). |
| 09-E-18 | Reviewer E | career-game-prototype/engine/glyph_sequence.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-19 | Reviewer E | career-game-prototype/engine/glyph_sequence.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-20 | Reviewer E | career-game-prototype/tests/test_glyph_canvas.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-21 | Reviewer E | career-game-prototype/tests/test_aggregate.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-22 | Reviewer E | career-game-prototype/engine/session_log.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-E-23 | Reviewer E | career-game-prototype/engine/aggregate.py | False | The reviewer's own text shows no reachable bug (impossible case or harmless redundancy). |
| 09-E-24 | Reviewer E | career-game-prototype/tests/test_power_grid.py | False | The reviewer's own text shows no reachable bug (impossible case or harmless redundancy). |
| 09-E-25 | Reviewer E | RahYaab Application/src/games/Bart.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-1 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-2 | Reviewer B | RahYaab Application/App.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-3 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-4 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-5 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-6 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-7 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-8 | Reviewer B | RahYaab Application/src/scoring.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-9 | Reviewer B | RahYaab Application/src/store.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-10 | Reviewer B | career-game-prototype/engine/session_log.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-11 | Reviewer B | RahYaab Application/src/screens/Auth.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-12 | Reviewer B | career-game-prototype/engine/power_grid.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-13 | Reviewer B | career-game-prototype/engine/aggregate.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-14 | Reviewer B | career-game-prototype/engine/telemetry_schema.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-15 | Reviewer B | RahYaab Application/src/scoring.js | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-16 | Reviewer B | RahYaab Application/package.json | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
| 09-B-17 | Reviewer B | career-game-prototype/tests/test_calibration.py | Won't fix | Real issue in the archived prototype. Not fixed there: the prototype is reference-only and must never be given to students (REPOSITORY.md); the v1 design already prevents it, and TC-SCORE-10 guards the scoring edge cases. |
