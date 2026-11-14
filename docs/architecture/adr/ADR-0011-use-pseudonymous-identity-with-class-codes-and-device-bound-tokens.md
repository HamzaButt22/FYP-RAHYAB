# ADR-0011: Use pseudonymous identity with class codes and device-bound tokens

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS FR-03–08, NFR-44 |

## Context

We must not collect names, phone numbers, emails, CNIC/B-form numbers or photos from students. Students still need to resume on the same phone and be linked to a class for their teachers.

## Decision

- **Joining:** a student joins with a **class code** (or, on the individual path, a parent OTP) and picks a nickname.
- **Tokens:** the server issues a **UUID student ID** and a device-bound token pair: a 15-minute access JWT and a rotating refresh token. If a refresh token is reused, the whole token family is revoked.
- **Device binding:** at join, the app creates a key pair in the Android Keystore (non-exportable) and sends the public key. Every refresh request is signed with that key, so a refresh token copied to another device is useless.
- **Key and signature format (added 10 Nov 2026 with the refresh endpoint):** an EC P-256 key, because the Android Keystore offers Ed25519 only from Android 13. The app sends the public key as base64 DER (SubjectPublicKeyInfo) and signs `rahyaab-refresh-v1:` + refresh token with SHA256withECDSA. A signature from another key revokes the token family (TC-SEC-18).
- **Refresh lifetime and retries (added 11 Nov 2026):** a refresh token lasts **90 days** from the last refresh, which covers the summer vacation. If a phone loses the response to a refresh, it may retry with the old token, signed by the same key, within **2 minutes** and only while nothing newer in the family has been used; it then gets a fresh pair and the undelivered pair is revoked. Any other second use revokes the family.
- **App implementation (added 14 Nov 2026):** the key lives in our own Expo module, `frontend/mobile/modules/device-key` (Kotlin, about 140 lines), not a third-party package: the code that holds a minor's device key stays small and reviewable, and the format matches `device_keys.py` exactly. Key alias `rahyaab.device.v1`; StrongBox when the phone has it, otherwise the TEE; no user authentication (refreshes run in the background). JavaScript can read the public key and ask for a refresh signature only; the module adds the context prefix itself. Uninstalling the app deletes the key, so the student re-joins and the teacher's re-link code (FR-12) brings the old profile back.
- **Age:** a self-declared age never grants consent; the school's recorded age band does (`docs/security/AGE_ASSURANCE.md`).
- **Shared phones:** a 4-digit PIN per profile, required as soon as a second profile is added to the phone (FR-07). Failed tries are counted in the encrypted database, so restarting the app does not reset them; after 10 failures the profile can only be reopened with a teacher re-link code or a parent OTP.
- **Staff:** sign in with email, an argon2id password and TOTP MFA.

## Consequences

- **Good:** little data to leak, and a simple consent story.
- **Cost:** a lost phone means the profile must be re-linked to the new phone with a teacher-issued re-link code (FR-12). On the individual path, the parent's OTP does the same.

## Alternatives considered

- **Google Sign-In:** exposes the student's email and makes Google a data processor.
- **Phone-number login for students:** rejected under NFR-44.
