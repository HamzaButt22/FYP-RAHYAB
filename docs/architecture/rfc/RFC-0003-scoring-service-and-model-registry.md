# RFC-0003: Scoring service and model registry

| | |
|---|---|
| **Status** | Accepted |
| **Author(s)** | Zahid Bashir |
| **Reviewers** | Hamza Butt, Daniyal Sarwar |
| **Created / decided** | 2026-11-04 / 2026-11-04 |
| **Requirements** | FR-40–58, NFR-01–03, NFR-10, NFR-59–62 |

## Summary

Scoring is one deterministic Python pipeline, `rahyaab_scoring`. It turns a student's raw events into trait estimates and a ranked, explained recommendation. Every model and parameter set is a registered, versioned artefact. Only an admin with MFA can activate one, and only with its evaluation report attached.

## Proposal

### Pipeline (one function call per result)

```
load runs + events  →  validity checks  →  M1 interests (TIRT + GRM, EAP)
                                         →  M2 abilities (staircase / Rasch)
                                         →  work values (Bradley–Terry counts)
→ confidence (SE, coverage, planner–scene ρ)
→ M3 rank (rules | congruence | ranker)  →  eligibility gates  →  Plan B
→ explanations (templates; M4 optional)  →  store recommendation (immutable)
```

- **Input hash:** `input_hash = sha256(canonical JSON of ScoringInput)`. `ScoringInput` holds the sorted event ids, the profile fields that change the output (grade, class mode, board, current group, situation, marks), the eligibility rule-set version, the content version and **every** model version used (M1, M2, values, M3, rules, explainer). A profile change or a grade check-in therefore gives a new hash and a new result. "Latest" means the newest `created_at`; a new result records the one it `supersedes`. A rollback to an older model produces a different hash from the current result, so it is stored as a new row too.
- **Interfaces:** `Estimator.fit/score`, `Recommender.rank`, `GateEngine.apply`, `Explainer.explain` (see the C4 code diagram). Each implementation is pure: no I/O inside.
- **Determinism:** fixed random seeds; CPU only, `float64`; BLAS pinned to one thread. Libraries are NumPy and SciPy at run time (LightGBM and SHAP only if the learned ranker is ever activated). Each model version records the scorer image digest and the lockfile hash. Reproducibility (T-PAR-04) means **bit-identical** results inside the same image, and results equal within 1e-9 (identical top-3 and bands) after a library upgrade; an upgrade that breaks this needs a new model version.

### Model registry (`model_version` table)

| Field | Meaning |
|---|---|
| `id` | For example `m1-tirt-2026.11.0` |
| `kind` | `irt`, `ability`, `values`, `congruence`, `ranker`, `rules`, `explainer` |
| `class_mode` | One row per mode (`matric`, `inter`, `university`, `alevel`); there is no "all" row |
| `artifact_uri` | A file path in the image or in the object store; SHA-256 recorded |
| `eval_report_uri` | Required before activation. It holds the metrics and fairness audit (§14.5) |
| `active` | Only one active per kind and class mode |

**Registration:** `POST /v1/admin/models` registers a version (inactive) with its artifact and hashes; `POST /v1/admin/models/{id}:activate` activates it.

**The learned ranker stays inactive until panel labels exist.** Its evaluation needs the counsellor-panel labels (`panel_label`, FR-79): at least 80 vignettes or profiles with panel agreement κ ≥ .40, split by vignette (never by rater) in 5-fold grouped cross-validation. Before the pilot, the congruence model is the only candidate for production.

**Promotion rule (ADR-0006):** a new ranker is activated only if:
- its evaluation report shows ≥ .05 NDCG@3 over the congruence baseline, with a CI that excludes 0;
- every fairness difference is ≤ .10.

**Rollback:** re-activate the previous version and run the `rescore` job for affected students. Old recommendations are kept, and new ones are added.

### When scoring runs

- On demand: `POST /v1/results/compute`, at the end of week 4 or when the student opens the letter.
- In batch: the `rescore` job, after a model activation or a content fix. It is idempotent by `input_hash`.

### As built in FYP-I (15 Nov 2026)

- **Endpoints:** `POST /v1/results/compute`, `GET /v1/results/latest` and `GET /v1/results/{id}/why` (`backend/api/src/rahyaab_api/routers/results.py`), scoring in `backend/scoring` (`interests.py`, `rules.py`, `recommend.py`). Class 9-10 only; other classes answer `422 mode_not_supported`.
- **Interest scores:** an interim scorer (`m1-counts-2026.11.0`) counts forced-choice wins until the Thurstonian IRT scorer exists; every result made with it is marked `provisional` and its confidence is at most "medium" (in practice "low", because the delta-method SE of a count is large at the extremes). Practice runs and accessible-mode runs are never scored (FR-98).
- **Rules:** the `doors` section of `streams.json` (1.4.0) links each class 9-10 path to the existing gates; a door resting only on unverified gates is shown as "check with your school or board".
- **Evidence (FR-51):** coverage below 80% or SE > 0.6 on 3+ types, or a flat profile, gives `409 insufficient_evidence`. Weeks played = the number of `week_complete` events: the envelope and `game_run` allow weeks 0-4 only, so the "extra week 5" of FR-51 is a fifth completed week.
- **Registry:** migration 0006 registers `m1-counts-2026.11.0` and `m3-congruence-2026.11.0`; both are code in the repository, pinned through each result's `input_hash`.
- **Reproducible (V7):** the same choices, context and versions always give the same `input_hash`, and the stored result is returned instead of a new one.

## Security, privacy and accessibility

- Excluded features: gender, district, school type and device. They are kept only in the audit dataset.
- Unmeasured tasks (accessible mode, "ask a friend") are treated as missing. The weights are renormalised, and the Blueprint says so (FR-98).
- The optional LLM (M4) gets only the computed result and runs self-hosted.

## Alternatives

- **MLflow:** heavier than needed. A table plus files gives the same audit trail for this project.
- **A separate scoring service over HTTP:** rejected under ADR-0012.

## Rollout and testing

- Golden-profile fixtures: 200 profiles with expected top-3 (T-PAR-03).
- A property test: adding a non-scored event never changes the result.
- A timing budget: p95 ≤ 2 s from request to stored recommendation (NFR-10).

## Open questions

- Pilot recalibration cadence: once after the pilot, or monthly? The proposal is once, at M-D.
