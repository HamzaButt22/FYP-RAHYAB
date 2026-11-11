# Age assurance: how Rahyaab knows a student's age is right

**The committee's question:** *"How will you know whether a student, a guardian or a bad actor entered the correct age?"*

**Short answer:** Rahyaab never relies on the age a student types to decide anything that matters. The student's answer only stops under-13s early and sets a provisional band. **The age that counts comes from the school's admission register.** A teacher copies it when recording the signed consent form, and the server uses that recorded band over anything the student typed. Without a recorded form, no data leaves the phone, whatever age is entered.

**Requirements:** FR-04, FR-05, FR-100. **Design:** ADR-0011, RFC-0004. **Code:** `backend/api/src/rahyaab_api/routers/student_auth.py`. **Tests:** TC-AGE-01 to TC-AGE-04, TC-EDGE-06, TC-EDGE-07.

## 1. Why we can't simply check an ID

Rahyaab is designed not to collect names, phone numbers, CNIC or B-Form numbers, or photos from students (NFR-44, ADR-0011). An ID check would break that promise and create the most sensitive dataset in the system. So age has to be assured **without** identity documents. The usual guidance for children's services is age assurance in proportion to the risk. The UK ICO's Age Appropriate Design Code, which the SRS already uses as a benchmark, is one example. Rahyaab meets it with an independent check by the school.

## 2. Where the age comes from

| Source | Who provides it | How much we trust it | What it is used for |
|---|---|---|---|
| Birth month and year typed in the app | The student | **Low.** Anyone can type anything | Stops under-13s at once (FR-04); a provisional band shown in the app; compared later with the school record |
| **Age band copied from the admission register** | The class teacher, when recording the signed form | **High.** Schools register students from birth certificates or B-Forms, and the teacher's account is in the audit log | **Decides the band stored, the consent type, and research inclusion** |
| The consent form itself (Form A or Form C) | Parent, or the adult student | Medium. A signature is a legal declaration, but it can be false | Consent; cross-checked against the register band |

## 3. The rule the server applies

1. **Under 13 by the student's own answer:** neutral stop; nothing is stored (FR-04).
2. **No claim code, or a claim code that is not yet recorded:** the profile is created with the student's own band, marked `age_verified = false`. **Consent stays `pending`**, so nothing is uploaded (NFR-45). This holds **even if the student claims to be 18 or over**: a self-declared adult gets no self-consent.
3. **A recorded slip:**
   - **Form A** (`kind = parent`) may only be recorded with a band of 13–15 or 16–17;
   - **Form C** (`kind = self`, adult self-consent) may only be recorded with 18–19, 20–24 or 25+.

   The database rejects any other combination (`consent_slip_kind_band_check`). The stored band becomes the register band and `age_verified = true`.
4. **The student's answer and the register disagree:** the register wins, and an `age_mismatch` flag tells the teacher. The flag holds both bands and nothing more. It is for a conversation, not a penalty.
5. **Form back after joining:** the student enters the claim code later (`POST /consents:claim`). The same rules apply, and the register's band replaces the provisional one.
6. **Turning 18 later:** the yearly class check-in (FR-101) asks the school to record a Form C. Until then, the parent's consent stays in force.

## 4. What each kind of person could try, and what happens

| Who | What they try | What happens |
|---|---|---|
| A 15-year-old | Types a 2000 birth year to skip parental consent | Joins with consent `pending`; nothing uploads; no self-consent is created (TC-AGE-01) |
| A 15-year-old | Gets a Form C (adult form) and signs it themself | The teacher must record it with the band from the register (16–17 or lower), and the database refuses an adult form with a minor's band. The teacher records a Form A from the parent instead (TC-AGE-04) |
| A 12-year-old | Types 13 or older | Passes the app's first check, but the register says 12, so no slip is recorded and nothing uploads. Pilot classes 8–10 are checked by the teacher before the consent drive |
| A guardian | Signs Form A with a false age for the child | The teacher records the **register's** band, not the form's. If they differ, the register wins and the teacher is flagged |
| A bad actor outside the school | Joins with a guessed class code | Needs a live class code (about 453 million possible, rate-limited), gets no consent without a claim code recorded by a teacher, and cannot upload. Claim codes pause per class after 30 failures |
| A teacher | Records a false band | Every recording is in the audit log with the teacher's account; a second staff member spot-checks 5 forms per class (RFC-0004). This residual risk is accepted |

## 5. Remaining risks, stated honestly

- **A school register can itself be wrong.** We accept the school's record as the best evidence available without collecting IDs. The same register decides the student's class and board exams.
- **Post-MVP individual path** (no school): age comes from the parent's OTP consent with a written guardian attestation, and the payment comes from an app-store account that requires an adult holder (ADR-0015). This is weaker than a school register, so individual users' data is **excluded from the research dataset** unless the ethics approval says otherwise.
- **Adults (18+) in research:** excluded unless the ethics approval covers them (FR-100), whatever path they joined by.

## 6. What to show the committee

1. A join with a false adult age: consent stays pending, so nothing uploads.
2. The same student with a recorded Form A: the register band is stored and an `age_mismatch` flag appears.
3. The database refusing a Form C recorded with a minor's band.
4. The audit trail of who recorded each slip.
