# ADR-0005: Store raw events append-only and derive versioned results

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-04 |

## Context

Evidence rules, item parameters and recommenders will change after the pilot. Past results must stay explainable and re-computable.

## Decision

- Every gameplay event is stored **append-only** in `raw_event` (UUIDv7 key, partitioned by month).
- Trait estimates and recommendations are **derived** and immutable.
- Each derived record stores `model_version`, `content_version` and an `input_hash`.
- Rescoring writes new rows and never updates old ones.

## Consequences

- **Good:** full audit trail; rescoring reproduces results bit for bit (T-PAR-04); results from a bad model version can be found and rescored.
- **Cost:** storage grows. Retention (12 months, then aggregation) keeps it bounded.

## Alternatives considered

- **Store only final scores:** rejected, because rescoring and validity research would become impossible.
