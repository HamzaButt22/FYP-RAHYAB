# Data governance: classification, retention and encryption

This document says what data Rahyaab holds, how long we keep it, how it is protected, and how it is deleted. It applies to every environment that holds real data (production, and backups of it). Staging and local environments use synthetic data only.

**Requirements:**
- NFR-38, NFR-39, NFR-44–49, NFR-72;
- FR-05, FR-09, FR-10, FR-84, FR-85.

**Related:** `SECURITY.md` (threats) and `COMPLIANCE.md` (obligations).

**Owner:** Zahid Bashir. **Reviewer:** Hamza Butt. **Review:** each milestone.

## 1. Principles

1. **Collect less.** If we don't need a field for guidance, we don't collect it.
2. **Pseudonymous by default.** Students are UUIDs plus a nickname. Identifying data (a guardian's phone number) is separated, encrypted and restricted.
3. **Keep it only as long as needed.** Every table has a retention rule, and a job enforces it.
4. **Encrypt everywhere:** on the phone, in transit, at rest and in backups.
5. **Least privilege.** Each role and database user sees only what its job needs, and access is logged.

## 2. Data classification

| Class | Meaning | Examples | Handling |
|---|---|---|---|
| **Restricted** | Identifies a person, or would cause serious harm if leaked | `guardian_contact` (phone), staff email and password hash, MFA secrets, consent records, share-link token hashes, signing keys | Encrypted column or secret store. Separate database role. Never in exports or logs. Access audited. |
| **Confidential (minor)** | Pseudonymous data about a child | Student profile, raw events, trait estimates, recommendations, notes, flags | Encrypted at rest. Tenant-scoped access. Research use only with opt-in and de-identification. |
| **Internal** | Operational, not about a person | Item parameters, model files, content packs, aggregated metrics (cells ≥ 5) | Integrity protected (signatures, MFA activation). |
| **Public** | Published on purpose | Stream and career pages, the website, the privacy policy | Reviewed before publishing. |

## 3. Retention schedule

| Data | Where | Kept for | Then | Enforced by |
|---|---|---|---|---|
| Events on the phone, before consent | Device SQLite | 14 days | Purged on the device | App job (FR-05) |
| Events on the phone, after sync | Device SQLite | 7 days after acknowledgement (for debugging) | Deleted | App sync worker |
| `raw_event` | PostgreSQL, partitioned by month | 12 months | Monthly partitions are dropped; aggregates kept (counts per item and week) | `retention` job (FR-84) |
| `quarantine` | PostgreSQL | 30 days | Deleted | `retention` job |
| `trait_estimate`, `recommendation` | PostgreSQL | While the account is active, and 12 months after the last activity | Deleted with the account | `retention` job |
| `licence` (kind, school or student, seats, dates; **no payment data**) | PostgreSQL | While the school or student account exists | Deleted with the school or student | — (ADR-0015) |
| A `student` profile that **never received consent** (nothing was ever uploaded for it) | PostgreSQL | 30 days after joining | Hard delete with its device and tokens | `jobs` worker, hourly (`purge_unconsented_students`) |
| `student` profile (nickname, class, board, group, district, **age band** and whether the school verified it, situation) | PostgreSQL | While active; deleted 12 months after the last activity, or within 30 days of a deletion request | Hard delete, cascading through the student's records | `retention` and `deletion` jobs (NFR-46) |
| `guardian_contact` | PostgreSQL (encrypted column) | Until consent is withdrawn or the account is deleted | Hard delete | `deletion` job |
| `research_demographics` (gender, medium; opt-in) | PostgreSQL, `research_ro` role only | Until the study ends, plus 1 year; deleted at once if research consent is withdrawn | Hard delete | `deletion` job |
| `password_reset` tokens | PostgreSQL (hash only) | 30 minutes, then 7 days for the audit trail | Deleted | `retention` job |
| `consent` records | PostgreSQL | Until the study ends + 1 year, or the period set by the ethics approval, whichever is shorter, as proof of consent. Only the consent fields are kept; the student link is replaced by a hash and no game data remains | Deleted | `retention` job |
| `share_link` | PostgreSQL | 30 days (expiry) + 30 days | Deleted | `retention` job |
| Staff notes and flags | PostgreSQL | Until the end of the academic year, or until the student leaves the class, whichever comes first (at most 12 months); resolved flags after 90 days | Deleted | `retention` job |
| `audit_log` | PostgreSQL (append-only) | 2 years | Deleted | `retention` job |
| Server logs (Caddy, API) | Server disk | 30 days, IPs truncated to /24, no personal data | Rotated out | logrotate |
| GlitchTip events | GlitchTip | 30 days, personal data scrubbed | Deleted | GlitchTip retention setting |
| Database backups | Off-site object store | 30 days (daily), plus 3 monthly copies | Deleted. Deletions catch up as old backups expire, so the longest delay is 90 days (stated in the privacy notice) | Storage lifecycle rule |
| Research exports | Researcher's encrypted drive | Until the FYP report is graded + 1 year, or the shorter period the ethics approval sets | Securely deleted; record kept | Research lead |
| Pilot paper consent forms | School and supervisor's locked cabinet | Per the ethics approval | Shredded | Daniyal |

**Deletion requests (FR-10, FR-70):**
1. The request comes in-app or from a parent link.
2. Tokens are revoked at once.
3. The data is hard-deleted from the live database within 30 days. Two exceptions, both disclosed in the consent forms and the privacy policy: encrypted backups expire within 90 days (a restore re-applies pending deletions before the database goes live), and the consent record (no game data) is kept as proof of consent (§3).
4. The student or parent sees a confirmation.
5. The audit log keeps a hash of the student ID, never the data.

## 4. Encryption policy

| Layer | Standard | Keys |
|---|---|---|
| **On the phone: database** | SQLCipher-enabled expo-sqlite, AES-256 | A random 256-bit key generated on first launch and stored in the **Android Keystore** via `expo-secure-store`. Never leaves the device; wiped on sign-out. |
| **On the phone: tokens** | `expo-secure-store` (Keystore-backed) | Device-bound refresh token |
| **In transit** | TLS 1.2+ (TLS 1.3 preferred) with Caddy's automatic certificates; HSTS (1 year); Android `cleartextTrafficPermitted=false`; system CAs only (ADR-0013) | Let's Encrypt, renewed automatically |
| **Server disk** | Full-disk or volume encryption (LUKS, or the provider's disk encryption) | Provider or host key |
| **Restricted columns** (`guardian_contact.phone`, `staff_user.mfa_secret`) | Application-level **AES-256-GCM** (envelope encryption) | A data key per record, wrapped by a master key. **Pilot:** the master key is a Docker secret file readable only by the API process, never an environment variable, never in a backup, and different from the backup key. **Production:** a managed KMS if the host offers one. Rotation: see §5. |
| **Passwords** | **argon2id** (memory 64 MB, 3 iterations, parallelism 1; tuned so a hash takes about 200 ms) | — |
| **Share and consent tokens** | 128-bit random tokens; only a **SHA-256** hash is stored | — |
| **Content packs** | **Ed25519** signature | Private key only in the CI secret store; the public key ships in the app |
| **Backups** | **age** encryption before leaving the server | Recipient keys held by two admins offline; the private key never sits on the server |
| **Research exports** | De-identified first, then encrypted with age | Recipient: the research lead |

**Key management rules:**
- Keys and secrets live only in the CI or EAS secret stores and in server environment files with permissions 600, owned by the service user. They are never in the repository, images or logs (gitleaks enforces this).
- Two people can recover each key; no single person holds the only copy.

**Rotation:**

| Key | When |
|---|---|
| Database passwords | Every 6 months |
| JWT signing key | Every 3 months, with overlap |
| Master data-key wrapper | Yearly, and at once if a compromise is suspected. Procedure: create the new master key (version n+1); a `rewrap` job decrypts each record's data key with key n and re-encrypts it with key n+1 (each wrapped key carries its key version, so both versions work during the job); verify a sample; then destroy key n. Rollback = keep key n until the job finishes. |
| All keys | At once if a breach is suspected |

## 5. Access control

| Role | Can access | Cannot |
|---|---|---|
| Student | Own profile, results, links and exports | Anyone else's data |
| Parent (link) | The one shared report, or the consent page | Raw events; other children |
| Teacher / counsellor | Consented students in their own classes; aggregates with cells ≥ 5 | Other schools; raw events; guardian contacts |
| Admin | Configuration, content and models; audit log; support tasks with a ticket reference | Browsing student data without a reason (every read is audited) |
| Researcher | De-identified, opted-in exports | Identifiers; live student records |
| Database roles | `api_rw` (application tables), `jobs` (retention and rescore), `research_ro` (views over de-identified data), `guardian_rw` (the only role for `guardian_contact`) | No superuser at run time |

## 6. Data inventory (for the Play Data safety form and T-PRIV-01)

| Data type (Play category) | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| App activity (in-app choices and task results) | Yes | No | App functionality (guidance) | No, it is required for the result |
| App info and performance (crash logs, diagnostics) | Yes, self-hosted | No | App functionality, stability | No |
| Personal info (name, email, phone, address) | **No** from students. Parent phone only on the individual path | No | Consent (OTP) | Individual path only |
| Location, contacts, photos and videos, audio, files, calendar | **No** | — | — | — |
| Device or other IDs | **Yes:** an app-generated installation ID and a Keystore public key per profile (no advertising ID, Android ID, IMEI or model name) | No | App functionality and account security (device-bound sign-in) | No |

Data is encrypted in transit, and users can request deletion.

## 7. Breach handling

Follow `SECURITY.md` §7:
1. Contain.
2. Assess: what data, whose, and how much.
3. Notify the schools and parents within **72 hours**, in Urdu and English (NFR-49). The team has no parent contacts on the school path, so it sends each school's coordinating teacher a ready-to-forward message (Urdu and English) and records the school's acknowledgement; on the individual path the parent gets an SMS.
4. Write a post-incident note.

Keep a breach register (date, scope, actions), even for near misses.
