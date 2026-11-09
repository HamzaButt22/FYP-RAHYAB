# ADR-0012: Build the API as a modular monolith

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | — |

## Context

The team has three developers and one VM, and the pilot has at most a few thousand users. The backend still spans many domains: identity, consent, telemetry, scoring, library, sharing, dashboard, admin and research.

## Decision

The API is **one deployable FastAPI service** made of internal modules with clear boundaries (see the C4 component diagram).
- Modules talk through Python interfaces, not HTTP.
- Each module owns its own tables.
- Only the `jobs` worker runs as a second process, built from the same image.

## Consequences

- **Good:** simple deploys, transactions across modules, and one OpenAPI document.
- **Cost:** module boundaries need discipline. An import-linter rule in CI forbids cross-module imports except through `interfaces.py`.

## Alternatives considered

- **Microservices:** too much to operate.
- **Serverless functions:** cold starts, and NumPy/SciPy scoring fits poorly.
