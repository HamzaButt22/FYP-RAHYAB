# Rahyaab MVP: both semesters combined

The SRS describes the full product (108 FRs). This document defines the **MVP**: the smallest version that serves real students in a school pilot and proves the research question. That version must be done by the end of FYP-2 (June 2027) by a team of three.

It is planned as **one product across both semesters**, delivered in two increments:
- **FYP-1** builds a working core;
- **FYP-2** completes it and runs the pilot.

Anything not listed here is **post-MVP**.

| | |
|---|---|
| **Team** | Hamza Butt (mobile, platform and DevOps), Zahid Bashir (backend, scoring, security), Daniyal Sarwar (UX, content, dashboard) (owners as in `PLAN.md` §1) |
| **Capacity (agreed 9 Nov 2026)** | About **20 focused hours per person per week**, about 27 effective working weeks (exam and break weeks counted at half): **≈ 1,620 hours**. The bottom-up estimate is in `PLAN.md` §2 (≈ 1,580 hours after the cut below), so the slack is only about 3%. That is why the cut order in §4 is applied at fixed checkpoints, not when we notice we're late |
| **Supersedes** | The R1/R2/R3 split in SRS §4.2 and §13.5 where they differ. The SRS FRs stay; this document decides **when** each one ships |
| **Needs** | Supervisor sign-off (S0/S1) |

## 1. What the MVP must prove

1. A teen can **play 4 short weeks offline** on a budget phone and get **a top-3 with reasons, doors and a Plan B** that they understand.
2. Students of **every class from 8 to 12** (ages 13–18+), **boys and girls**, in any board or province, including technical, O/A-Level and private students, get guidance. In the MVP they join through their school (class code + consent slip); individual sign-up comes after the MVP.
3. The game's interest scores **agree with an established inventory** (O*NET Mini Interest Profiler) well enough to report (§14.4). Either outcome is a valid finding. The validation pilot covers **classes 8–10**; the class 11–12 and O/A-Level modes are rule-checked and usability-tested, and their validation is future work.
4. Families can **read and discuss** the result through a WhatsApp link.
5. Minors' data is **consented, minimal and secure** (no data leaves the phone without consent).

## 2. MVP scope

✅ = in the MVP. **F1** = delivered in FYP-1: the **demo slice** is shown at the FYP-1 demo in weeks 17–18 (14–25 Dec 2026, exact day set by the department), and the rest of F1 is finished by the end of S5 (15 Jan 2027). **F2** = delivered in FYP-2 (pilot build March 2027, final build June 2027).

### 2.1 Student app

| Feature | Requirement | MVP | When | Note |
|---|---|---|---|---|
| Language choice; English UI with Roman Urdu dialogue | FR-01 | ✅ | F1 | |
| Urdu-script UI and RTL | FR-01, NFR-27 | ✅ | F2 | Needed for government schools in the pilot |
| Onboarding, class code, nickname, **guided field help** | FR-02–04, FR-102 | ✅ | F1 | |
| Age handling (13–17 parent consent; 18+ self-consent; over-age routes) | FR-100 | ✅ | F1 (rules), F2 (routes) | |
| School-path consent: numbered forms with claim codes, recorded by the teacher (seed script in F1, dashboard screen in F2) | FR-05, FR-06 | ✅ | F1 | The only consent path in the MVP |
| Institution licences: a class code works only while the school's pilot or paid licence is active, with seats | FR-107 | ✅ | F1 | Pilot schools get free pilot licences (ADR-0015) |
| Individual subscriptions through app-store billing | FR-108 | ❌ post-MVP | — | Needs the individual sign-up path below |
| Individual sign-up with parent OTP | FR-03, FR-70 | ❌ **post-MVP** (decided 9 Nov 2026) | — | Saves about 40 hours, the SMS cost, PTA sender-ID registration and the weaker OTP consent. The API design stays in `openapi.yaml` for later. Adults (18+) still join through a school class code |
| Shared-phone PIN profiles | FR-07 | ✅ | F2 | |
| Home, the week loop, pause and resume | FR-13–17 | ✅ | F1 | |
| Week planner (3 of 6) | FR-18 | ✅ | F1 | |
| Story scenes with Dil/Duniya, written in Ink | FR-20, FR-95 | ✅ | F1: prologue + 4 short weeks (2 scenes each); F2: 3 scenes each | About 30 forced choices are needed for measurement. F2 gives exactly that (4 weeks × 3 scenes × 2 + 6 story beats = 30). The F1 demo gives about 20 (4 × 2 × 2 + the beats it has), so F1 results are shown as **demo, low confidence** and are never used as evidence |
| Adaptive pair selection | FR-19 | ✅ **as the research simulation** (V1: fixed vs adaptive) | F1 | Gives the CCP depth evidence; the app ships the fixed `pairs.json` schedule, and in-app adaptivity is added only if V1 shows a clear gain and time allows (F2) |
| Reaction tap | FR-93 | ✅ | F1 | |
| Calibration block | FR-21 | ✅ | F2 | |
| Tasks: planning, logic, numerical | FR-24–26 | ✅ | F1 | Planning is ported from the prototype |
| Tasks: spatial, abstract, verbal | FR-22, FR-23, FR-91 | ✅ | F2 | |
| Accessible task modes (buttons) | FR-98 | ✅ | F1 for the tasks built in F1 | |
| Value moments | FR-92 | ✅ | F2 | Low effort; reuses scenes |
| The letter | FR-94 | ✅ | F1 | |
| Read-aloud (phone voice, English) | FR-96 | ✅ | F1 | |
| Read-aloud in Urdu, with the recorded audio pack | FR-96, FR-32 | ✅ | F2 | Fixed text (instructions, prologue) as whole clips; the personalised Blueprint and parent report as **assembled clips** (each stream name, fit phrase and sentence template recorded once, about 150 clips). F1 uses the phone voice only for English text; Roman Urdu is never read by an English voice (it mispronounces it), so F1 shows a "listen in Urdu: coming soon" note instead. Recording and review: WBS 6.5 (Daniyal), ~2 days |
| Accessibility settings (text size, contrast, easy read, reduce motion) | FR-97 | ✅ | F2 | Text size and reduce motion come free from the OS in F1 |
| Avatar builder | FR-30 | ✅ (simple) | F2 | Preset parts only |
| Room objects, reputation, relationship ranks | FR-31 | ❌ post-MVP | — | |
| Try-a-day simulations | FR-29 | ❌ post-MVP (1 demo sim if time allows) | — | |
| Offline outbox and sync | FR-34–39 | ✅ | F1 | |
| Provisional offline result | FR-49 | ✅ | F2 | |

