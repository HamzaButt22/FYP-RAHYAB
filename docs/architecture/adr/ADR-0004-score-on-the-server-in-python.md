# ADR-0004: Score on the server in Python

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-03 |

## Context

Scoring uses:
- Thurstonian IRT, GRM, staircase and Rasch models;
- a congruence recommender;
- later, LightGBM.

Results must be reproducible, versioned and updatable without an app release. Students must not be able to forge results on the phone.

## Decision

All authoritative scoring runs in the **`rahyaab_scoring` Python package on the server**. The app sends raw events only.

A small TypeScript port exists for two things:
- the provisional offline baseline, clearly labelled "provisional" (FR-49);
- task logic (staircase levels).

Both are parity-tested against Python on golden fixtures (T-PAR-01, T-PAR-03).

## Consequences

- **Good:** one reference implementation with full ML libraries; models change by activating a new version; results can't be tampered with on the phone.
- **Cost:** the final result needs a network connection. The provisional offline result covers the gap.
- **Cost:** the two baselines need parity tests in CI to stay in sync.

## Alternatives considered

- **All scoring on the device:** rejected, because the phone is untrusted and the ML libraries are too heavy.
- **A separate scoring microservice:** not needed at this scale (ADR-0012).
