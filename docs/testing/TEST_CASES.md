# Test cases and acceptance criteria

The concrete cases for the strategy in [`TEST_STRATEGY.md`](TEST_STRATEGY.md).

**Case IDs:**
- **TC-<area>-NN** is a case. Each one names the requirement it proves and the SRS test level it belongs to (T-UNIT, T-INT and so on).
- Automated tests carry the case ID in their name, for example `test_tc_sync_03_duplicate_batch`. That way CI results trace back to this file.

**Columns:**
- **Type:** A = automated, M = manual.
- **P (priority):** 1 = must pass for the release, 2 = should, 3 = nice to have.

## 1. Acceptance criteria for the R1 stories (Gherkin)

```gherkin
Feature: Join and consent (US-02, FR-03–06, NFR-45)
  Scenario: Valid class code, consent already recorded by the school
    Given a class "9-B" with code "RYB-4K2" and roster consent recorded
    When a student enters "RYB-4K2", class 9, birth year 2011 and the nickname "Ayesha_10"
    Then a profile is created with no name, phone or email fields
    And the consent state is "granted"
    And the prologue starts

  Scenario: Consent pending
    Given a valid code without recorded consent
    When the student finishes onboarding
    Then Hudhud says "Waiting for your family's OK"
    And play is saved only on the phone
    And no event is sent to the server
    And local events are purged after 14 days without consent

Feature: Play offline without losing anything (US-10, FR-35, FR-36, NFR-31)
  Scenario: A full week in airplane mode
    Given airplane mode is on
    When the student plays Week 1 to the Sunday diary
    And the app is force-closed 5 times at random moments
    Then on relaunch the story resumes at the last choice
    And when the phone goes online every event is accepted exactly once

Feature: Results with reasons (US-11–14, FR-45, FR-46, FR-56)
  Scenario: Blueprint after Week 4
    Given Week 4 is complete and the evidence rule is met
    When the student opens the letter
    Then exactly 3 paths are shown, each with a fit band, 2–3 reasons, doors and at least one Plan B
    And "Why this?" lists the choices, tasks and rules behind the first path
    And the disclaimer "a starting point, not a verdict" is shown

  Scenario: Not enough evidence
    Given pair coverage is below 80%
    When the student asks for results
    Then the app says that one more week is needed, and shows no ranking

Feature: Share with family (US-15, US-16, FR-66, FR-67)
  Scenario: Create and revoke a link
    Given a stored recommendation
    When the student creates a family link and sends it on WhatsApp
    Then the parent sees the Urdu report in 3 s or less on 3G
    And when the student revokes the link, the page returns "410 Gone"

Feature: Is your group right for you? (FR-99)
  Scenario: A better fit is behind a closed door
    Given a class 9 student in Science (Computer) with medium confidence
    And Pre-Medical out-fits every open path by at least delta_route
    When the Blueprint opens
    Then "Stay and do well where you are" and the top open paths are shown first
    And a card lists the routes to Pre-Medical, each with its cost, rule source and date
    And "Talk to your family" and "Ask your teacher" are offered

Feature: Guided field help (FR-102, NFR-74)
  Scenario: Wrong class code format
    Given the join screen
    When the student types "RYB-4K" and leaves the field
    Then the field says "Codes have 6 letters and numbers, like RYB-4K2."
    And the message can be read aloud
  Scenario: Unknown code
    When a well-formed code that does not exist is submitted
    Then the student sees the same message as for an expired code, with help to fix it

Feature: Read aloud (FR-96)
  Scenario: Urdu voice missing
    Given Urdu mode and no Urdu text-to-speech voice on the phone
    When the student taps the speaker on a scene line
    Then the recorded clip plays, or a one-time hint explains how to install the voice
    And no audio or text is sent to any server
```

## 2. Test cases

