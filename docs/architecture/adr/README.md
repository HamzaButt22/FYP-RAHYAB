# Architecture decision records

Each file records one decision: the context, what we chose, the consequences and the alternatives we rejected. The process is in [ADR-0001](ADR-0001-record-architecture-decisions.md). Bigger proposals start as an [RFC](../rfc/README.md).

| ADR | Decision | Status | Was |
|---|---|---|---|
| [ADR-0001](ADR-0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | — |
| [ADR-0002](ADR-0002-build-the-game-as-native-screens-in-one-expo-app.md) | Build the game as native screens in one Expo app | Accepted | SRS ADR-01 |
| [ADR-0003](ADR-0003-self-host-fastapi-and-postgresql-with-docker-compose.md) | Self-host FastAPI and PostgreSQL with Docker Compose | Accepted | SRS ADR-02 |
| [ADR-0004](ADR-0004-score-on-the-server-in-python.md) | Score on the server in Python | Accepted | SRS ADR-03 |
| [ADR-0005](ADR-0005-store-raw-events-append-only-and-derive-versioned-results.md) | Store raw events append-only and derive versioned results | Accepted | SRS ADR-04 |
| [ADR-0006](ADR-0006-ship-transparent-baselines-first-gate-the-learned-ranker.md) | Ship transparent baselines first; gate the learned ranker | Accepted | SRS ADR-05 |
| [ADR-0007](ADR-0007-no-third-party-sdk-receives-student-data.md) | No third-party SDK receives student data | Accepted | SRS ADR-06 |
| [ADR-0008](ADR-0008-serve-the-parent-view-as-a-server-rendered-web-page.md) | Serve the parent view as a server-rendered web page | Accepted | SRS ADR-07 |
| [ADR-0009](ADR-0009-write-the-story-in-ink-and-run-it-with-inkjs.md) | Write the story in Ink and run it with inkjs | Accepted | GDD v3 §10 |
| [ADR-0010](ADR-0010-work-offline-first-with-an-encrypted-sqlite-outbox.md) | Work offline first with an encrypted SQLite outbox | Accepted | SRS FR-34–36, NFR-31–35 |
| [ADR-0011](ADR-0011-use-pseudonymous-identity-with-class-codes-and-device-bound-tokens.md) | Use pseudonymous identity with class codes and device-bound tokens | Accepted | SRS FR-03–08, NFR-44 |
| [ADR-0012](ADR-0012-build-the-api-as-a-modular-monolith.md) | Build the API as a modular monolith | Accepted | — |
| [ADR-0013](ADR-0013-trust-system-cas-only-no-certificate-pinning.md) | Trust system CAs only; no certificate pinning | Accepted | SECURITY §3 |
| [ADR-0014](ADR-0014-keep-one-monorepo-with-pnpm-workspaces.md) | Keep one monorepo with pnpm workspaces | Accepted | SRS §13.3 |

## Template

Copy this for a new ADR:

```markdown
# ADR-NNNN: <decision in a few words>

| | |
|---|---|
| **Status** | Proposed / Accepted / Superseded by ADR-NNNN |
| **Date** | YYYY-MM-DD |
| **Deciders** | names |

## Context

What forces are at play? Link the requirements (FR/NFR IDs).

## Decision

What we will do, stated plainly.

## Consequences

The good, the bad, and the follow-up work.

## Alternatives considered

What we rejected, and why.
```