### 2.2 Results and guidance

| Feature | Requirement | MVP | When |
|---|---|---|---|
| **Class 9–10 → Intermediate stream** | FR-50 | ✅ | F1 |
| **Class 8 → Matric group** | FR-50 | ✅ | F2 |
| **Class 11–12 → university fields + stream fit check** | FR-50, FR-99 | ✅ | F2 |
| O-Level / A-Level mode | FR-50, FR-104 | ✅ | F2 |
| **Technical, vocational, health and professional paths** (Matric Technical, DAE, TEVTA/NAVTTC, engineering technology, nursing, pharmacy, CA/ACCA and others) | FR-50, `streams.json` 1.2.0 | ✅ | F1 (class 9–10 paths), F2 (class 8 and 11–12) |
| **Current-group fit check + routes (re-take class 9, switch, additional subject)** | FR-99 | ✅ | F2 |
| Class check-in when promoted or repeating | FR-101 | ✅ | F2 |
| Eligibility rules engine with doors | FR-45 | ✅ | F1 |
| Top-3 cards, bands, confidence, Plan B, "Why this?" | FR-46, FR-51–56 | ✅ | F1 |
| Blueprint slides | FR-52 | ✅ (5 slides) | F2 |
| Stream library (offline) | FR-60, FR-65 | ✅ (streams only) | F1 |
| Career pages from O*NET | FR-61 | ✅ (cached, top 50 careers) | F2 |
| Share link and the Urdu/English parent page | FR-66–68 | ✅ | F2 |
| Parent view of several children (browser-only list) | FR-105 | ✅ | F2 |
| Parent PDF export | FR-69 | ❌ post-MVP | — |
| Scoring baselines: rules + congruence | FR-44 | ✅ | F1: congruence; F2: + rules (AHP) |
| M1 Thurstonian IRT | §12.6 | ✅ research (notebook in F1, production scorer in F2) | |
| M2 Rasch | §12.6 | ✅ research (on pilot data) | F2 |
| M3 learned ranker (LightGBM + SHAP) | §12.6 | ✅ **research experiment only**; production uses it only if it passes ADR-0006 | F2 |
| M4 LLM explanations | §12.6 | ❌ post-MVP | — |

### 2.3 School and admin

| Feature | Requirement | MVP | When |
|---|---|---|---|
| Teacher dashboard: roster, progress, flags, CSV | FR-71–78 | ✅ (roster, flags, CSV) | F2 |
| Staff login with MFA and password reset | FR-71, FR-106 | ✅ | F2 |
| Schools with many classes; teachers linked to several classes | FR-78, FR-80 | ✅ | F1 (data), F2 (screens) |
| Class-level charts | FR-75 | ❌ post-MVP | — |
| Admin: schools, classes, codes | FR-80 | ✅ as **scripts** in F1, simple screens in F2 | |
| Content-pack upload and activation | FR-81 | ❌ post-MVP (packs are bundled with the app) | — |
| Model registry | FR-82 | ✅ (a table + script) | F2 |
| Audit log | FR-83 | ✅ | F1 |
| Retention and deletion jobs | FR-84, FR-10 | ✅ | F2 |
| Research export (de-identified) | FR-85 | ✅ | F2 |
| Counsellor labelling tool | FR-79 | ✅ (a simple web form) | F2 |

### 2.4 Non-functional essentials

The MVP must meet all of these: NFR-22–28 (accessibility basics), NFR-31–35 (no data loss), NFR-36–47 (security and privacy), NFR-59–60 (no single verdict), NFR-63–74.

