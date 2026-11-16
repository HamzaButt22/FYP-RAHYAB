# Research protocol: Rahyaab pilot and validation study

**Draft v0.1, 16 Nov 2026, for the Riphah ethics application.** Written by the team for the supervisor's review. It describes what the study does with people; the product itself is described in `docs/project/SRS.md`, and the measurement method in `docs/project/SCIENTIFIC_BASIS.md`. Text in `[brackets]` must be filled in or confirmed before submission (see `README.md` in this folder, "Open items").

| | |
|---|---|
| **Title** | Rahyaab: a game-based guidance app for choosing a study path. Pilot and validation study in Pakistani schools |
| **Institution** | Riphah International University, Faculty of Computing (BS Data Science, Final Year Project) |
| **Principal investigator** | `[Zeeshan Ali, supervisor: confirm that the supervisor is named as PI, as student research usually requires]` |
| **Student investigators** | Hamza Butt (ethics application, app, data protection lead for this application); Zahid Bashir (game design, validation studies V2–V4); Daniyal Sarwar (usability rounds, report) |
| **Study period** | Usability round 1: 22–26 Feb 2027. Pilot: 5 Apr – 14 May 2027 (usability round 2: 12–16 Apr). Analysis: 17 May – 11 Jun 2027. All data collection starts only after written ethics approval |
| **Related documents** | Consent forms (`CONSENT_FORMS.md`), DPIA (`../security/DPIA.md`), data governance (`../security/DATA_GOVERNANCE.md`), age assurance (`../security/AGE_ASSURANCE.md`), privacy policy (`../legal/PRIVACY_POLICY.md`), instruments (SRS §17) |

## 1. Background

Pakistani students choose a study group at the end of class 8 or 9 (Matric) and again after Matric (Intermediate). The choice decides which degrees and careers stay open, yet structured career guidance in schools is rare, and many families decide on reputation or cost alone (SRS §1–2 and the literature review in `docs/research/`).

