# ADR-0010: Work offline first with an encrypted SQLite outbox

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS FR-34–36, NFR-31–35 |

## Context

Students play on shared phones with patchy mobile data and power cuts. No event may be lost (NFR-31: 0 loss in fault tests).

## Decision

- Every event is written to an **encrypted expo-sqlite** database (SQLCipher, with the key in the Android Keystore) **before** the story moves on.
- A sync worker sends batches of up to 500 events (≤ 1 MB gzip) to `POST /v1/events:batch`, with exponential backoff.
- The server deduplicates on `event_id` and acknowledges the accepted IDs. Only then are the local rows marked synced (RFC-0002).

## Consequences

- **Good:** the game can be played for a full week offline, and in effect each event is delivered exactly once.
- **Cost:** the app must manage local storage and migrate the local schema across versions.

## Alternatives considered

- **Online-only play:** rejected because of connectivity in pilot schools.
- **Firebase-based background sync libraries:** rejected under ADR-0007.
