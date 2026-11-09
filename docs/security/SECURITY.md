# Rahyaab security: threat model and hardening rules (v1, 4 Nov 2026)

Rahyaab holds data about **minors**, so a leak would harm children, families and schools. This document defines what we protect, who might attack it, the attack paths (STRIDE), and the controls that close them.

**Standards:**
- OWASP MASVS v2.1 L1 + MASVS-PRIVACY (app);
- OWASP ASVS 5.0 L2 (API and web);
- the ICO Children's Code (privacy);
- OWASP Top 10 and the Mobile Top 10 2024.

**Requirements:** SRS NFR-36 to NFR-49 and NFR-66 to NFR-72. Tests: SRS §14 T-SEC and T-PRIV.

**Rules that never bend:**
1. **No backdoors.** No hidden admin accounts, master passwords, debug endpoints, test logins or "skip auth" flags in any release build or server.
2. **No secrets in the app.** The app bundle is public; anything in it can be read.
3. **The server decides.** Scores, recommendations and consent states are computed and enforced on the server. The phone only sends raw events.
4. **Collect less.** We can't leak what we never collect: no names, phone numbers, emails, CNIC/B-form numbers, photos, contacts or precise location from students.

---

## 1. What we protect

| Asset | Classification | Where it lives | Protection |
|---|---|---|---|
| Student profile (nickname, class, board, district, optional marks) | Confidential (minor) | Phone (encrypted SQLite), PostgreSQL | Pseudonymous UUID; encryption at rest; RBAC |
| Gameplay events and results | Confidential (minor, profiling) | Phone outbox, `raw_event`, `recommendation` | Consent gate; append-only; retention 12 months |
| Parent contact (individual path only) | Restricted | Separate `guardian_contact` table, encrypted column | Separate role; never in exports |
| Consent records | Restricted (legal) | `consent` | Append-only, versioned |
| Staff accounts | Restricted | `staff_user` | argon2id, MFA, lockout |
| Share-link tokens | Secret | `share_link` (hash only) | ≥ 128-bit random, hashed, 30-day expiry, revocable |
| Signing keys, API secrets, DB passwords | Secret | CI secrets store, server env (never the repo) | Least privilege; rotation |
| Item parameters and model files | Internal (integrity matters) | Server, content packs | Versioned, signed releases; admin MFA |

## 2. Who might attack, and why

| Actor | Goal | Example |
|---|---|---|
| Curious student / sibling on a shared phone | See someone else's results | Opens the app on a family phone |
| Student gaming the result | Force a "doctor" result | Edits the app or replays requests |
| Outsider scanning the internet | Steal data, deface, ransom | Probes the API, brute-forces logins |
| Malicious or careless insider (staff, team member) | Browse or export data | Teacher looks up students outside their class |
| Supply-chain attacker | Run code in our build | Poisoned npm or PyPI package |
| Phone malware | Read app storage or traffic | Rooted phone, overlay apps |

## 3. Threats by component (STRIDE) and controls

