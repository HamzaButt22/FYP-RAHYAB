# RFC-0004: Parent share and consent links

| | |
|---|---|
| **Status** | Accepted |
| **Author(s)** | Daniyal Sarwar (UX), Zahid Bashir (API) |
| **Reviewers** | Hamza Butt |
| **Created / decided** | 2026-11-04 / 2026-11-04 |
| **Requirements** | FR-05, FR-66–70, NFR-42, NFR-46, NFR-69 |

## Summary

Parents never install anything and never create an account. The student creates a **capability link** from inside the app, such as `https://rahyaab.pk/p/<token>`, and sends it through WhatsApp using the OS share sheet. The link opens a server-rendered report (P-01) or a consent page (P-02).

## Proposal

### Tokens

- **Token:** 128 bits of randomness, base62-encoded (22 characters). The URL carries no student data.
- **Storage:** only `sha256(token)` is stored, in `share_link.token_hash`, with:
  - `scope` (`report` or `consent`);
  - `recommendation_id` (required for `report` links, absent for `consent` links; enforced by a CHECK);
  - `expires_at` (30 days);
  - `revoked_at`;
  - a view counter.
- **Revoke:** the student can revoke at any time (S-14); the link stops working immediately.
- **Lookup:** the server hashes the presented token and looks the hash up through the unique index, so no secret is compared in application code; the response for an unknown, expired or revoked token is the same `410` page with similar timing.
- **Rate limit:** `/p/*` and `/c/*` are limited to 30 requests per minute per IP. After 20 unknown tokens from one IP within 10 minutes, that IP gets `429` with `Retry-After: 900` for 15 minutes. Limits are deliberately loose per IP, because many families share mobile-network IPs (CGNAT); with 128-bit tokens, guessing is infeasible anyway.

### Report page (P-01)

- **Rendering:** the page is built from the **stored** recommendation, never recomputed. That keeps the parent's view consistent with what the student saw.
- **Language:** Urdu first, with an English toggle. A "Listen" button uses the Web Speech API, with recorded audio as a fallback.
- **Size:** ≤ 150 KB on the first load. System fonts plus a subset of Gulzar.
- **Security headers:**
  - `noindex`;
  - `Referrer-Policy: no-referrer`;
  - a strict CSP with no inline scripts;
  - `X-Frame-Options: DENY`.

### Parents with more than one child (FR-105)

There are still no parent accounts. Each child shares their own link, and each child's consent is separate.

- **Saving a child:** when a parent opens a report, the page offers **"Save to this phone"**. If the parent accepts, the browser keeps a local list of the child's nickname and report link in `localStorage`, on that device only.
- **Switching:** the next time any saved report is opened, a **"My children"** switcher (P-01b) shows every saved child.
- **Nothing on the server links siblings.** The server never learns that two students share a parent, and the list never leaves the parent's browser.
- **Removing:** "Remove from this phone" deletes an entry. An expired or revoked link shows as "Ask for a new link" and can be removed.
- **Shared phones:** the save prompt warns that "Anyone using this phone can open saved reports" and defaults to **not saving**.

### Consent page (P-02, individual path)

1. The parent opens the consent link.
2. They read the notice in Urdu or English (with "Listen").
3. They enter their phone number, choose their relation (mother, father, guardian) and tick "I am this student's parent or legal guardian" (`POST /c/{token}/otp`).
4. They receive a 6-digit code by SMS: valid for 10 minutes, single use, at most 5 tries. At most 3 codes per link per day, 3 per phone number per day and 20 per IP per hour, which stops SMS-pumping abuse. SMS goes through a PTA-registered aggregator (COMPLIANCE.md).
5. They confirm or refuse (`POST /c/{token}/otp/verify`).
6. The system stores a `consent` record with `method=otp`, `notice_version` and a timestamp.

**What this proves, honestly:** an OTP proves control of a phone, not guardianship. The attestation, the relation, the parent's own phone and the audit trail make misuse traceable, and the school path (below) is the preferred route for the pilot. The ethics office approves this method before use (DPIA action 2).

The phone number goes into `guardian_contact`, encrypted and in a separate role. Withdrawing consent works from the same page, through a new link.

**School path (preferred for the pilot):**
1. The teacher prints numbered consent forms from D-03 (`POST /dash/classes/{id}/consent-slips`): Form A for parents of students under 18, Form C for students aged 18 or over. Each form has a serial number and a tear-off slip with a one-time **claim code**. Printing creates the slip, unrecorded.
2. The parent reads the form (Urdu and English), signs it, ticks the research box or not, and returns the form; the child keeps the slip.
3. The teacher records each signed form by its serial (`POST /dash/consent-slips/{serial}:record`) **and enters the student's age band from the admission register** (Form A: 13–15 or 16–17; Form C: 18+; any other combination is refused). The teacher's account and the time go to the audit log; the paper forms stay locked at the school (DPIA §2).
4. When the student joins, they enter the class code and the claim code. Only a recorded slip can be claimed. The server creates the `consent` row bound to the new pseudonymous profile (`method=school_form`, type `parent` or `self`, with `slip_id` and `recorded_by`) and stores the register's age band, which wins over the student's own answer (`docs/security/AGE_ASSURANCE.md`).
5. A slip can be claimed once; unclaimed slips expire after 60 days. A spot check by a second staff member (5 forms per class) is recorded in the audit log.

## Security, privacy and accessibility

- Opening a link by itself reveals only the nickname and the results the student chose to share. The student can hide task strengths before sharing.
- WhatsApp link previews show a neutral Open Graph card with no child data.
- The pages meet WCAG 2.2 AA and work at 200% zoom and 320 px width.

## Alternatives

- **A parent account with a password:** too much friction and another credential to protect.
- **Sending the report as an image:** cannot be revoked, and leaks through forwarding.

## Rollout and testing

- **R1:** report links.
- **R2:** OTP consent.
- **Tests:**
  - token-guessing rate limit;
  - expiry and revocation (T-SEC-05);
  - page weight on 3G (FR-67);
  - axe-core scan.

## Open questions

- Should a link expire sooner after its first view? The proposal is no; the family may open it several times.