Rahyaab is a mobile game. A student lives a story "year" in four short weeks. From their choices and small everyday puzzles, the app estimates interests (Holland's RIASEC types) and abilities, applies the board's eligibility rules, and suggests three study paths with reasons and a Plan B. It never decides for the student; every result says it is a starting point for a family conversation.

Game-based assessment is promising but unproven for this use and population. This study checks, before any wider use, whether the game's scores agree with an established interest inventory, whether they are reliable and fair, whether the suggestions agree with experienced counsellors, and whether students find the app usable and helpful.

## 2. Aims and research questions

The numbered studies are the validation plan in `SCIENTIFIC_BASIS.md` §5. V1 (a simulation on an open dataset) and V7 (a software reproducibility check) involve no participants and are not part of this application.

| Study | Question | Participants |
|---|---|---|
| **V2** | Do the game's interest scores agree with the O\*NET Mini Interest Profiler (Mini-IP)? | Pilot students with research consent |
| **V3** | Does the game separate the six interest types (multitrait–multimethod check)? (exploratory) | Same |
| **V4** | Are the scores reliable (split-half, a 2-week retest with n ≥ 40)? | Same; the retest sub-sample |
| **V5** | Do the app's top 3 paths agree with a blinded panel of counsellors? | 3 counsellors (adults), ranking written profiles |
| **V6** | Is it fair: do equal scores lead to equal suggestions across gender and school medium? | Pilot students who opt in to recording gender and medium |
| **V8** | Is it usable, and does it change students' confidence about their choice? | Usability rounds (5–8 students each); pilot students (a short survey before and after) |

The pre-registered targets (for example convergent r ≥ .50 on at least 4 of 6 types) are in `SCIENTIFIC_BASIS.md` §5. **Results are reported whether or not they meet the targets.**

## 3. Design

A single-arm field pilot with repeated measures, plus two small qualitative usability rounds and an expert-panel study. There is no control group and no deception. Nothing is withheld from any student: every student in a participating class may use the app whether or not their family agrees to the research part.

## 4. Setting and participants

### 4.1 Schools

3–4 schools (`[names after recruitment]`), public and private, Urdu-medium and English-medium where possible, approached through the supervisor's and the team's contacts. Each school signs a permission letter (Form D) before anything happens at that school.

### 4.2 Students

| | |
|---|---|
| **Who** | Students in classes 8–10 of a participating school, aged 13–17 |
| **Target** | 150 with research consent (at least 100 complete); about 250 enrolled to reach that, assuming about 60% complete all four weeks (`PLAN.md` §6) |
| **Inclusion** | In class 8, 9 or 10 at a participating school; a signed parent or guardian consent (Form A) recorded by the school; the student's own assent (Form B); access to an Android phone (own or family) or a school device |
| **Exclusion** | Under 13 by the school's admission register (the app also stops anyone who enters an age under 13, and nothing is stored); no recorded parental consent (the app works, but nothing leaves the phone and nothing is used); students the school asks us not to include |
| **Adults (18+) in these classes** | Rare, but possible. They sign Form C themselves, recorded only after the school confirms the age from its register. **They are excluded from research data unless the committee approves adult research participation** (this application asks for that approval: see §13) |

Class 8 students are often 12 or 13. Those under 13 cannot take part. This is a known limit on the class 8 sample and is reported.

### 4.3 Adults

- **Counsellors (V5):** 3 school or university counsellors, recruited through the supervisor, sign Form E. They rank 120–200 written student profiles (vignettes) that describe no real person, plus 30–60 pilot profiles that carry only a research ID and scores.
- **Teachers:** one coordinating teacher per school (named in Form D). Teachers are not research participants; they use the dashboard as part of the school's normal guidance, record consent forms, and support supervised sessions. If any teacher is interviewed for research (SRS §17.3), they sign Form F first.

## 5. Recruitment and consent

Consent is in layers: the school, then the parent or guardian, then the student. Each layer can say no without affecting the others' standing at school.

1. **School:** the team meets the principal with this protocol and the forms. The principal signs Form D. The coordinating teacher is briefed (a teacher guide covers consent recording, what the dashboard shows, and "never decide from the app alone").
2. **Parents:** the school sends Form A home, in English and Urdu (the parent chooses), on paper, with at least 5 school days to decide. The form has two parts: Part 1 (use of the app, required to take part) and Part 2 (research, optional, with separate boxes for de-identified research use, the survey and retest, and recording gender and school medium). A parent can sign or give a thumbprint; a teacher or the team can read the form aloud on request.
3. **Recording:** the teacher records each returned form in the dashboard with the age band copied from the admission register (never from the form or the student). The child keeps a tear-off slip with a one-time claim code. Until a form is recorded, the app uploads nothing.
4. **Student:** when joining, the student reads Form B on screen (with a Listen button) and passes a two-question understanding check before agreeing. The research box is a separate, optional tick. In supervised sessions, the researcher also explains the study aloud and asks again before the survey.
5. **No pressure:** teachers do not chase individual families for research consent, and no grade, privilege or reward depends on taking part. Students who do not take part in the research are not identified to their classmates.

**Who can withdraw, and how:** the parent, or the student (assent can be withdrawn by the student alone), at any time, by telling the teacher or the team, using the link in the family report, the in-app delete option, or the withdrawal form. Live data is deleted within 30 days and from encrypted backups within 90 days. Data already in a de-identified research export cannot be removed, because it no longer carries the student's ID; Form A says so.

## 6. Procedures

| When | What the student does | Time | Who is present |
|---|---|---|---|
| Joining (week 0) | Join the class with the class code, choose a nickname, give the claim code; assent (Form B); a short practice week | About 10 minutes | Class teacher, at school |
| **Before play** (research only) | Short survey: confidence about choosing a group (one item from SRS §17.1, Q9) and how easily they read English (Q13) | About 2 minutes | In the app, or on paper in class |
| Weeks 1–4 | Play one short "week" at a time: story choices and small puzzles. No timer, no right or wrong, no scores shown | About 5–10 minutes a week | Alone, at school or home |
| After week 4 | See the top 3 paths with reasons and a Plan B; optionally share a link with the family | About 5 minutes | Alone, or with family |
| **Supervised session** (research only) | Mini-IP interest survey (unchanged, in English; a researcher reads items aloud and may explain a word from a fixed glossary, never the item); the confidence item again; System Usability Scale | About 15–20 minutes | Researcher and a teacher, at school, in a room the school provides |
| **Retest** (research, n ≥ 40, invited at random) | Play a short replay of the game choices 2 weeks later | About 10 minutes | Alone, or in class |
| **Usability rounds** (5–8 students each, separate consent box) | Think aloud while playing; a short interview about what was clear or confusing | About 30 minutes | Two researchers and a teacher, at school |

**Total time for a research participant:** about 1–1.5 hours over 6 weeks, mostly play. `[Confirm: Form A says "about 15 minutes" for the survey and SRS §17.4 says 10 minutes; the instrument length must be settled first (README, open item 4).]`

**What the app records** is listed in Form A and the DPIA §2: a nickname, class, board, group, district, an age band, game choices and puzzle results, coarse device type and Android version. **It never records** names, phone numbers, emails, photos, location, identity numbers or free text from students. Usability sessions are recorded as written notes only; no audio or video recording `[unless the team decides otherwise, which then needs its own consent box]`.

## 7. Instruments

| Instrument | Source | Language | Who |
|---|---|---|---|
| Rahyaab game (the intervention and the measurement) | The team | English, with read-aloud | All students |
| O\*NET Mini Interest Profiler `[confirm the version: the docs say both 30 and 60 items]` | O\*NET Resource Center, under its licence; used unchanged | English (the licence does not allow a modified or translated version without permission) | Research participants |
| Confidence item and English-reading item | SRS §17.1 (Q9, Q13) | English | Research participants |
| System Usability Scale | Brooke (1996) | English | Research participants; usability rounds |
| Think-aloud and interview prompts | The team (`[attach]`) | English or Urdu, spoken | Usability rounds |
| Counsellor ranking task | The team (vignettes in English) | English | Counsellors |
| *(Optional, only if kept in this application)* Student survey, parent survey, teacher interview | SRS §17.1–17.3 | English; parent survey in Urdu and English | See README, open item 6 |

## 8. Risks and how they are reduced

The study is judged **minimal risk**: the activities are like ordinary classroom activities (a game and a short questionnaire), no sensitive topics are asked about, and no identifying data are collected. The remaining risks are below; the full data-protection assessment is the DPIA.

| Risk | Who | Controls |
|---|---|---|
| A suggestion worries the student or causes family conflict | Students, families | Three paths and a Plan B, never one verdict; confidence in plain words; "a starting point, talk with your family"; no timer, no scores, no "wrong"; teachers told not to decide from the app; a teacher guide for parents' questions |
| Feeling tested or anxious | Students | No timers or scores; "no right answers" on every screen; stop at any time; supervised sessions run calmly, with breaks |
| Pressure to take part, because the school is involved | Students, families | Separate optional research consent; no rewards or grades; teachers do not chase research consent; non-participants are not identified |
| Stereotyped suggestions (for example by gender) | Students | Gender is never an input; the fairness audit (V6) can pause a model version; costly routes are never pushed |
| Privacy: a breach, or a sibling seeing results on a shared phone | Students | Pseudonymous IDs; encryption on the phone, in transit and at rest; PIN profiles and wipe on sign-out; nothing uploaded without recorded consent; incident plan (DPIA R1–R10) |
| Reading difficulty for students from Urdu-medium schools (the app is English only, ADR-0016) | Students | Grade 6 reading level; read-aloud on every screen; icons and pictures; teacher explanation; school medium recorded so results can be reported by medium |
| A student shows distress, or tells a researcher about a safeguarding concern | Students | §9 |
| Data from adults or under-13s mixed into minors' research | Students | Age from the school register; under-13s stopped; adults excluded unless approved (§4.2) |

**Benefits.** No payment. Possible benefits to the student: learning about study paths and careers, and a clear report to discuss at home. Benefits to others: evidence on whether a game can support guidance where counsellors are scarce.

**Incentives.** None. `[If the team wants to give a certificate of participation to every student in a participating class, whether or not they joined the research, state it here.]`

## 9. Distress, disclosure and adverse events

The app contains no free text, chat or messaging, so a disclosure can only happen in person, during supervised sessions or usability rounds.

1. **Before the pilot:** each school names its **designated safeguarding contact** (usually the principal or the coordinating teacher) in Form D. Researchers carry that name and the school's referral route.
2. **If a student is upset:** stop the activity, offer a break, and make clear that stopping is fine. Do not continue that student's session that day. Tell the coordinating teacher.
3. **If a student discloses harm or risk of harm** (to themself or from others): listen, do not promise secrecy, do not investigate, and pass it the same day to the school's safeguarding contact, following the school's procedure. Write down only what was said and to whom it was passed; keep that note separate from all research data, and give it to the supervisor.
4. **Adverse events and complaints:** any event that harms a participant, any data incident, and any complaint is reported to the supervisor within 24 hours and to the ethics committee within `[the committee's deadline]`. Data incidents also follow `SECURITY.md` (72-hour notice).
5. **Stopping rules:** the study pauses at a school if the school asks, and the whole study pauses if the supervisor or the committee asks, or if the fairness audit (V6) finds an unexplained gap (DPIA R2).

## 10. Data management

The full rules are in `DATA_GOVERNANCE.md`; in short:

- **Collected only with consent:** before a form is recorded, events stay on the phone and are deleted after 14 days.
- **Pseudonymous in the app:** students are known only by a nickname and a random ID. The team never has a list linking nicknames to real names; only the school holds the paper forms.
- **Research exports are de-identified:** a separate research ID, no nickname, coarse fields only, a k-anonymity check before export, and gender and medium in a separate table that only the research role can read. Exports are stored on an encrypted drive.
- **Storage:** an encrypted database on one server `[region to confirm: DPIA action 1]`, with encrypted off-site backups. No third-party analytics or advertising code (ADR-0007).
- **Retention:** raw game events 12 months; student profiles 12 months after last activity; research exports until the FYP is graded plus 1 year, or the shorter period the committee sets; paper consent forms at the school and with the supervisor, locked, for the period the committee sets, then shredded.
- **Access:** the team, by role, with an audit log. The supervisor can see research exports. Teachers see only their own consenting students, and never research data.

**Use of pilot data to improve the app.** De-identified pilot data is used to recalibrate the scoring (the item parameters) as part of the validation. The team intends to offer Rahyaab to schools after the FYP (ADR-0015). See §12.

## 11. Analysis and dissemination

The analyses are pre-registered in `SCIENTIFIC_BASIS.md` §5 (convergent correlations with 95% confidence intervals, reliability, NDCG@3 and κ for the panel, matched-rate gaps and differential item functioning for fairness, SUS). Scores used in V2–V6 come from parameters fitted without that student (5-fold cross-validation). Results go into the FYP report, the final presentation and possibly a paper. **Nothing published identifies a school** without its permission (Form D), **or any student**; groups smaller than 5 are never reported. Each school receives a class-level summary.

## 12. Conflicts of interest

The team plans to offer Rahyaab commercially to schools and families after the FYP (ADR-0015). The study's results could therefore benefit the team. Controls: the targets are pre-registered and reported whether met or not; the supervisor reviews the analysis; no school pays for the pilot; and pilot data is never sold or shared with any company. `[Supervisor: confirm whether the committee's form needs a separate declaration.]`

## 13. Decisions requested from the committee

1. Approval of the student study (classes 8–10, ages 13–17) with parent consent and student assent as described.
2. Whether adult students (18+) in these classes may join the research with their own consent (Form C), or must be excluded (the default).
3. Whether the parent consent record, without game data, may be kept until the study ends plus 1 year as proof of consent (DATA_GOVERNANCE §3), or for another period.
4. Whether a signature **or thumbprint** on Form A is acceptable for parents who cannot sign.
5. The retention period for paper consent forms.