### 2.1 Onboarding, identity and consent

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-ONB-01 | Language choice persists | Choose اردو at S-01 → restart app | All screens in Urdu, RTL mirrored | FR-01, NFR-27 | T-E2E | A | 1 |
| TC-ONB-02 | No identifying fields | Inspect S-03 to S-06 and the join request body | No name, phone, email or photo fields; request matches `JoinRequest` | NFR-44 | T-PRIV | A | 1 |
| TC-ONB-03 | Invalid class code | Enter `RYB-XXX` | Plain error with a fix; no profile created | FR-03 | T-INT | A | 1 |
| TC-ONB-04 | Join rate limits | (a) 11 joins in 15 min with the same device public key; (b) 30 wrong claim codes in an hour against one class, from many devices; (c) 40 devices joining one valid code from one IP | (a) 11th → `429` with `Retry-After`; (b) claim codes for that class pause for the hour (generic `404`, teacher notified through the audit log) while joins **without** a claim code still work, so one student cannot block a class; (c) all 40 succeed (the per-IP ceiling is 300) | NFR-40, NFR-67 | T-INT | A | 1 |
| TC-ONB-05 | Age gate | Class 7; a birth month and year giving age 12 years 11 months today; the same input one month later | Neutral stop screen and nothing stored for the first two; the third joins. No fixed year limit in the code | FR-04 | T-UNIT | A | 1 |
| TC-ONB-06 | Consent gate on upload | Pending consent → `POST /events:batch` | `403 consent_required`; 0 rows stored | NFR-45 | T-INT-01 | A | 1 |
| TC-ONB-07 | Purge without consent | Pending consent; move the clock forward 15 days | Local events deleted | FR-05 | T-UNIT | A | 1 |
| TC-ONB-08 | Profiles on a shared phone | Create profiles A and B with PINs; switch | Each profile sees only its own data | FR-07 | T-E2E | A | 1 |
| TC-ONB-09 | Re-link to a new phone | Teacher issues a re-link code → use it on phone 2 | Profile restored; tokens on phone 1 revoked | FR-12 | T-INT | A | 2 |
| TC-ONB-10 | Refresh token reuse | Use an old refresh token again (a) after its replacement has been used, or (b) more than 2 minutes after it was used | `401`; the whole token family revoked | ADR-0011 | T-INT | A | 1 |
| TC-ONB-11 | Lost refresh response | Refresh, drop the response, retry at once with the same token and the same device key | `200` with a new pair; the undelivered pair is revoked; the phone carries on (no re-link) | ADR-0011 | T-INT | A | 1 |

### 2.2 Game loop and tasks

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-GAME-01 | Planner picks | Open the Week 1 planner | 6 options in random positions; exactly 3 can be locked; `plan_committed` logged | FR-18 | T-UNIT | A | 1 |
| TC-GAME-02 | Pair coverage | Run golden playthroughs of all 4 weeks | Each pair ≥ 2, each type ≥ 10 (`pairs.json`) | FR-19, FR-20 | T-PAR-02 | A | 1 |
| TC-GAME-03 | No timer, no wrong feedback | Inspect every task screen | No countdown, no "wrong", no score | FR-17 | T-CONT | M | 1 |
| TC-GAME-04 | Staircase | Answer level-2 items correctly twice | Next item is level 3; levels stay within 1–4 | FR-28 | T-UNIT | A | 1 |
| TC-GAME-05 | First attempt only | Replay a task | Replay tagged `practice`; score unchanged | FR-27 | T-UNIT | A | 1 |
| TC-GAME-06 | Ask a friend | Tap "Ask a friend to help" | Item recorded as missing, not wrong | FR-27, FR-98 | T-UNIT | A | 1 |
| TC-GAME-07 | Calibration block | Start the first task of a sitting | 7 valid intervals stored, or the `calibrated=false` flag | FR-21 | T-UNIT | A | 2 |
| TC-GAME-08 | Planning task parity | Same seed in TS and `power_grid.py` | Identical puzzles and outcomes | FR-26 | T-PAR-01 | A | 1 |
| TC-GAME-09 | Letter readability | Mean SE moves 0.60 → 0.45 → 0.55 | Readable share goes 0.62 → 0.85 → 0.69, and can go down | FR-94 | T-UNIT | A | 1 |
| TC-GAME-10 | Break nudge | Play for 20 minutes without stopping | Break suggestion shown once | NFR-63 | T-E2E | A | 2 |
| TC-GAME-11 | Value moment | Play the value moment | `value_choice` logged; no effect on the top-1 ranking in golden tests | FR-92 | T-UNIT | A | 2 |

### 2.3 Telemetry and sync (RFC-0002)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-SYNC-01 | Commit before advancing | Kill the app right after a choice | On relaunch the event is in the outbox and the story resumes after that choice | FR-35 | T-REL | A | 1 |
| TC-SYNC-02 | Batch upload | 750 queued events, go online | Two batches (500 + 250); all acknowledged | FR-36 | T-INT-02 | A | 1 |
| TC-SYNC-03 | Duplicate batch | Send the same batch twice | 2nd response lists every event as `duplicates`; 0 new rows | NFR-35 | T-INT-03 | A | 1 |
| TC-SYNC-04 | Schema reject | An event with an unknown field | That event in `rejected` (`schema`) and in quarantine; others accepted | FR-39 | T-INT | A | 1 |
| TC-SYNC-05 | Monotonic time | `monotonic_ms` goes backwards within a run | Rejected `monotonic` | FR-39 | T-INT | A | 1 |
| TC-SYNC-06 | Gzip bomb | 1 MB gzip that expands to 100 MB | `413`; the server stays healthy | NFR-67 | T-SEC | A | 1 |
| TC-SYNC-07 | Fault campaign | 100 kills / airplane toggles / low-storage runs | 0 events lost | NFR-31 | T-REL-01 | A | 1 |

