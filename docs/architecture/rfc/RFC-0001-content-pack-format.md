# RFC-0001: Content pack format and versioning

| | |
|---|---|
| **Status** | Accepted |
| **Author(s)** | Daniyal Sarwar (content), Hamza Butt (app) |
| **Reviewers** | Zahid Bashir |
| **Created / decided** | 2026-11-04 / 2026-11-04 |
| **Requirements** | FR-81–83, FR-95, NFR-53, NFR-61 |

## Summary

All game and library content ships as a **signed, versioned content pack**. This covers:
- the compiled Ink story;
- string tables (Roman Urdu, Urdu script, English);
- task item banks;
- frameworks and streams;
- the recorded audio list.

The app bundles one pack and can download newer packs, so writers can fix a line without an app release.

## Motivation

Story text, Urdu wording and eligibility rules will change throughout the pilot. An app release takes days of review. Shipping JavaScript hot fixes for content would mix code and content and skip content review (§5.7).

## Proposal

### Layout

```
content-pack/
  manifest.json            # id, version (CalVer), min_app, sha256 of every file, signature
  story/your-year.ink.json # compiled by inklecate in CI
  strings/{en,ur,roman}.json
  tasks/{spatial,abstract,numerical,logic,planning,verbal}.json
  frameworks/{riasec,pairs,abilities,work_values,streams,scoring}.json   # from design/game/frameworks
  audio/index.json         # clip id → file, duration, transcript key
```

- **Version:** CalVer `story-YYYY.MM.N`, for example `story-2026.11.1`. Every telemetry event carries `content_version`.
- **Signature:** an Ed25519 signature over the manifest. The app holds only the public key. A pack that fails verification is ignored, and the last good pack stays active.
- **Delivery:**
  - `GET /v1/content/manifest` returns the active pack for the student's class mode, with an ETag. Each `content_pack` row has a `class_mode`, and a unique index allows only one active pack per mode.
  - Pack downloads support HTTP `Range` requests, so a download that breaks on 3G resumes instead of starting again; the app verifies the size and SHA-256 before use.
  - `GET /v1/content/packs/{id}` returns the zip.
- **Activation:** only an admin with MFA can activate a pack (`POST /v1/admin/content-packs`). Every activation is written to the audit log.
- **Compatibility:** `min_app` blocks packs that need newer task code. **A week that has started always finishes on the pack it started with**, so the measurement inside one run stays consistent.

### CI checks (T-CONT)

Each check fails the pack if it doesn't pass:
- the Ink compiles;
- the pairs cover `pairs.json` (each pair ≥ 2, each type ≥ 10);
- the JSON schema validates;
- every string key exists in all three languages;
- readability ≤ Grade 6 for English;
- every eligibility rule has a `source_url` and a `last_verified` date.

## Security, privacy and accessibility

- Signed packs stop a tampered pack from changing the questions.
- Packs contain no student data.
- Audio clips carry transcript keys, so captions always exist (accessibility spec §6).

## Alternatives

- **EAS Update for content:** rejected, because it mixes code and content and bypasses content review.
- **Content fetched from the API per scene:** rejected, because the game must work offline.

## Rollout and testing

- R1 bundles the pack; download and activation arrive in R2 (M-B).
- **Tests:**
  - golden playthroughs per pack (T-PAR-02);
  - signature-failure test;
  - mid-week pack-change test.

## Open questions

- Pack size limit for 3G: the proposal is ≤ 5 MB without audio, with audio as a separate optional pack.