| Component | Threat (STRIDE) | Control |
|---|---|---|
| **Mobile app** | **S**poofing: fake app or emulator sends events | Device token per profile; **Play Integrity** standard request (`@expo/app-integrity`, a per-action hash, verified on the server) on join and on every result compute. **Policy:** a missing verdict (no Play services, a sideloaded pilot APK, offline) or a failed one never blocks a student; the result is still computed but marked low-trust, gets a quality flag, and is excluded from research analyses. Server-side validation of every event either way |
| | **T**ampering: edited app sends crafted choices to force a result | Scoring only on the server from raw events; schema, sequence and monotonic-time checks; implausible patterns (impossible speed, always-left, duplicate sequences) lower confidence and are flagged; results never accepted from the client |
| | **I**nformation disclosure: another person on the phone sees data | Per-profile PIN; encrypted SQLite (SQLCipher-enabled expo-sqlite, key in Android Keystore via `expo-secure-store`); wipe on sign-out; `FLAG_SECURE` on result and share screens; no results in notifications or app-switcher previews |
| | Information disclosure: logs and backups leak data | No PII in logs; release builds strip console logs; `android:allowBackup="false"` and data-extraction rules exclude the DB; no external-storage writes |
| | Information disclosure: traffic interception | TLS 1.2+ only, `cleartextTrafficPermitted=false`, HSTS; certificate pinning **not** used (breaks on school proxies and blocks hot-fix rotation), but the Android network security config trusts system CAs only, never user CAs |
| | **E**levation: debug features in release | Dev menu, Expo dev client, Flipper and test hooks are compiled out of release; a CI check fails the build if `__DEV__` code paths or test endpoints are reachable |
| **API (FastAPI)** | Spoofing: stolen or guessed tokens | Short-lived access tokens (15 min) + rotating refresh tokens; each refresh request is **signed with a non-exportable Keystore key** whose public key the server stored at join, so a copied refresh token is useless on another device (ADR-0011); refresh reuse detection revokes the family of tokens; class codes rate-limited and expiring |
| | Tampering: injection | Parameterised SQL only (SQLAlchemy Core/ORM); Pydantic schemas with strict types and size limits on every input; no free text in events. Eligibility rules use **our own small whitelisted evaluator** (about 100 lines): only `var`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `not`, `in`; no function calls, no attribute access, rule depth ≤ 8, rule size ≤ 2 KB; property-based tests (Hypothesis) reject anything else; no `eval` |
| | **R**epudiation: "I never changed that" | Append-only audit log of staff and admin reads and changes (actor, time, object) |
| | Information disclosure: IDOR (reading another student's record by changing an ID) | Every query scoped by the caller's tenant (school) and role; object-level authorisation tests for every route (T-SEC-05); UUIDs are not treated as secrets |
| | Information disclosure: verbose errors | Generic error messages; stack traces only in server logs; no version banners |
| | **D**enial of service: floods | Rate limits counted in PostgreSQL (shared by all workers): staff login 5 per 15 min per account and per IP; class-code join 10 per 15 min per device and 30 failures per hour per code (then the code pauses), with a high per-IP ceiling (300 per 15 min) because a class shares school Wi-Fi or a mobile CGNAT IP; parent OTP caps per link, phone and IP (RFC-0004); share links 30/min per IP. Limits apply the same way to existing and non-existing accounts and codes, so a limit never reveals which exist. Request size limits (events batch ≤ 500 events, ≤ 1 MB gzip); timeouts; Caddy in front |
| | Elevation: admin routes exposed | Admin and research routes require MFA and the admin role; optional IP allowlist; no default accounts; first admin created by a one-time CLI command, never by a hidden route |
| **Parent page** | Spoofing / disclosure: guessed share links | 128-bit random tokens, stored hashed; expiry; revocation; `noindex`, `Referrer-Policy: no-referrer`; no student identifiers in the URL |
| | Tampering: XSS, clickjacking | Server-rendered templates with auto-escaping; strict **Content-Security-Policy** (no inline scripts), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` |
| **Dashboard** | Spoofing: password attacks | argon2id hashes; MFA required; lockout with backoff; breached-password check (k-anonymity range query, optional) |
| | Information disclosure: over-broad access | Teachers see only consented students in their own classes; aggregates suppress cells under 5; CSV exports logged |
| | CSRF and session theft | Session cookie `__Host-rahyaab_session`: `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`; a new session ID after login and after MFA; idle timeout 30 min, absolute 8 h; sessions stored server-side (`staff_session`) and revoked on logout, password reset or account disable; a login from a new device or network triggers an email notice. CSRF tokens on every state-changing request. TC-DASH-06 and an automated cookie-attribute test |
| **Database and server** | Disclosure: stolen disk or backup | Disk encryption; nightly `pg_dump` encrypted (age) before leaving the server; restore drill each semester |
| | Elevation: lateral movement | Separate DB roles for API, jobs and research exports; no superuser at run time; containers run as non-root, read-only file systems where possible; SSH by key only, no root login, firewall open only on 443 (and 22 from team IPs) |
| **Build and supply chain** | Tampering: poisoned dependency or CI | Lockfiles committed; Dependabot; `pnpm audit` and `pip-audit` gates; **gitleaks** secret scan; **CodeQL** (JS/TS, Python); dependency review on PRs; SBOM (CycloneDX) per release; pinned GitHub Actions by commit SHA; least-privilege `GITHUB_TOKEN`; release signing key only in the EAS/CI secret store |
| **Scoring and models** | Tampering: poisoned content or parameters | Content packs and model versions activated only by MFA admins; diffs reviewed; every result stores the model and content version, so a bad version can be found and rescored |
| **LLM (M4, optional)** | Disclosure / injection | Self-hosted only; input is the de-identified computed result (no free text from students). Stream names and labels come from admin-managed content, so they are treated as untrusted too: only IDs and enum values go into the prompt, between fixed delimiters, and the output is checked against the input (no new streams, claims or instructions) |

## 4. Data flow and trust boundaries

```
[Phone: untrusted]  --TLS-->  [Caddy]  -->  [FastAPI: validates everything]  -->  [PostgreSQL: private network only]
   encrypted SQLite                          auth, consent gate, RBAC, rate limits        separate roles, encrypted backups
[Parent browser: untrusted] --TLS--> [Caddy] --> [server-rendered page, token-scoped]
[Dashboard browser: untrusted] --TLS--> [Caddy] --> [API, MFA session, tenant-scoped]
[Jobs: own trust zone] --server-side only--> [O*NET Web Services]   (no student data ever leaves)
   least-privilege DB role, no inbound network, outbound only to an allowlist, every run logged
```

Everything left of the API is untrusted. The API re-checks identity, consent, role and input on every request. The jobs container is a separate trust zone: it can read student data, so it has its own least-privilege database role (`jobs`), no exposed ports, an outbound allowlist, and an audit entry per run.

## 5. Secure coding rules (checked in code review)

1. No secrets, keys, tokens or real data in the repo, the app bundle, logs, screenshots or test fixtures. Use `.env` files that are git-ignored, plus the CI secret store.
2. Validate every input on the server: type, range, length and allowed values. Reject unknown fields.
3. Parameterised queries only. No string-built SQL, shell commands or `eval`.
4. Authorisation on every route and every object, with a test for it.
5. Errors: a plain message to the user; details only in server logs, without personal data.
6. No new third-party SDKs that receive student data (analytics, ads, crash reporting in the cloud). Crash reporting is self-hosted (GlitchTip) with PII scrubbing.
7. Every new permission in `app.json` needs a team review. The app needs only INTERNET (and VIBRATE).
8. Feature flags never bypass authentication or consent.
9. Dependencies: prefer well-maintained packages; review the licence and the last release date; no packages from personal forks.
10. Every security-relevant change gets a second reviewer.

### 5.1 CORS and browser policy (NFR-77)

- **The mobile app does not need CORS.** It is not a browser, so the API never relaxes CORS for it.
- **Allowed origins:** an exact allowlist of the dashboard's own origin per environment (for example `https://dashboard.rahyaab.pk`).
  - **Never** `*`.
  - **Never** a reflected `Origin`.
  - **Never** `null`.
  - No wildcard subdomains.
- **Credentials:** `Access-Control-Allow-Credentials: true` only for that allowlisted origin, because the dashboard uses a session cookie.
- **Methods and headers:** only those the dashboard uses (`GET, POST, PATCH, DELETE`; `Content-Type`, `X-CSRF-Token`, `X-Request-Id`). Preflight results are cached for 10 minutes.
- **Parent pages** (`/p`, `/c`) are same-origin HTML with no CORS headers at all.
- **Public routes** (`/health`) send no CORS headers.
- **Defence in depth:** CORS is not access control. Every request is still checked for authentication, CSRF (on state changes), role and tenant.

### 5.2 Staff password reset (FR-106)

1. **Request:** "Forgot password" on D-01 asks for the email. The response is always the same: "If an account exists for that email, we've sent a link." The handler only writes a job to a queue and returns at once; the email is sent later by the jobs worker. So the status, body and timing are the same whether or not the account exists.
2. **Token:** a single-use, 128-bit random token, valid for **30 minutes**. Only its SHA-256 hash is stored (`password_reset`). At most 3 requests per hour per email and per IP.
3. **Reset:** the new password must meet the policy (12+ characters, not breached). Using the link alone never logs anyone in: **MFA is still required** at the next login.
4. **After a reset:** all sessions and other reset tokens for that account are revoked, the event is written to the audit log, and a "your password was changed" notice is emailed.
5. **Admins** can force a reset or disable an account. Nobody can see or set another person's password, and there is no master password.

### 5.3 Helpful errors that don't leak

Users get specific help on **format** ("Codes look like RYB-4K2"), but secrets and existence checks stay **generic and uniform**: the same message, status and timing whether a code, token or account exists or not.

Also:
- input is never echoed;
- zero-width and bidi-override characters are stripped;
- every field has a length cap on both the client and the server.

The full rules are in `design/specs/forms-and-errors.md` §4 (FR-102, NFR-74).

### 5.4 Input validation and data cleaning, layer by layer (NFR-37, NFR-73)

No single layer is trusted. Each one checks what it can, and the server repeats every check.

| Layer | What it checks | How | What happens on failure |
|---|---|---|---|
| 1. App (untrusted) | Format and length, for helpful messages only | Shared rules from `design/specs/forms-and-errors.md`; length caps; strip zero-width and bidi characters; Unicode NFC | Inline message (FR-102). Never relied on for security |
| 2. Edge (Caddy) | Size and rate | Body size caps, TLS only, rate limits, security headers | `413` / `429` |
| 3. API schema | Type, range, length, allowed values, **unknown fields** | Pydantic v2 strict models with `extra="forbid"`; enums for every closed set; separate read and write models, so `role`, `school_id`, `consent_state` and IDs can never be set by the client (**mass assignment**) | `422` with field keys, no echo of the input |
| 4. API business rules | Is this caller allowed to do this to this object, now? | Auth, then consent gate, role, tenant (school) and object ownership, in that order, on every route (`TEST_CASES.md` §3) | `401` / `403` / `404` (404 when existence itself is private) |
| 5. Database | Last line of defence for integrity | Parameterised queries only; `NOT NULL`, `CHECK`, `FOREIGN KEY`, `UNIQUE` and enum constraints (`database/schema.sql`); least-privilege roles (the API role cannot drop or alter tables or read research exports) | Transaction rolled back; logged without personal data |
| 6. Scoring (data cleaning) | Is this play data trustworthy enough to score? | Duplicate and out-of-order events removed by idempotency key and sequence; impossible response times, straight-lining and repeated patterns flagged; low-information runs get lower confidence; data is never silently "fixed" | Result shown with a confidence band, or the student is offered a replay (`EDGE_CASES.md`) |
| 7. Research exports | Re-identification | De-identified IDs, age bands, cells under 5 suppressed, free text never exported | Export blocked (T-PRIV-02) |

### 5.5 Access control: who can reach what

| Who | How they authenticate | Front end | API (object-level check) | Database |
|---|---|---|---|---|
| Student (app) | Device-bound bearer token (signed refresh) | Own profile on the device, behind a PIN | `/me`, `/events`, `/results`, `/share-links`, `/saved`: only the caller's own objects, after consent | Never directly |
| Parent | 128-bit capability token in the URL path | Share-link page for their own child(ren) only, read-only | `/p/{token}`, `/c/{token}`: only the one object the token names | Never directly |
| Teacher / counsellor | Session cookie after password + TOTP | Dashboard | `/dash/*`: consented students in their own classes (`staff_class`); aggregates with small cells hidden; other classes → 404 | Never directly |
| School admin | Session cookie after password + TOTP | Dashboard | Own school's classes, codes, consent slips and staff | Never directly |
| Platform admin (team) | Session cookie after password + TOTP, optional IP allowlist | Admin routes | `/admin/*`: content packs, model registry, staff, audit; no reading of individual results without a logged reason | Through migrations and the jobs role only; no superuser at run time |
| Researcher (team) | Session cookie after password + TOTP | None | `/research/*`: vignettes, labels, de-identified export | Read-only role on de-identified export views only |

The full route-by-role matrix is in `docs/testing/TEST_CASES.md` §3 and is tested route by route (TC-SEC-05).

### 5.6 OWASP coverage map

Every item in the three current OWASP Top 10 lists that applies to Rahyaab, with its control and its test. The web list is the **OWASP Top 10:2025**, which replaced the 2021 edition.

**Web: OWASP Top 10 (2025)**

| OWASP item | Control in Rahyaab | Test |
|---|---|---|
| A01 Broken Access Control (now includes SSRF) | Tenant, role and ownership checks on every route; cross-tenant objects return 404; admin routes need MFA; deny by default. SSRF: only scheduled jobs make outbound calls, to a fixed allowlist (O*NET), with redirects off, resolved IPs checked against private, loopback and link-local ranges, and a container egress allowlist; no user-supplied URL is ever fetched | TC-SEC-05, TC-DASH-02, TC-SEC-16 |
| A02 Security Misconfiguration | Hardened headers, no debug in release, no default accounts, exact CORS allowlist (§5.1), secure cookie attributes | TC-SEC-04, TC-SEC-09 |
| A03 Software Supply Chain Failures | Lockfiles, Dependabot, `pnpm audit`, `pip-audit`, SBOM, pinned CI actions and image digests, signed content packs | CI gate (NFR-41, NFR-71) |
| A04 Cryptographic Failures | TLS 1.2+, HSTS; argon2id; SQLCipher on the phone; encrypted backups; tokens stored hashed; envelope encryption with key rotation | TC-SEC-06, TC-SEC-08, TC-SHARE-01 |
| A05 Injection: **SQL injection** | SQLAlchemy parameterised queries only; no string-built SQL; database roles cannot alter the schema | TC-SEC-12 |
| A05 Injection: **XSS** | Jinja2 and React auto-escaping; a lint rule bans `dangerouslySetInnerHTML` and the Jinja `safe` filter; strict CSP without inline scripts; teacher notes stored as plain text | TC-SEC-13, TC-SHARE-05 |
| A06 Insecure Design | Threat model (§3), DPIA, consent gate designed in, abuse cases in `EDGE_CASES.md` | Design review |
| A07 Authentication Failures | MFA for staff; lockout and backoff; device-bound refresh tokens with reuse detection; enumeration-safe reset (§5.2) | TC-SEC-10, TC-SEC-11 |
| A08 Software or Data Integrity Failures | Signed content packs, verified on the phone; zip-slip and zip-bomb checks; immutable results with versions | TC-SEC-15, TC-SYNC-06 |
| A09 Security Logging and Alerting Failures | Append-only audit log; alerts on auth failures and unusual exports; no personal data in logs | TC-SEC-04, T-PRIV |
| A10 Mishandling of Exceptional Conditions | Every exception becomes a generic `problem+json` error; fail closed on auth and consent checks; per-event quarantine instead of batch failure; chaos tests for database, disk and worker failures | TC-CHAOS-01–08, TC-SYNC-06 |
| CSRF (not a separate category) | SameSite=Strict cookies + CSRF token | TC-DASH-06 |

**API: OWASP API Security Top 10 (2023)**

| OWASP item | Control in Rahyaab | Test |
|---|---|---|
| API1 Broken Object Level Authorization | Ownership and tenant check on every object id | TC-SEC-05 |
| API2 Broken Authentication | As A07 above | TC-SEC-10, TC-SEC-11 |
| API3 Broken Object Property Level Authorization | `extra="forbid"`; separate read and write models; responses built from explicit output models | TC-SEC-14 |
| API4 Unrestricted Resource Consumption | Rate limits, batch and body caps, timeouts, SMS caps | TC-SYNC-06, TC-SHARE-03, NFR-75 |
| API5 Broken Function Level Authorization | Role check per route; admin and research routes need MFA | TC-SEC-05 |
| API6 Unrestricted Access to Sensitive Business Flows | Class codes, claim codes, share links, OTPs and resets are rate-limited, single-use or expiring | TC-SHARE-03, TC-SEC-10 |
| API7 Server Side Request Forgery | As A01 SSRF above | TC-SEC-16 |
| API8 Security Misconfiguration | As A02 above | TC-SEC-04, TC-SEC-09 |
| API9 Improper Inventory Management | One OpenAPI file is the source of truth; a route not in it fails the backdoor sweep | TC-SEC-04 |
| API10 Unsafe Consumption of APIs | O*NET and SMS responses are validated against a schema, size-capped and time-limited; failures fall back to cached data | Code review, TC-CHAOS |

**Mobile: OWASP Mobile Top 10 (2024)**, checked with MASVS L1 + PRIVACY (NFR-36, TC-SEC-01)

| Item | Control |
|---|---|
| M1 Improper credential usage | No secrets in the app bundle; tokens in Android Keystore |
| M2 Inadequate supply chain security | Same CI gates as the server; Expo modules only from known publishers |
| M3 Insecure authentication / authorisation | All checks on the server; the app never decides access or results |
| M4 Insufficient input/output validation | Server re-validates everything; Ink content is signed, not user-supplied |
| M5 Insecure communication | TLS only; system CAs only; no cleartext |
| M6 Inadequate privacy controls | Data minimisation, no third-party SDKs, `FLAG_SECURE`, consent gate (MASVS-PRIVACY) |
| M7 Insufficient binary protections | Release build stripped of dev tools; optional Play Integrity |
| M8 Security misconfiguration | `allowBackup=false`; only INTERNET and VIBRATE permissions |
| M9 Insecure data storage | SQLCipher database, key in Keystore, wiped on sign-out |
| M10 Insufficient cryptography | Platform crypto only (Keystore, SQLCipher, TLS); no home-made crypto |

## 6. Security testing

| Test | Tool | When |
|---|---|---|
| Static analysis | CodeQL, ESLint security rules, Bandit (Python), Semgrep (OWASP rules) | Every PR |
| Secrets | gitleaks (repo and history) | Every PR + weekly |
| Dependencies | Dependabot, `pnpm audit`, `pip-audit`, dependency review | Every PR + weekly |
| Mobile app | **MobSF** static and dynamic scan of the release APK; OWASP MASTG checklist (storage, network, platform, code, resilience, privacy) | Each release |
| API and web | **OWASP ZAP** baseline in CI against staging; authenticated full scan before the pilot; IDOR matrix tests (T-SEC-05) | Nightly / pre-pilot |
| Manual penetration test | MASTG + ASVS L2 test cases by a team member who did not write the code, or a university security lab | Before the pilot |
| Privacy | Data inventory vs manifest and network trace (T-PRIV-01); export de-identification (T-PRIV-02); retention and deletion (T-PRIV-03) | Pre-pilot |
| Backdoor sweep | Search for hard-coded credentials, test routes, debug flags and default accounts; review all routes in OpenAPI against the auth matrix | Each release |
| Abuse and resilience | Enumeration and timing tests (TC-VAL-03), Schemathesis fuzzing, spike, soak, break-point and chaos tests (`docs/testing/TEST_STRATEGY.md` §3.1) | Nightly, weekly, pre-pilot |

A release is blocked by any critical or high finding without a fix or a documented, supervisor-approved exception.

## 7. Incident response

1. **Detect:** alerts on error spikes, auth failures and unusual exports; audit log review weekly.
2. **Contain:**
   - revoke tokens and keys;
   - disable the affected route or feature flag;
   - rotate secrets.
3. **Assess:** what data, whose, and how many records.
4. **Notify:** schools and parents within 72 hours, in Urdu and English, with what happened and what to do.
5. **Fix and learn:** a patch, a test that would have caught it, and a short post-incident note.

## 8. Responsible disclosure

The parent page and app listing link to a security contact (`security@` address) and a `/.well-known/security.txt`. Reporters get a reply within 7 days, and good-faith research is not pursued legally.

## 9. Readiness checklist: designed, built or tested? (status on 9 Nov 2026)

An honest status for each check, so nobody mistakes a design for a working control. **Designed** = specified in this document or the API spec; **Built** = the code or configuration exists in the repository; **Tested** = it ran and passed (unit test, or on a real PostgreSQL / container). Only the API skeleton (`/v1/health`) exists yet, so most controls are still *designed*. Update this table in the same PR that builds each control.

### 9.1 The ten common API failures

| Risk | How Rahyaab handles it | Status |
|---|---|---|
| Trusting the front end | The server re-validates every input and computes every result from raw events; the app never decides access or scores (§3, ADR-0004) | Designed |
| Broken access control | Deny by default; role, tenant and ownership checked on every route; other tenants' objects return 404 (§5.5, TC-SEC-05) | Designed. Database side **tested**: `api_rw` cannot read `guardian_contact`, drop or create tables, or change `audit_log` |
| Not checking who, what and which resource | Each request resolves the caller (token or session), the action (route and role) and the object (ownership query) before any work | Designed |
| Business-logic abuse | Whole journeys are guarded, not single calls: no upload without consent (NFR-45); no ranking without enough evidence (FR-51); results only from server-side events; claim codes and re-link codes are single use; share links only for the caller's own results; a class code pauses after 30 failures | Designed; tests specified (TC-ONB, TC-SCORE, TC-SEC-19) |
| Trusting external APIs | O*NET, SMS and email responses are schema-validated, size-capped and time-limited, with fallbacks (§5.6, API10) | Designed |
| SSRF | No user-supplied URL is ever fetched; only the jobs container calls out, to an allowlist; private IP ranges blocked; Kubernetes egress policy (§5.6, TC-SEC-16) | Designed; egress NetworkPolicy **built** and schema-validated |
| Security misconfiguration | No default accounts; the API refuses DEBUG, a weak JWT key or wildcard CORS in staging and production; docs endpoints off outside development; a missing `APP_ENV` falls back to production rules; containers non-root with read-only file systems | **Built and tested** (unit tests; containers run non-root and read-only) |
| No API inventory | `docs/api/openapi.yaml` is the contract; a test fails the build if the app serves any route not in it | **Built and tested** (`backend/api/tests/test_api_inventory.py`) |
| No rate limiting | Shared PostgreSQL counters per device, code, account, phone and IP (§3, `rate_limit` table) | Designed; table **built and tested** in the schema; middleware not built |
| No input validation | Pydantic strict models, `extra="forbid"`, length and range limits; database CHECK constraints; errors never echo input (§5.4) | Partly **built**: error handler that never echoes input; database CHECKs **tested** (invalid rankings and non-UUIDv7 IDs rejected). Request models not built |
| Exposing sensitive data | Explicit output models; nicknames only; restricted columns encrypted; generic 500 errors | Generic 500 handler **built**; the rest designed |

### 9.2 Before anyone can sign up

| Check | Rahyaab | Status |
|---|---|---|
| Protect admin routes | MFA session plus admin role; optional IP allowlist; no hidden routes (inventory test) | Designed |
| Server-side access checks | As 9.1 | Designed |
| Row-Level Security | **Not yet in the design.** Access is enforced in the API and by table grants. PostgreSQL RLS on student-linked tables (keyed by school, set per request with `SET LOCAL`) would add a second wall if an API check is ever missed | **Gap: decide in an ADR with the first dashboard API (FYP-2)** |
| Verify email | Students give no email by design. Staff accounts exist only by admin invitation, and the invite link proves the address. (Parent phone OTP is post-MVP.) | Designed |
| Hash passwords | argon2id (64 MB, 3 iterations), only for staff | Designed; library in the dependencies; not built |
| No auth tokens in local storage | App: Android Keystore via `expo-secure-store`. Dashboard: `HttpOnly` `__Host-` cookie; nothing in `localStorage` | Designed |
| Secrets only on the server | Secrets come from env variables, Docker secrets or Kubernetes secrets; `EXPO_PUBLIC_*` values hold only the API URL; each container gets only its own variables | **Built and tested** (the API container cannot see the admin database password) |
| Keep `.env` off GitHub | `.gitignore`, `git add --dry-run` check, gitleaks in CI | `.gitignore` **tested**; gitleaks written, runs after the first push |
| No secrets in logs | No personal data or credentials in logs; database URLs are not logged | Designed; current code logs none |
| Parameterised SQL | SQLAlchemy only; no string-built SQL | Designed (only static SQL exists today) |
| Validate form inputs | Client format help plus server validation (`design/specs/forms-and-errors.md`) | Designed |
| Block XSS | React and Jinja2 auto-escaping; strict CSP without inline scripts; CI fails if the dashboard build has an inline script | CSP and CI check **built**; dashboard build **tested** |
| Validate uploads | The only upload is an admin content pack: signature, size and path checks before extraction (TC-SEC-15) | Designed |
| Verify webhooks | No webhooks in the MVP. If SMS delivery receipts are added, verify their signature and timestamp before trusting them | Not applicable yet |
| Rate-limit requests | As 9.1 | Designed |
| Tighten CORS | Exact origin allowlist with credentials; no wildcard, no reflection | **Built and tested** (TC-SEC-09 as a unit test) |
| Production debug off | Settings refuse DEBUG in staging and production; docs endpoints off | **Built and tested** |
| Patch dependencies | Lockfiles, Dependabot, `pip-audit` and `pnpm audit` in CI | Configured; runs after the first push |
| Security scan | CodeQL, gitleaks and dependency review in CI; a manual security review of the new code on 9 Nov 2026 found no high-confidence vulnerability and two hardening gaps, both fixed (above) | Review **done**; CI scans run after the first push |