### 2.4 Scoring and results (RFC-0003)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-SCORE-01 | Reproducible | Compute twice with the same versions | Same `input_hash`, bit-identical result | FR-40, FR-47 | T-PAR-04 | A | 1 |
| TC-SCORE-02 | TS vs Python baseline | 200 golden profiles | Same top-3 and bands | FR-49 | T-PAR-03 | A | 1 |
| TC-SCORE-03 | Gender excluded | Flip gender in the audit dataset | Recommendation unchanged | FR-48 | T-FAIR-02 | A | 1 |
| TC-SCORE-04 | Eligibility gate | Matric group without Biology → Pre-Medical | Door shown as closed with its rule source; not ranked as open | FR-45 | T-UNIT | A | 1 |
| TC-SCORE-05 | Insufficient evidence | Coverage 70% | `409 insufficient_evidence` | FR-51 | T-INT | A | 1 |
| TC-SCORE-06 | Low confidence | Interest SE 0.6 | Confidence "low" with an "ask an adult" prompt | NFR-60 | T-UNIT | A | 1 |
| TC-SCORE-07 | Unmeasured tasks | Spatial not measured (TalkBack) | Weights renormalised; Blueprint says "We used your choices more than tasks" | FR-98 | T-UNIT | A | 1 |
| TC-SCORE-08 | Compute latency | 100 synchronous `POST /results/compute` calls on staging, each for a new `input_hash` (no cached result) | p95 ≤ 2 s from request to response, which is sent after the result is stored. (TC-PERF-03's 800 ms target covers `GET /results/latest` and batches, not compute.) | NFR-10 | T-PERF-03 | A | 2 |
| TC-SCORE-10 | Degenerate inputs | A run where every task attempt failed; one with 0 completed tasks; one with no reactions; one with all choices on one side; property test with random empty, NaN, negative and out-of-range values | No NaN, Infinity or crash anywhere; an empty family is "not measured", never the best or worst score; quality flag set where expected (lessons from the prototype review, `docs/project/REVIEW_LOG.md` pack 09) | FR-40–43 | T-UNIT | A | 1 |
| TC-SCORE-09 | Model activation rule | Activate a ranker without an evaluation report | `409`; still inactive | FR-82 | T-INT | A | 1 |

### 2.5 Sharing and parent pages (RFC-0004)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-SHARE-01 | Token strength and storage | Create a link; inspect the database | Token is 22 base62 characters; only a SHA-256 hash is stored | FR-66 | T-SEC | A | 1 |
| TC-SHARE-02 | Expiry and revoke | Revoke, or move the clock forward 31 days | `410 Gone` | FR-66 | T-SEC-05 | A | 1 |
| TC-SHARE-03 | Guessing | 1,000 random tokens from one IP | Rate limited after 30 per minute; 0 hits | NFR-67 | T-SEC | A | 1 |
| TC-SHARE-04 | Page weight | Load P-01 on 3G throttling | ≤ 150 KB; usable in ≤ 3 s | FR-67 | T-PERF | A | 1 |
| TC-SHARE-05 | Headers | Fetch P-01 | `noindex`, strict CSP, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store` | NFR-69 | T-SEC | A | 1 |
| TC-SHARE-06 | Stored result only | Change the model version, then open an old link | Shows the stored result; no recomputation | RFC-0004 | T-INT | A | 2 |
| TC-SHARE-07 | Neutral preview | Paste the link in WhatsApp | Open Graph preview has no child data | RFC-0004 | T-PRIV | M | 1 |
| TC-SHARE-08 | Several children on one parent phone | Open two children's links; choose "Save to this phone" on both; capture traffic with mitmproxy as in TC-PRIV-01 | P-01b switcher lists both; no request body, URL or header carries another child's token, nickname or id (each request carries only its own link's token); "Remove" deletes the entry; default is not to save | FR-105 | T-PRIV | A | 2 |

### 2.6 Dashboard and admin

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-DASH-01 | Staff MFA | Log in with the right password and a wrong TOTP | `401`; lockout with backoff after 5 tries | FR-71, NFR-40 | T-INT | A | 1 |
| TC-DASH-02 | Own classes only | Teacher A requests a class of teacher B | `404` | FR-78, NFR-42 | T-SEC-05 | A | 1 |
| TC-DASH-03 | Consented students only | Roster with one non-consented student | That student not listed | FR-78 | T-INT | A | 1 |
| TC-DASH-04 | Small-cell suppression | Class distribution with one band of 3 students | Rule (FR-75, k = 5): any cell with 1–4 students shows "< 5"; if exactly one cell in a row or column is hidden, the next-smallest cell is hidden too, so it cannot be worked out from the total; totals are shown only when ≥ 5 | FR-75 | T-UNIT | A | 1 |
| TC-DASH-05 | CSV export | Export the roster | UTF-8 BOM; no guardian contact; audit entry written | FR-77, FR-83 | T-INT | A | 1 |
| TC-DASH-06 | CSRF | POST a note without `X-CSRF-Token` | `403` | NFR-69 | T-SEC | A | 1 |
| TC-ADM-01 | Content pack signature | Upload a pack with a bad signature | `422`; not activated | RFC-0001 | T-INT | A | 1 |
| TC-ADM-02 | Mid-week pack change | Activate a new pack while a student is mid-week | The week finishes on the old pack | RFC-0001 | T-E2E | A | 2 |

### 2.7 Security and privacy

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-SEC-01 | MASVS L1 + PRIVACY | Run the MASTG checklist on the release APK | All applicable controls pass, or an exception is documented | NFR-36 | T-SEC-01 | M | 1 |
| TC-SEC-02 | ZAP authenticated scan | Scan staging | 0 high | NFR-37 | T-SEC-02 | A | 1 |
| TC-SEC-03 | Secrets | gitleaks over the full history | 0 findings | NFR-71 | T-SEC-03 | A | 1 |
| TC-SEC-04 | Backdoor sweep | Search the release build and routes for test logins, debug flags and dev menus; diff OpenAPI routes against the authorisation matrix | 0 found; every route mapped | NFR-66 | T-SEC | A+M | 1 |
| TC-SEC-05 | Authorisation matrix | Run every route × role (§3) | Matches the matrix exactly | NFR-42 | T-SEC-05 | A | 1 |
| TC-SEC-06 | Local storage | Pull the app's data directory on a rooted test phone | Database unreadable without the key; no tokens in plain files; `allowBackup=false` | NFR-39, NFR-72 | T-SEC-01 | M | 1 |
| TC-SEC-07 | Screen capture | Screenshot the Blueprint and Share screens | Blocked (`FLAG_SECURE`); app-switcher preview blank | NFR-72 | T-SEC | M | 1 |
| TC-SEC-08 | Cleartext | Point the app at an `http://` host | Connection refused | NFR-38 | T-SEC | A | 1 |
| TC-SEC-09 | CORS allowlist | Send a preflight and a request with `Origin: https://evil.example`, `null`, a dashboard subdomain, and the real dashboard origin | Only the exact dashboard origin gets `Access-Control-Allow-Origin` (never `*`, never reflected); credentials only for it; no CORS headers on `/p/*` | NFR-77 | T-SEC | A | 1 |
| TC-SEC-10 | Reset request is enumeration-safe | Request a reset for an existing and a non-existing email | Same 202 response and message; timing within ±50 ms; 4th request in an hour → 429 | FR-106, NFR-74 | T-SEC | A | 1 |
| TC-SEC-11 | Reset token rules | Use a token twice; use one after 31 min; reset successfully | 2nd use and expired token → the same generic 400; success revokes all sessions and other tokens; next login still asks for MFA; audit entry and notice email | FR-106 | T-INT | A | 1 |
| TC-SEC-12 | SQL injection (automated gate) | Schemathesis sends `' OR 1=1--`, `; DROP TABLE` and time-based payloads in every string and query parameter on staging. (A manual sqlmap run is part of the pentest, TC-SEC-01 style, with a signed note) | All rejected with `422` or stored as plain text; no SQL errors, delays or extra rows; tables intact | NFR-37 | T-SEC | A | 1 |
| TC-SEC-13 | Stored and reflected XSS | Save a teacher note and a nickname containing `<script>`, `<img onerror>` and `javascript:` URLs; open the dashboard and the parent page | Shown as plain text; nothing runs; no CSP violations | NFR-37, NFR-69 | T-SEC | A | 1 |
| TC-SEC-14 | Mass assignment | `PATCH` own profile with extra fields `role`, `school_id`, `consent_state`, `id` | `422` (unknown fields rejected); nothing changes in the database | NFR-42 | T-SEC-05 | A | 1 |
| TC-SEC-15 | Content-pack integrity | Install packs that are unsigned, wrongly signed, contain `../` paths (zip-slip), or expand past the size cap (zip bomb) | All refused before extraction; the current pack stays active; event logged | NFR-37 | T-SEC | A | 1 |
| TC-SEC-16 | SSRF and egress | From the jobs container, try to reach a private IP, `169.254.169.254`, a redirecting URL and a non-allowlisted host | All blocked by the egress allowlist and the resolved-IP check; nothing fetched; audit entry | NFR-37 | T-SEC | A | 1 |
| TC-SEC-17 | Session cookie | Log in to the dashboard on staging; inspect `Set-Cookie`; reuse the cookie after logout and after 31 idle minutes | `__Host-` prefix, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`; a new session id after MFA; both reuses → 401 | NFR-40, NFR-69 | T-SEC | A | 1 |
| TC-SEC-18 | Device-bound refresh | Copy a refresh token to a second emulator and refresh with a different key | `401`; the token family is revoked; the first device must re-link | NFR-39 | T-SEC | A | 1 |
| TC-SEC-19 | Consent claim codes | Claim a slip twice; claim a printed but unrecorded slip; claim after 60 days; claim another class's slip | Second claim, unrecorded and expired slips → the same generic error; no consent created; audit shows who recorded each slip | FR-05 | T-INT | A | 1 |
| TC-PRIV-01 | Data inventory | mitmproxy trace of a full week on a test phone | Only the documented fields leave the phone, and only to our API | NFR-44, NFR-47 | T-PRIV-01 | M | 1 |
| TC-PRIV-02 | Export de-identification | Run the research export | No UUIDs that can be linked back, no nicknames, no free text; k-anonymity check ≥ 5 on quasi-identifiers | FR-85 | T-PRIV-02 | A | 1 |
| TC-PRIV-03 | Retention and deletion | Delete-my-data; run the jobs with the clock moved forward | All of the student's rows gone within 30 days; aggregates kept | NFR-46 | T-PRIV-03 | A | 1 |

### 2.8 Accessibility and localisation

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-A11Y-01 | TalkBack walkthrough | Onboarding → a week → Blueprint → share, in EN and UR | Every control is announced with role and state; focus order follows reading order | NFR-25 | T-A11Y | M | 1 |
| TC-A11Y-02 | Switch Access | The same flow with two-switch scanning | Completed with no drag | NFR-65, FR-98 | T-A11Y | M | 1 |
| TC-A11Y-03 | 200% font | System font at 200% | No clipped text; Nastaliq not cut | NFR-22 | T-A11Y | A | 1 |
| TC-A11Y-04 | High contrast | Turn on high contrast | All text ≥ 7:1; borders and focus ≥ 3:1 | NFR-64 | T-A11Y | A | 1 |
| TC-A11Y-05 | Read aloud | Tap the speaker on a scene line, the letter and a task instruction | Reads in the right language; highlights the sentence; a second tap stops it | FR-96 | T-A11Y | M | 1 |
| TC-A11Y-06 | Not colour alone | Greyscale screenshots of the Blueprint and the scene | Dil and Duniya, bands and doors are still distinguishable | NFR-24 | T-A11Y | A | 1 |
| TC-A11Y-07 | Parent page | axe-core on P-01; 320 px wide; 200% zoom | 0 serious or critical; no horizontal scroll | NFR-22 | T-A11Y | A | 1 |
| TC-L10N-01 | Key completeness | i18n lint | 100% of keys in `en`, `ur`, `roman` | NFR-27 | T-L10N | A | 1 |
| TC-L10N-02 | RTL layout | Screenshot diff of every screen in `ur` | Mirrored correctly; numbers and Latin text isolated | NFR-27 | T-L10N | A | 2 |

### 2.9 Performance and devices

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-PERF-01 | Cold start | 20 cold starts on the RLD (`adb shell am start -W`) | TTID p90 ≤ 3 s; TTFD ≤ 5 s | NFR-04 | T-PERF-01 | A | 1 |
| TC-PERF-02 | Frames in tasks | Flashlight during the spatial task | ≥ 95% of frames on time | NFR-06 | T-PERF-02 | A | 1 |
| TC-PERF-03 | API load | Locust profile `peak_250`: 250 simulated app sessions (one virtual user = one session, think time 3 min between scene batches) on staging with 5,000 seeded students | `/events:batch` and `GET /results/latest` p95 ≤ 800 ms, p99 ≤ 2 s; compute per TC-SCORE-08; errors < 0.5%; CPU < 70% | NFR-09, NFR-57 | T-PERF-03 | A | 2 |
| TC-PERF-04 | Download size | Play AAB size report | ≤ 35 MB | NFR-11 | T-PERF | A | 1 |
| TC-DEV-01 | Device matrix | Smoke test on every T-DEV device, in light and dark | Pass | NFR-14–18 | T-DEV | M | 1 |

### 2.10 Operations

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-OPS-01 | Restore drill | Restore last night's encrypted backup to a clean VM | API passes smoke tests; RPO ≤ 24 h; RTO ≤ 4 h | NFR-34, NFR-58 | T-REL | M | 1 |
| TC-OPS-02 | Rollback | Deploy a broken image to staging | The health check fails and the previous image is restored automatically | `CI_CD.md` §4 | T-REL | A | 2 |

### 2.11 Edge cases and exceptions (`docs/project/EDGE_CASES.md`)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-EDGE-01 | Class 9 early, good fit | Class 9 in Science-Computer; fit is strong | Group fit "good"; no route card shown automatically; "See other routes" available | FR-99 | T-UNIT | A | 1 |
| TC-EDGE-02 | Class 9, best path behind a closed door | Class 9 Computer; Pre-Medical out-fits the best open path by ≥ δ_route; medium confidence; inside the switch window | The route card shows: switch now (window open), re-take class 9, and the alternative route. Each has a cost, a source and a date. "Stay and do well" is shown first | FR-99 | T-UNIT | A | 1 |
| TC-EDGE-03 | Anti-push rule | Same as TC-EDGE-02 with **low** confidence | Routes hidden behind "See other routes"; no automatic card | FR-99 | T-UNIT | A | 1 |
| TC-EDGE-04 | Window closed | Class 10 Computer; Pre-Medical fits best | No "switch now" option. Routes: re-take class 9, additional subject (where the board allows), alternatives | FR-99 | T-UNIT | A | 1 |
| TC-EDGE-05 | Teacher flag | TC-EDGE-02 with teacher visibility consented | A `route_question` flag appears on the roster; no free text | FR-99 | T-INT | A | 2 |
| TC-EDGE-06 | Under 13 | Birth year making the student 12 | Neutral stop screen; nothing stored, nothing sent | FR-04, FR-100 | T-E2E | A | 1 |
| TC-EDGE-07 | Adult self-consent | Age 19, class 12, with a Form C slip recorded by the school as 18–19 | No parent-consent wait; a consent record of type `self` (method `school_form`); family sharing optional | FR-100 | T-INT | A | 1 |
| TC-AGE-01 | Self-declared adult | Class 10 student enters a 2000 birth year, no claim code | Joins with consent `pending`; band stored as provisional (`age_verified = false`); no consent row; nothing uploads | FR-100 | T-INT | A | 1 |
| TC-AGE-02 | Recorded adult form | Form C recorded with 18–19 from the register | Consent `self`, band 18–19, verified | FR-100 | T-INT | A | 1 |
| TC-AGE-03 | Register wins | Form A recorded as 16–17; student claims to be 26 | Parent consent (not self); band 16–17; `age_mismatch` flag with both bands | FR-100 | T-INT | A | 1 |
| TC-AGE-04 | Form and age must match | Record Form C with 16–17, or Form A with 18–19 | Refused by the database (`consent_slip_kind_band_check`) | FR-100 | T-INT | A | 1 |
| TC-LIC-01 | No active licence | School without a licence, then an expired one, then an active one | `403 school_access_inactive` twice, then `201` | FR-107 | T-INT | A | 1 |
| TC-LIC-02 | Seats | Institution licence with 2 seats; 3 joins without claim codes, then 3 with recorded slips | All 3 plain joins succeed (no seat used); slip joins 201, 201, then `403`; 2 consents in total | FR-107 | T-INT | A | 1 |
| TC-CON-01 | Claim later | Join without a slip (claims to be 26); a Form A recorded as 16–17 comes back; claim it | `200 granted`; band 16–17, verified; `age_mismatch` flag | FR-05a, FR-100 | T-INT | A | 1 |
| TC-CON-02 | Already consented | A consented student claims a second slip | `200 granted`; the second slip is not used up | FR-05a | T-INT | A | 1 |
| TC-CON-03 | Bad claims after joining | Unknown, unrecorded and another class's claim codes | The same generic `404` each time | FR-05a, NFR-74 | T-INT | A | 1 |
| TC-CON-04 | Claim needs a valid token | No token, a garbage token, a deleted student's token | `401` each time | ADR-0011 | T-INT | A | 1 |
| TC-SCORE-11 | No clear interests | A student with all six interest scores equal | No interest term in any path's fit; the app shows "no clear interest pattern yet" | FR-51 | T-UNIT | A | 1 |
| TC-SCORE-12 | Shape, not level | Raise every interest score by the same amount | The interest match does not change; an artistic-social profile ranks FA Humanities first, a realistic one ranks technical paths first | FR-44 | T-UNIT | A | 1 |
| TC-LIC-03 | Store purchase (post-MVP) | Valid, forged and refunded store purchase tokens | Only the valid one creates an `individual` licence; a refund ends it | FR-108 | T-INT | C | post-MVP |
| TC-EDGE-08 | Over-age learner | Age 22, class 9 | Allowed; older-learner routes shown (private candidate, open schooling, technical); age stored as a band only | FR-100, FR-104 | T-UNIT | A | 1 |
| TC-EDGE-09 | Unusual combination check | Class 9 with birth year 1999 | Soft question "Is that right?"; both answers work; no error | FR-100 | T-E2E | A | 2 |
| TC-EDGE-10 | Promotion | Class 8 student with a result; class check-in changes to class 9 | Mode becomes `inter`; re-ranked without replaying (estimates < 12 months old); old result kept as history | FR-101 | T-INT | A | 1 |
| TC-EDGE-11 | Repeating a class | Situation "repeating class 9" | Mode `inter`; repeat noted; no penalty in scoring | FR-101, FR-104 | T-UNIT | A | 2 |
| TC-EDGE-12 | Family refuses consent | Consent refused | Explore works offline; nothing uploads; local play purged after 14 days; no repeated prompts | FR-05 | T-E2E | A | 1 |

### 2.12 Guided validation and help (`design/specs/forms-and-errors.md`)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-VAL-01 | Code auto-format | Type `ryb4k2` | Shows `RYB-4K2`; no error | FR-102 | T-UNIT | A | 1 |
| TC-VAL-02 | Code format error | Type `RYB-4K` and leave the field | "Codes have 6 letters and numbers, like RYB-4K2." (EN and UR); focus stays; a speaker button reads it | FR-102, NFR-73 | T-E2E | A | 1 |
| TC-VAL-03 | Code rejected by the server | Use a well-formed but unknown code | Generic "That code didn't work…" with help; the **same** status, message and timing as an expired code (±50 ms) | NFR-74 | T-SEC | A | 1 |
| TC-VAL-04 | Nickname is a real full name | Enter "Ayesha Khan" (and "Ayesha" alone) | "Ayesha Khan" is refused by the app and the server (`full_name`) with the hint "like Ayesha_10"; "Ayesha" alone is accepted | FR-102 | T-UNIT | A | 2 |
| TC-VAL-05 | Nickname with a phone number or email | "ali03001234567" or "a@b.com" | Blocked with "Please don't add a phone number or email" | FR-102, NFR-44 | T-UNIT | A | 1 |
| TC-VAL-06 | Bidi and zero-width characters | Nickname containing U+202E or U+200B | Characters stripped; the stored value is clean; the teacher view shows it correctly | NFR-74 | T-SEC | A | 1 |
| TC-VAL-07 | Server field errors | POST join with 3 bad fields (bypassing the client) | `422` problem+json with `errors[]`: 3 entries `{field, code, message_key}`; no input echoed | FR-102 | T-INT | A | 1 |
| TC-VAL-08 | Help after repeated failure | Fail the code twice | A help card offers "Ask your teacher" and "Join without a code" | FR-103 | T-E2E | A | 2 |
| TC-VAL-09 | Rate-limit message | 6 failed joins | "Try again in N minutes" with a countdown; no other details | NFR-74 | T-INT | A | 1 |
| TC-VAL-10 | Message quality audit | Script over all message keys | 100% follow problem + fix + example; Grade 6 or lower (EN); Urdu present for every key | NFR-73 | T-L10N | A | 1 |

### 2.13 Performance, resilience and robustness (`TEST_STRATEGY.md` §3.1)

| ID | Title | Steps | Expected | Req | Level | Type | P |
|---|---|---|---|---|---|---|---|
| TC-PERF-05 | Spike | 0 → 300 joins + batches in 60 s | Join success ≥ 99% after retries; p95 ≤ 3 s; no 5xx storm | NFR-57, NFR-75 | T-PERF | A | 1 |
| TC-PERF-06 | Soak | `peak_250` load for 8 h | Memory growth ≤ 10% per worker; p95 in the last hour within 10% of the first hour (5-minute windows); database connections stable | NFR-75 | T-PERF | A | 1 |
| TC-PERF-07 | Break-point | +25 virtual users every 5 min until failure | Break point ≥ 3× pilot peak; graceful 429/503; no corruption; report filed | NFR-75 | T-PERF | A | 1 |
| TC-PERF-08 | Volume | 20 million events, 5,000 students | Roster p95 ≤ 500 ms; rescore ≤ 1 h; partition drop ≤ 1 min | NFR-57 | T-PERF | A | 2 |
| TC-PERF-09 | Client endurance | Bot plays all 4 weeks without a restart | PSS ≤ 300 MB; frames within NFR-06; no crash | NFR-06, NFR-07 | T-PERF | A | 1 |
| TC-PERF-10 | Mutation score | mutmut on scoring | ≥ 70% killed | NFR-50 | T-UNIT | A | 3 |
| TC-MONKEY-01 | Monkey, nightly | `adb shell monkey -s <seed> --throttle 50 -v 10000` | 0 crashes or ANRs | NFR-30 | T-REL | A | 1 |
| TC-MONKEY-02 | Monkey, release | 50,000 events × 3 seeds, run twice: once with the app's language pre-set to EN and once to UR (set through a debug-only intent before the run, since monkey cannot choose it); device, API level, build hash and seed recorded per run | 0 crashes or ANRs; 0 event loss | NFR-30, NFR-31 | T-REL | A | 1 |
| TC-MONKEY-03 | Random taps in tasks | Maestro random-tap flow inside each task | Task still completes or exits cleanly; no stuck state | NFR-30 | T-REL | A | 2 |
| TC-CHAOS-01 | Database down | Stop Postgres for 5 min under load | API returns 503 with `Retry-After`; phones keep events queued; full recovery and 0 loss after restart; alert fires | NFR-31, NFR-76 | T-REL | A | 1 |
| TC-CHAOS-02 | API worker killed | Kill one Uvicorn worker under load | The other worker serves; the container restarts; no request lost beyond retries | NFR-33, NFR-76 | T-REL | A | 1 |
| TC-CHAOS-03 | Disk full | Fill the volume to 100% | Writes fail safely (503); no corruption; alert at 80%; recovery after cleanup | NFR-76 | T-REL | M | 1 |
| TC-CHAOS-04 | Slow database | Add 500 ms latency (tc netem) | Timeouts return 503 in ≤ 10 s; no thread or connection exhaustion | NFR-76 | T-REL | A | 2 |
| TC-CHAOS-05 | Network partition | Drop the phone's network mid-batch | The batch retries; acknowledgement is idempotent; 0 duplicates | NFR-35 | T-REL | A | 1 |
| TC-CHAOS-06 | Clock skew | Phone clock +2 days or −1 year | Events accepted (the server uses its own time; monotonic order checked); consent purge not triggered falsely | FR-39 | T-REL | A | 1 |
| TC-CHAOS-07 | Restore drill | Restore the latest backup to a clean VM during a test week | RTO ≤ 4 h; RPO ≤ 24 h; the app reconnects | NFR-34 | T-REL | M | 1 |
| TC-CHAOS-08 | Revoked token mid-sync | Revoke the device token during upload | `401` → refresh, or re-link prompt; queued events kept | ADR-0011 | T-REL | A | 2 |

## 3. Authorisation matrix (T-SEC-05)

Each cell is the expected status for a request with a valid token of that kind. The test suite generates one test per cell from `docs/api/openapi.yaml`.

| Route | Anonymous | Student (own) | Student (other's object) | Parent link | Teacher (own class) | Teacher (other class) | Admin | Researcher |
|---|---|---|---|---|---|---|---|---|
| `POST /auth/student/join` | 201 | — | — | — | — | — | — | — |
| `GET /me/profile` | 401 | 200 | — | 401 | 401 | 401 | 401 | 401 |
| `POST /events:batch` | 401 | 200 / 403 (no consent) | 200, with each event for another student's run listed in `rejected` (the request itself succeeds) | 401 | 401 | 401 | 401 | 401 |
| `GET /results/{id}/why` | 401 | 200 | 404 | 401 | 401 | 401 | 401 | 401 |
| `DELETE /share-links/{id}` | 401 | 204 | 404 | 401 | 401 | 401 | 401 | 401 |
| `GET /p/{token}` | 200 if valid, else 404 / 410 | — | — | 200 | — | — | — | — |
| `GET /dash/classes/{id}/roster` | 401 | 401 | — | 401 | 200 | 404 | 200 | 403 |
| `GET /dash/students/{id}/summary` | 401 | 401 | — | 401 | 200 (consented) / 404 | 404 | 200 (audited) | 403 |
| `POST /admin/models/{id}:activate` | 401 | 401 | — | 401 | 403 | 403 | 200 / 409 | 403 |
| `GET /research/export` | 401 | 401 | — | 401 | 403 | 403 | 403 | 200 (audited) |
