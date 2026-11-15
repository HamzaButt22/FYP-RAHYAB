# RFC-0002: Telemetry sync protocol (envelope v3)

| | |
|---|---|
| **Status** | Accepted |
| **Author(s)** | Zahid Bashir (API), Hamza Butt (app) |
| **Reviewers** | Daniyal Sarwar |
| **Created / decided** | 2026-11-04 / 2026-11-04 |
| **Requirements** | FR-34–39, NFR-31–35, NFR-45, NFR-67 |

## Summary

Gameplay events are written to an encrypted local outbox. They are uploaded in idempotent, gzip-compressed batches, and acknowledged per event. The server never trusts the client's order or its results: it validates each event, stores the valid ones append-only, and quarantines the rest.

## Proposal

### Client outbox (SQLite)

| Column | Notes |
|---|---|
| `event_id` | UUIDv7, generated on the device, primary key |
| `run_id`, `seq` | `seq` increases by 1 within a run |
| `payload` | The envelope v3 JSON (SRS §12.5); ≤ 1 KB |
| `state` | `queued` → `sending` → `acked`, or `rejected` |
| `attempts`, `next_try_at` | For backoff |

An event is committed **before** the story advances (FR-35). On a crash or kill, the app resumes from the last committed event.

### Upload

`POST /v1/events:batch`
- **Request:** `Content-Encoding: gzip`, `Idempotency-Key: <batch uuid>`.
- **Body:** `{ "events": [ … up to 500 ] }`, ≤ 1 MB compressed.
- **When:**
  - on an app foreground;
  - at the end of a scene, if online;
  - every 15 minutes while open;
  - on a connectivity change.
- **Backoff:** exponential, starting at 30 s, doubling up to 30 min, with ±20% jitter.

**Response `200`:**

```json
{ "accepted": ["0192f3c8-…"], "duplicates": ["…"],
  "deferred": [{ "id": "…", "reason": "unknown_run" }],
  "rejected": [{ "id": "…", "reason": "schema" }] }
```

**Client handling:**
- `accepted` and `duplicates` → `acked`;
- `deferred` (order-dependent: `unknown_run`, `sequence_gap`) → back to `queued` and resent after the earlier events of that run are acked; given up only after 7 days;
- `rejected` (final: the event itself is invalid) → `rejected`, kept locally for 7 days for debugging, and never retried.

**How runs and sittings are created.** The first event of every run is `run_start` at `seq` 0. The server creates the `game_run` row from it, and the `sitting` row (its `session_id`, one per app session) the first time a run of that session starts; `session_start` and `session_end` are ordinary events inside a run (built 15 Nov 2026, `routers/events.py`). `story_version` names the game module that produced the run (`module@1.0.0`, RFC-0005) and `content_version` the content pack whose items it uses. The app always sends events in `seq` order and never sends an event before its run's `run_start` is acked or in the same batch. An event whose run is not known yet is `deferred`, never lost.

### Server checks, in order

1. The token is valid and the device is bound to this student.
2. **The consent gate (NFR-45):** without valid parent consent → `403 consent_required`. The client keeps the events; they are purged on the device after 14 days without consent (FR-05).
3. Size and rate limits (NFR-67): `413` or `429` with `Retry-After`.
4. Per event:
   - JSON-schema validation against `Event` (the batch envelope itself is validated loosely, so one bad event never fails the whole batch);
   - the `schema_version` is known, and the `item_id` exists in that content version;
   - the `event_id` is a version-7 UUID whose embedded time is within [now − 60 days, now + 1 day] (otherwise reason `clock`: dead or reset phone clocks would land outside every monthly partition);
   - the `run_id` belongs to the student (unknown yet → `deferred`);
   - `seq` is the next number for the run with no duplicate (a gap → `deferred`; a duplicate `seq` with a different `event_id` → `sequence`), and `monotonic_ms` never decreases (→ `monotonic`);
   - no free text.

   A final failure goes to `quarantine` with its reason, the student id and the run id (`INSERT … ON CONFLICT (event_id) DO NOTHING`, so a replayed bad batch is harmless). Quarantine rows are deleted after 30 days, and at once when the student is erased or withdraws consent.
5. Insert with `ON CONFLICT (event_id) DO NOTHING`. Conflicts are reported as `duplicates`.

**As built (15 Nov 2026):**
- A rejected event still uses up its `seq` (the server counts quarantined numbers of the run), so later events of the run are never stuck behind a bad one.
- An entry without a readable `event_id` can't be acknowledged or quarantined; it is only counted in `unreadable`.
- A run id that belongs to another student is rejected as `sequence`.
- The phone sends batches uncompressed for now (500 events of ≤ 1 KB fit the 1 MB limit); the server accepts gzip whenever the app adds it.

## Security, privacy and accessibility

- No personal data appears in events.
- Wall-clock time is rounded to the minute.
- Gzip-bomb protection: the server decompresses in a stream and caps the decompressed size at 4 MB.
- Implausible patterns are flagged for confidence, never used to block a student. The thresholds live in `design/game/frameworks/scoring.json` (`quality`):
  - impossible speed (a choice in under 300 ms after the options appear);
  - always the same side (≥ 90% of ≥ 10 choices in a week on one side);
  - duplicate sequences (the same pattern of 5 or more answers repeated).

## Alternatives

- **One request per event:** too chatty on 3G and drains the battery.
- **WebSocket streaming:** unnecessary; the play is not real-time.

## Rollout and testing

- **T-INT-02:** batch validation.
- **T-INT-03:** idempotency (re-sending a batch creates 0 new rows).
- **T-REL-01:** 100 forced kills and airplane-mode toggles, with 0 events lost.
- **Fuzz:** malformed events land in quarantine and never cause a 500.

## Open questions

- Should events be signed with the device key? Deferred: refresh tokens are already bound to a Keystore key (ADR-0011); Play Integrity (NFR-68) and server-side plausibility checks cover the pilot.
