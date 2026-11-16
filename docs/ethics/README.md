# Ethics application package

**Status, 16 Nov 2026: first complete draft, not yet reviewed.** Owner: Hamza Butt (since the 14 Nov role change). Reviewer: Zeeshan Ali (supervisor). **Target: submit by 27 Nov 2026; approval needed by 15 Feb 2027** (`docs/project/PLAN.md` §5). Usability round 1 (22–26 Feb) and the pilot (5 Apr – 14 May) cannot start without the approval letter.

## What is in the package

| # | Document | File | State |
|---|---|---|---|
| 1 | Riphah's own application form | *Not in this repository: get it from the supervisor or the ethics office* | **Missing** |
| 2 | Research protocol | `PROTOCOL.md` | Draft v0.1 |
| 3 | Parent information and consent (Form A), English and Urdu | `CONSENT_FORMS.md` | English draft; **Urdu needs native review and must be aligned with the English** |
| 4 | Student assent (Form B), English and Urdu | `CONSENT_FORMS.md` (also the in-app screen S-04) | Same |
| 5 | Adult learner consent (Form C) | `CONSENT_FORMS.md` | Draft |
| 6 | School permission letter (Form D) | `CONSENT_FORMS.md` | Draft; signed copies come from schools |
| 7 | Counsellor panel consent (Form E) | `CONSENT_FORMS.md` | Draft |
| 8 | Teacher interview consent (Form F) | `CONSENT_FORMS.md` | Draft, only if interviews are kept (open item 6) |
| 9 | Usability session consent and assent (Form G) | `CONSENT_FORMS.md` | Draft |
| 10 | Withdrawal form | `CONSENT_FORMS.md` | Draft |
| 11 | Data Protection Impact Assessment | `../security/DPIA.md` | v1.1, 16 Nov 2026: owners updated, R11 and R12 added; supervisor review pending |
| 12 | Data management and retention | `../security/DATA_GOVERNANCE.md` | Done |
| 13 | How age is checked without IDs | `../security/AGE_ASSURANCE.md` | Done |
| 14 | Privacy notice | `../legal/PRIVACY_POLICY.md` | Draft; contact addresses missing |
| 15 | Instruments: Mini-IP (licensed, attach the licence terms), confidence and English-reading items, SUS | SRS §17.1; `PROTOCOL.md` §7 | Mini-IP version to confirm (open item 4) |
| 16 | Think-aloud and interview prompts for usability rounds | `USABILITY_PROMPTS.md` | Drafted v0.1; supervisor review pending; SUS wording and word list to settle |
| 17 | Teacher guide (consent recording, what the dashboard shows, "never decide from the app alone", safeguarding route) | `TEACHER_GUIDE.md` | Drafted v0.1; supervisor review pending; contacts to fill; dashboard steps to check once it is built |
| 18 | Screenshots of the app's consent screens (S-04) and the parent page (P-02) | `design/screens/png/` | Available |

The application should be **short and readable**: the protocol, the forms and the instruments are what the committee reads; the DPIA, data governance and age assurance documents are attached as evidence.

## Open items (decide or do before submission)

| # | Item | Who | By |
|---|---|---|---|
| 1 | **Get Riphah's ethics application form**, its submission route and the committee's meeting dates. Copy the protocol's sections into it; do not invent the form's headings | Hamza, with the supervisor | 18 Nov |
| 2 | Confirm the supervisor is the principal investigator | Supervisor | 18 Nov |
| 3 | **Native Urdu review of Forms A and B**: align the Urdu Form A with the English one (it currently says "phone model" where the English says the model is not collected, and it lacks several sentences, including the new one on tuning the scoring); fill the placeholders in both languages | A native Urdu speaker named by the team or supervisor | 24 Nov |
| 4 | **Settle the benchmark instrument.** The docs disagree: `SCIENTIFIC_BASIS.md` says the Mini-IP has 60 items, `design/game/GAME_DESIGN.md` says 30; Form A says the survey takes about 15 minutes, SRS §17.4 says 10. I believe the O\*NET Mini-IP is the 30-item form and the 60-item form is the Interest Profiler Short Form, but **check this on the O\*NET Resource Center** before anything is printed. Also confirm the licence allows research use in schools (SRS assumption A-03) | Zahid (owns V2) | 21 Nov |
| 5 | **Schools:** names of the 3–4 schools to approach; the committee may ask for a letter of intent before approval. Form D signatures can follow | Hamza, with the supervisor | Before submission if the committee requires it |
| 6 | **Formative surveys and interviews** (SRS §17.1–17.3): keep them in this application (more consent paperwork; the parent survey would need Urdu) or drop them? The pilot only needs two items from the student survey (Q9 confidence, Q13 English reading), which the protocol already includes. Suggested: drop the full surveys; keep teacher interviews optional (Form F) | Team decision | 20 Nov |
| 7 | **Form G's parent part in Urdu?** ADR-0016 keeps Urdu for Forms A and B only. Parents of usability-session students should probably get the same choice; if so, write it and add it to the native review | Team decision | 20 Nov |
| 8 | Adults (18+): ask the committee to allow them in research, or exclude them (the default) | Team decision; the protocol asks the committee (§13) | — |
| 9 | Fill in contacts (team, supervisor, committee), the hosting region (DPIA action 1) and the incentive decision (none, or a certificate for every student) | Hamza | 24 Nov |
| 10 | **Done in draft (16 Nov):** the DPIA (v1.1) now names Hamza as owner and for the ethics actions, and adds R11 (reading difficulty, ADR-0016) and R12 (conflict of interest, `PROTOCOL.md` §12). **Remains:** supervisor review; fill the hosting region (action 1) | Hamza; supervisor | 21 Nov |
| 11 | **Drafted (16 Nov):** `USABILITY_PROMPTS.md` and `TEACHER_GUIDE.md` (items 16 and 17), both by Hamza (V8 and the ethics application are his since 14–15 Nov). **Remains:** supervisor review; fill contacts; check the teacher guide against the dashboard once it is built; agree the SUS word list and whether the Form G parent part needs Urdu (item 7) | Hamza; supervisor | 24 Nov |
| 12 | Breach notices to parents are English only since ADR-0016 (NFR-49). Decide whether a short Urdu notice is kept, like the consent forms | Team decision | 20 Nov |

## Timeline to submission

| Date | Step |
|---|---|
| 16 Nov | Drafts in this folder (done) |
| 18 Nov | Supervisor meeting: open items 1, 2, 5, 6, 7, 8 |
| 21 Nov | Instrument settled (4); DPIA updated (10) |
| 24 Nov | Urdu review back (3); prompts and teacher guide written (11); placeholders filled (9) |
| 25–26 Nov | Supervisor reads the full package and signs |
| **27 Nov** | **Submit** |

If the committee asks for changes, the plan's buffer is the gap between submission and 15 Feb. If there is no approval by 15 Feb, the fallback in `PLAN.md` §6 starts (usability round 1 with adult students only; a shorter pilot).

## Rules for editing these documents

- **Never change what a form says without changing the protocol, the app (S-04, P-02) and the Urdu version together.** The committee approves exact wording; a later change needs an amendment.
- Keep forms at a Grade 6 reading level, and Form A within 2 pages.
- No real student, parent or teacher data ever goes into this repository (signed forms stay at the school and with the supervisor).