Performance targets (NFR-04–13) are measured on the reference low-end device from FYP-1 onward.

Also required in the MVP:
- NFR-77 (CORS);
- the research-only gender table for the fairness audit (`research_demographics`);
- the DPIA, privacy policy and consent forms before the pilot.

**Deferred:** NFR-16 (iOS), NFR-56 (more languages), NFR-68 (Play Integrity).

## 3. Timeline (re-planned 9 Nov 2026)

| Sprint | Dates | Increment |
|---|---|---|
| S1 | 2–13 Nov 2026 | Monorepo, CI, FastAPI skeleton, schema v1, join + consent-slip seed, Expo shell with theme and onboarding (with field help). **Ethics application package** (forms, Urdu reviews, DPIA, protocol) |
| S2 | 16–27 Nov | Week loop + inkjs; prologue and Week 1; outbox + `/events:batch`; V1 simulation part 1. **Ethics application submitted** when the package is complete |
| S3 | 30 Nov–11 Dec | Planning task end to end first, then logic and numerical (button modes); congruence scorer + eligibility rules; vertical-slice playtest; **re-estimate the other task families from the planning task's real time** |
| S4 | 14–25 Dec | **FYP-1 demo (weeks 17–18; exact day set by the department) on the demo slice:** join with a class code and consent slip, prologue and Week 1, the planning task, sync, and a class 9–10 top-3 with "Why this?" from verified gates. Then weeks 2–4 (short, F1 script done 18 Dec); the letter · **Checkpoint 1** |
| S5 | 4–15 Jan 2027 | Rest of F1: logic and numerical tasks, stream library, English read-aloud; hardening on the reference phone; fault, load and monkey tests; report chapters (FYP-1 submission) |
| Break | 18–29 Jan | Semester exams and break (half capacity): buffer for FYP-1 spill-over, V1 write-up |
| S6 | 1–12 Feb | Spatial, abstract and verbal tasks; Urdu UI; class 8, 11–12 and O/A-Level modes; technical paths for every class; F2 Ink script (3 scenes a week) |
| S7 | 15–26 Feb | Group fit check and routes; class check-in; parent page (several children); teacher dashboard with staff login, MFA, reset and the consent-slip screens; PIN profiles; Blueprint; avatar; accessibility settings. **Usability round 1** (22–26 Feb). **Ethics approval needed by 15 Feb** · **Feature freeze 26 Feb** · **Checkpoint 2** |
| S8 | 1–12 Mar | **Pentest on the frozen build**; resilience run; staging, production and backups; consent-form drives start in the schools |
| S9 | 15–26 Mar | **Fix sprint** (pentest, usability round 1, resilience findings); **pilot build 26 Mar**; school onboarding and teacher training |
| S10–S12 | 5 Apr–14 May | **Pilot in 3–4 schools, classes 8–10** (6 weeks, ending before Eid al-Adha, about 16 May): 4 play weeks, supervised Mini-IP sessions, retest after 2 weeks, **usability round 2** (12–16 Apr), panel labelling |
| S13 | 17–28 May | Psychometrics: M1 recalibration (cross-validated), M2 Rasch, V2–V6 analysis; soak and chaos tests |
| S14 | 31 May–11 Jun | M3 comparison (rules vs congruence, learned ranker), fairness audit, V8; final report chapters |
| Final | 14–25 Jun | Final report, test reports, demo; one buffer week before submission |

**Checkpoints.** At each checkpoint the team compares hours spent with the plan (the issue estimates on the GitHub board). If the work is more than one week behind, the next item in §4 is cut at once.

## 4. Cut order if we fall behind

Drop items in this order, **starting with 1**. Never drop the core.

1. Avatar builder, Blueprint slides, O*NET career pages and value moments (about 65 h; keep a default avatar, the results list and the stream library)
2. Learned-ranker experiment and the provisional offline result (about 50 h; congruence vs rules stays as the model comparison, results arrive after sync)
3. Urdu recorded audio and the verbal task (about 45 h; keep the phone's Urdu voice and 5 task families)
4. Counsellor labelling tool (use a spreadsheet)

**Already cut (9 Nov 2026):** individual sign-up with parent OTP (moved to post-MVP).

**Core, never dropped:**
- the week loop with 4 weeks and 3+ task families;
- **every class mode: class 8, 9–10, 11–12 and O/A-Level**;
- the technical and vocational paths;
- results with reasons and Plan B;
- school-path consent, including adult self-consent;
- offline sync;
- the parent link;
- the security basics;
- the validation and fairness studies the CCP evidence depends on (V1–V6 in `SCIENTIFIC_BASIS.md`, run on classes 8–10).

## 5. Post-MVP (after June 2027)

- individual sign-up with parent OTP (designed in `openapi.yaml` and RFC-0004);
- validation of the class 11–12 and O/A-Level modes;
- in-app adaptive pair selection (unless V1 justifies it earlier);
- Try-a-day simulations;
- room and reputation features;
- content-pack downloads;
- parent PDF;
- class charts;
- the LLM explanations;
- Play Integrity;
- iOS;
- more languages;
- the public website and store launch.
