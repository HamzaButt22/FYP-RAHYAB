# Rahyaab API specification

| File | What |
|---|---|
| [`openapi.yaml`](openapi.yaml) | **The contract.** OpenAPI 3.1: 50 operations, every request and response schema, security schemes and error shapes. It is validated with Redocly and has no errors. |
| [`api-reference.html`](api-reference.html) | The same spec as a readable reference page. Open it in a browser. |

The SRS (§12.7) lists the endpoints. This spec is the detailed version and wins if the two disagree. Change it in the same PR as the code, and regenerate the reference page (see the end of this file).

## 1. Conventions

| Topic | Rule |
|---|---|
| **Base URL and versioning** | `https://api.rahyaab.pk/v1` (placeholder domain). A breaking change, such as removing a field or tightening a type, needs `/v2`. Adding optional fields or new endpoints is non-breaking. Old versions stay up for one release after the app moves on. |
| **Format** | JSON, UTF-8, `snake_case`. Times are RFC 3339 in UTC. IDs are UUIDs, and event IDs are UUIDv7. |
| **Unknown fields** | Requests reject unknown fields (`additionalProperties: false`) with `422`, so typos can't slip through silently. |
| **Errors** | RFC 9457 `application/problem+json` with a stable `code`, such as `consent_required`, `insufficient_evidence` or `age_out_of_range`.<br>• Validation errors add `errors[]`: `{field, code, message_key}` for each field, so the app can show localised fix-it help (FR-102; rules in `design/specs/forms-and-errors.md`).<br>• Auth and code failures are deliberately generic and uniform (NFR-74).<br>• No stack traces, no echoed input, no personal data (NFR-37, NFR-72). |
| **Pagination** | Cursor-based: `?cursor=…&limit=25` (at most 100). The response has `items` and `next_cursor`. |
| **Idempotency** | `POST /events:batch` needs an `Idempotency-Key` header and is also deduplicated per `event_id`. Other POSTs are safe to retry only where the spec says so. |
| **Caching** | The content manifest uses `ETag` / `If-None-Match`. Student data responses send `Cache-Control: no-store`. |
| **Tracing** | Send `X-Request-Id`; the server echoes it and logs it without personal data. |
| **CORS** | Only the dashboard's exact origin is allowed, with credentials. No wildcard, no reflected origins. The mobile app and parent pages need no CORS (`docs/security/SECURITY.md` §5.1). |
| **Compression** | The client gzips event batches; the server compresses responses with gzip or brotli. |

## 2. Authentication and authorisation

| Caller | Scheme | Details |
|---|---|---|
| Student app | `Authorization: Bearer <JWT>` | 15-minute access token bound to the device. The refresh token rotates, and reusing one revokes the whole token family (ADR-0011). It comes from `/auth/student/join`, `/auth/student/individual` or `/auth/student/relink`. |
| Staff (teacher, counsellor, admin, researcher) | `__Host-rahyaab_session` cookie | Set after password (argon2id) + TOTP. HttpOnly, Secure, SameSite=Strict. State-changing calls also need `X-CSRF-Token`. |
| Parent | Capability token in the URL path (`/p/{token}`, `/c/{token}`) | 128-bit random token, stored hashed, expires in 30 days, revocable (RFC-0004). |

Every route checks **role + tenant (school) + consent** on every request.
- If an object belongs to another tenant, the server answers `404`, not `403`, so it doesn't reveal that the object exists.
- The authorisation matrix in `docs/testing/TEST_CASES.md` (T-SEC-05) is tested for every route.

| Route group | student | parent token | teacher / counsellor | admin | researcher |
|---|:-:|:-:|:-:|:-:|:-:|
| `/auth/*`, `/health` | public | — | public | public | public |
| `/me/*`, `/consents`, `/content/*`, `/events:batch`, `/results/*`, `/streams`, `/careers`, `/saved`, `/share-links` | ✓ own only | — | — | — | — |
| `/p/*`, `/c/*` (including `/c/{token}/otp` and `/otp/verify`) | — | ✓ that link only | — | — | — |
| `/dash/*` | — | — | ✓ own classes, consented students | ✓ | — |
| `/admin/*` | — | — | — | ✓ + MFA | — |
| `/research/*` | — | — | — | — | ✓ + MFA, opted-in data only |

## 3. Rate limits (NFR-40, NFR-67)

| Route | Limit | Key |
|---|---|---|
| `/auth/student/join` | 10 per 15 min per device; 30 failed attempts per hour per class code (then the code pauses); ceiling 300 per 15 min per IP | device key, class code, IP (each counted separately) |
| `/auth/student/relink` | 5 per 15 min per device; 10 failures per hour per IP | device key, IP |
| `/auth/staff/login`, `/auth/staff/mfa` | 5 per 15 min | account, and IP |
| `/c/{token}/otp` (send SMS) | 3 per link per day; 3 per phone per day; 20 per IP per hour | link, phone, IP |
| `/c/{token}/otp/verify` | 5 attempts per code | code |
| `/auth/staff/password-reset` | 3 per hour | email + IP |
| `/events:batch` | 60 per hour; ≤ 500 events and ≤ 1 MB per batch | student |
| `/results/compute` | 10 per hour | student |
| `/p/*`, `/c/*` | 30 per minute | IP |
| Everything else | 300 per minute | token or IP |

When a limit is hit, the server returns `429` with `Retry-After` and a `RateLimit` header. Counters live in PostgreSQL (`rate_limit`), so both API workers share them. Limits apply the same way to existing and non-existing accounts, codes and links. The per-IP numbers are deliberately high, because a whole class on school Wi-Fi, or many families on one mobile network (CGNAT), share one IP.

## 4. Main flows

The sequence diagrams in `docs/architecture/diagrams/uml/` show each flow step by step:

| Flow | Diagram |
|---|---|
| Join and consent | `seq-01-join-consent` |
| Play and sync | `seq-02-play-sync` |
| Compute results | `seq-03-compute-results` |
| Share with a parent | `seq-04-share-parent` |
| Staff login and roster | `seq-05-staff-login` |

## 5. Working with the spec

```bash
npx @redocly/cli lint docs/api/openapi.yaml
```

```bash
npx @redocly/cli build-docs docs/api/openapi.yaml -o docs/api/api-reference.html --title "Rahyaab API reference"
```

```bash
npx openapi-typescript docs/api/openapi.yaml -o frontend/shared/src/api.d.ts
```

- **In CI:** the API job checks that FastAPI's generated `/openapi.json` matches this file, ignoring order. A route missing from the spec fails the build, and so does a route that has no authorisation test (NFR-66).
