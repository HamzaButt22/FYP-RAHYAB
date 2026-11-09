# Data Protection Impact Assessment (DPIA)

| | |
|---|---|
| **System** | Rahyaab: a game-based stream guidance app (mobile app, API, parent web page, teacher dashboard) |
| **Controller** | **Pilot (proposed, to confirm with the ethics office):** Riphah International University is the controller for the research and the app, acting through the supervisor; the FYP team operates it. Each partner school is controller for its own paper consent forms and class rosters. Who handles what: access, deletion and complaints from families → the team (with the school's help on the school path); security incidents → the team, notifying the university and the schools; disputes about consent → the school and the supervisor together |
| **Version / date** | 1.0, 5 Nov 2026 |
| **Owner / reviewers** | Zahid Bashir (owner); Daniyal Sarwar; supervisor Zeeshan Ali; the university ethics committee |
| **Why a DPIA** | The system processes data about **children (13–17)** and **profiles** their interests and abilities to make recommendations. Under the ICO Children's Code, GDPR Art. 35 practice and the principles of Pakistan's draft PDP Bill, this needs a documented risk assessment |
| **Review** | Before the pilot; then whenever a new data field, SDK, purpose or host is added |

## 1. What the processing is

| Item | Description |
|---|---|
| **Purpose** | Help students choose an education path by estimating interests, abilities and values from gameplay, and ranking eligible paths with reasons. With a **separate** opt-in: research on the validity and fairness of the method |
| **Data subjects** | Students (class 8–12, ages 13–18+); parents and guardians; teachers, counsellors and admins (staff) |
| **Data** | See §2. No names, phone numbers, emails, photos, identity numbers or location from students |
| **Sources** | The student (play, profile), the school (roster, consent forms), parents (OTP consent), staff (notes) |
| **Recipients** | The student; their parents (through a link the student creates); their teachers (consented students only); the team (pseudonymous, audited). **Processors:** the hosting provider (encrypted disks), an SMS aggregator (individual path only: the parent's phone number and a one-time code), and an email provider (staff email addresses for password resets). None receives game data. Play Integrity (when available) sends a request hash to Google, not student data |
| **Storage** | The phone (encrypted SQLite); one VM (PostgreSQL, encrypted disk); encrypted off-site backups |
| **Retention** | `DATA_GOVERNANCE.md` §3 (raw events 12 months; deletion requests within 30 days) |
| **Scale (pilot)** | 150–300 students in 3–4 schools; about 1,000 at most in FYP-2 |

## 2. Data inventory and lawful basis

| Data | Category | Basis | Necessary because |
|---|---|---|---|
| Nickname, class, board, group, district, age band, situation | Personal (pseudonymous) | Parental consent (13–17) / self-consent (18+) | Mode, eligibility rules, routes |
| Gameplay events and task results | Profiling inputs | Same | The assessment itself |
| Trait estimates and recommendations | Profiling outputs | Same | The service the student asked for |
| Device tier (low/mid/high), Android major version, installation ID, Keystore public key | Technical | Covered by the parental consent / self-consent and disclosed in Form A (not legitimate interest, because the subjects are children) | Device-bound sign-in; device-fairness checks (V6). No model name or hardware ID |
| Guardian phone (individual path only) | Contact; restricted | Consent | OTP for verifiable consent |
| Consent records | Legal record | Legal obligation / accountability | Proof of consent |
| Gender and medium (research, opt-in only) | Special interest (fairness) | **Separate explicit research consent** | Fairness audit; never used to recommend |
| Staff email, password hash, MFA secret | Staff personal data | Contract / legitimate interest | Secure access |
| Notes and flags | Staff-generated, about students | Parental consent (Form A names them) | Follow-up by counsellors; deleted at the end of the academic year |
| Marks (optional) | Personal; **confidential (minor)** | Consent | Eligibility rules and a small fit term; size and range checked; never shown to teachers by default |
| Paper consent forms (school path) | Parent name, relationship, signature, child's class and section, form serial | Consent record | Kept locked at the school; the team receives only the serial and the yes/no answers; linked to a profile only through the one-time claim code; destroyed per the ethics approval |

## 3. Necessity and proportionality

- **Minimisation:** nothing beyond what the result needs; age as a band; gender only for research and kept apart; marks optional.
- **Purpose limitation:** guidance; research only with a separate opt-in. No ads, no sale, no third-party analytics (ADR-0007).
- **Accuracy:** students can update their profile and class (FR-101). Results show confidence and are never final.
- **Transparency:** an assent screen, a privacy notice and the privacy policy at Grade 6 level in Urdu and English, with read-aloud; "Why this?" for every result.
- **Rights:** download and delete in the app (FR-10); parents can withdraw (FR-70); deletion within 30 days.
- **Children's best interests (ICO standard 1):** no nudges, streaks or loss framing; no single verdict; "talk to your family"; costly routes are never pushed.

## 4. Risks and controls

Likelihood (L) and severity (S) are rated 1–3. A residual risk is **accepted** only if it is low, or medium with a documented reason.

| # | Risk to people | L | S | Controls | Residual |
|---|---|---|---|---|---|
| R1 | A breach exposes children's profiles | 2 | 3 | Pseudonymous IDs; encryption on the device, in transit and at rest; RBAC + tenant scope; MFA; audit log; pentest before the pilot; incident plan with 72-hour notice | Low–medium (accepted) |
| R2 | A recommendation steers a child wrongly or reinforces stereotypes (monitoring: the V6 fairness audit runs on every pilot cohort and every model release; a matched gap > .10 or flagged DIF pauses that model version until the supervisor reviews it; owner: Zahid Bashir) | 2 | 3 | Top 3 + Plan B + confidence; gender never an input; fairness audit; counsellor panel; family conversation; anti-push rule for routes | Medium (accepted, with monitoring) |
| R3 | Siblings or others see a child's data on a shared phone | 2 | 2 | PIN profiles; `FLAG_SECURE`; wipe on sign-out; a parent's "save to this phone" is off by default, with a warning | Low |
| R4 | Teachers see data they shouldn't, or misuse it | 2 | 2 | Own classes and consented students only; small groups hidden; reads audited; staff guidance not to decide from the app alone | Low |
| R5 | Uploads before consent | 1 | 3 | Server consent gate; local purge after 14 days | Low |
| R6 | A forwarded or leaked share link | 2 | 2 | 128-bit tokens; 30-day expiry; revoke; no identifiers in the URL; `noindex` | Low |
| R7 | Research re-identifies students | 1 | 3 | De-identified, opt-in exports; k-anonymity check; gender in a separate role-restricted table | Low |
| R8 | Data leaves Pakistan, or a vendor processes it | 2 | 2 | Self-hosted; no SDKs; a region decision recorded; can move to a local host | Low–medium (**verify** the production region) |
| R9 | Profiling causes anxiety | 2 | 2 | No timers, scores or "wrong"; break nudges; confidence in plain words | Low |
| R10 | Adults (18+) or over-age learners are mixed into minors' research | 1 | 2 | Age bands; adults excluded from research unless approved | Low |

## 5. Consultation

| Who | How | When |
|---|---|---|
| Students (5–8 per round) | Usability rounds, including the assent and privacy notice comprehension check | M-A, M-C |
| Parents (3–4) | P-01 and P-02 walkthrough; consent form readability | M-A |
| Teachers (2–3) | Dashboard and consent workflow | M-B |
| Supervisor and ethics committee | This DPIA, the consent forms and the protocol | Before the pilot |

## 6. Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| Data protection owner (team) | Zahid Bashir | | |
| Supervisor | Zeeshan Ali | | |
| Ethics committee | | | |

**The DPIA counts as approved for the pilot** when all three rows are signed and actions 1–6 below are done.

**Actions before the pilot** (owner, target date):
1. Record the production hosting region (Zahid Bashir, end of S6).
2. Finish the pentest and fix every critical and high finding (Zahid Bashir, S8).
3. Get ethics approval for the consent forms and the consent methods, including the OTP path (Daniyal Sarwar, application in S1; approval needed by mid-February 2027).
4. Publish the privacy policy with working contact addresses (Hamza Butt, before the pilot build).
5. Native Urdu review of every form (Daniyal Sarwar, before the ethics application).
6. Agree the controller roles in writing with the university and each school (supervisor, before the pilot).
