# Rahyaab screens and navigation (v2.1, 5 Nov 2026)

Every screen, per user, with what it does. Screen IDs are the **same as SRS §6** (S- student app, P- parent, D- dashboard, A- platform admin) and are used in issues and test cases.

**Related documents:**
- requirements: `SRS.md` (v1.2);
- edge cases: `EDGE_CASES.md`;
- form and error rules: `design/specs/forms-and-errors.md`;
- drawn screens: `design/screens/`;
- game: `design/game/GAME_DESIGN.md`;
- visual style, tokens and components: `design/` (brand, tokens, specs, previews).

The v1 numbering of 31 Oct (S-01–S-36, T-, X-) is retired; the mapping is at the end.

## The game in one paragraph

**"Your Year"** opens with Hudhud the hoopoe bringing a sealed letter from you, five years from now; most of it is smudged. The student lives one school year as themselves in a Pakistani city, a week at a time (about 5 minutes each):
- they **plan the week** by picking 3 of 6 activities;
- they play three short **scenes**, each with two **Dil vs Duniya** choices and sometimes an untimed **everyday task**;
- they face one small **value dilemma**;
- every Sunday the **diary** shows what happened, and more of the letter becomes readable. That is the model's real certainty, and it can blur again.

After 4 weeks the letter opens as the **Blueprint**, followed by optional **"Try a day"** job simulations. Nothing is called a test, question or score.

---

## 1. Student app (mobile, Android first)

### Navigation

- **Bottom tabs:** **Home · Explore · Family · You**.
- **Full-screen stacks** (no tabs): the week player, the Blueprint and onboarding.
- **Icons:** Lucide, always with a label.
- **Themes:** light and dark.

### 1.1 Get started (first launch)

| ID | Screen | Contents | Notes |
|---|---|---|---|
| S-00 | Splash and loading | Splash (Hudhud lands on the branch, 1.5 s); S-00b long loading while the Blueprint is built, with what is happening and the barred meter. No spinner without words |
| S-01 | Language | English / اردو tiles; changeable later | |
| S-02 | Welcome | Branch logo, "Play your year. Find your raah.", up to 3 cards (Hudhud and the letter · plan your week · "No right answers. No clock."), privacy in one line | Hudhud waving |
| S-03i | Join without a code (**post-MVP**, cut 9 Nov 2026; not linked from S-03) | Individual path: the parent's mobile number for an OTP consent link; "I'm 18 or older" for self-consent (FR-03, FR-100) |
| S-03 | Join | **Class code**, nickname, class 8–12, birth month and year (neutral age gate; soft check for unusual class and age). The consent-slip code is entered on S-04, not here: the server answers a wrong class code and a wrong slip code the same way, so one form could not say which was wrong. A typed age never grants consent: 18+ self-consent needs a Form C recorded by the school (`AGE_ASSURANCE.md`) | No name, phone, email, CNIC or photo from students. **S-03e** shows the field-help states: format hint, error with fix and example, nickname warning, a help card after 2 failures (FR-102) |
| S-04 | Family OK slip (redesigned 14 Nov 2026 for the school consent path) | How the paper form works; the **claim code** from the recorded slip (`XXXX-XXXX`, `POST /consents:claim`); "I'll do it later". Reached after joining and from the Home banner | No gameplay data leaves the phone until consent. The student can look around while waiting. The old WhatsApp family link belonged to the individual path (post-MVP) |
| S-05 | Profile | Nickname, optional PIN (prompted on a shared phone), board, current group (class 9–12) or O-Level, district, optional marks | Every field skippable except class and board |
| S-06 | Avatar | Shape-and-colour builder: skin tones, hair, hijab/dupatta/cap/none, glasses, outfit colours; theme Light / Dark / System | No photos; nothing locked |

### 1.2 Home tab

| ID | Screen | Contents |
|---|---|---|
| S-07 | Home | Greeting, **Week N of 4**, this week's 3 slots, one **Continue** button (terracotta), letter preview, the room, Hudhud note |
| S-21 | The letter | The letter from future you at its current readability, with one plain line on what that means |
| S-22 | City map (R2) | Optional places (dhaba, market, clinic, workshop, library) for short encounters |
| S-27 | Notifications | Only decision-time reminders (Matric results, admission windows, entry-test dates) and family-link status. Opt-in, at most 1 per week |

### 1.3 The week (full-screen stack from Home)

| ID | Screen | Contents |
|---|---|---|
| S-08 | Week player | **Planner** (6 activities, pick 3, energy dots, friends' plans as hints, **Lock my week**) → **scenes** (chat-style dialogue, 2 Dil/Duniya choice cards in terracotta and teal, a reaction tap: meh / okay / loved it) → **tasks** inside scenes (untimed; story outcome only; "Ask a friend" always available; a 20 s calibration warm-up before the first task of a sitting) → **value moment** → **story beat**. Pause anytime (saved) |
| S-09 | Sunday diary | Recap, one callback to an earlier choice, the letter sharpening (or blurring), "Saved. Next: Week N+1", break nudge |
| S-28 | Paused / offline | "Saved on your phone. We'll sync when you're online." |

### 1.4 Blueprint (after Week 4, once the model is sure enough)

| ID | Screen | Contents |
|---|---|---|
| S-10 | Blueprint | The letter opens. **Seven slides:** your year in numbers · archetype and 3 traits · 3 moments that shaped it · top 3 paths · "in 10 versions of you, 6 fit…" · Plan B and doors · share card. **Then the plain report:** top 3 with fit bands, reasons, confidence, doors (open / extra step / closed, with the rule source), entry reality, Plan B, interest and task-strength bars, what you value, next steps, disclaimer |
| S-11 | Why this? | The choices and tasks that contributed most, ability bands, rules applied, confidence in words ("fairly sure") |
| S-10c | Is your group right for you? | Classes 9–12. The fit of the current Matric group or Intermediate stream; good open paths first. If a better fit is behind a closed door: routes (stay, switch now, re-take class 9, extra subject), each with its cost and rule source. Then talk to family and ask a teacher (FR-99) |
| S-14 | Share with family | Preview of exactly what the parent sees; create a link (expires in 30 days, revocable); WhatsApp via the share sheet; share card image with no name or personal data |
| S-17 | History | Past Blueprints; a new term after 3 months; "what changed" |

### 1.5 Explore tab

| ID | Screen | Contents |
|---|---|---|
| S-12 | Stream library | Search; paths by level (Matric groups, Intermediate streams, A-Level bundles, technical, university fields); "Your matches first" |
| S-13 | Stream detail | Subjects per board, duration, entry tests (MDCAT, ECAT, NET, NTS), minimum marks, cost range (labelled estimate), doors, Plan B, careers, a role-model story, **Try a day** |
| S-16 | Career detail | What the work is like, skills, where it's studied in Pakistan; O\*NET content, localised, with attribution |
| S-24 | Your path (steps) | Steps from where you are to a chosen path: strengths you have, free lessons, a small project, test prep; tick off steps |
| S-23 | Try a day (R2) | 3–4 minute job simulations (clinic triage, solar wiring, debug a game, run the stall, design a poster, debate case, fix a motorbike, teach fractions), each ending with two reflection taps |
| S-15 | Saved | Saved paths and careers |

### 1.6 Family tab

| ID | Screen | Contents |
|---|---|---|
| S-25 | Family | Linked parent(s) and consent status, invite another (QR / code), what they can see, stop sharing |

### 1.7 You tab

| ID | Screen | Contents |
|---|---|---|
| S-18 | You and settings | Avatar, class, board. **Look:** theme, text size, reduce motion. **Language.** Notifications (off by default). Research opt-in (off). Download my data. Delete my data. Sign out (wipes local data) |
| S-19 | Profiles and PIN | Several students on one phone; switch with PIN |
| S-26 | School | Join a class with a code; leave the class |
| S-29 | Re-link profile | Restore on a new phone with a teacher re-link code or the family link |
| S-31 | Class check-in | Confirm your class, group and "my situation" (repeating, private, returning, changed board, O/A Level, DAE). Paths update; results are kept as history (FR-101, FR-104) |
| S-20 | Help | How it works, how results are made (plain words), talk to a teacher, helpline links in a calm "need to talk to someone?" section |

---

## 2. Parent (no app; a secure web link, mobile-first)

| ID | Screen | Contents |
|---|---|---|
| P-01 | Family report | The child's top paths in plain Urdu/English, reasons, honest entry odds, cost and duration ranges, Plan B, a "talk about it together" checklist, disclaimer. Branch logo only; no mascot |
| P-01b | My children | A parent's saved children on this phone only (opt-in), with a switcher; expired links shown as "ask for a new link" (FR-105) |
| P-02 | Consent and manage | Who is asking, what the app does, exactly what is collected; **Allow / Don't allow**; later: withdraw consent, request deletion, change language |
| P-03 | PDF / image | One-page WhatsApp-friendly version, readable in greyscale |
| P-04 | Upgrade (future) | Detailed family PDF or a counsellor session; outside SRS v1.1 scope (see §5) |

---

## 3. Teacher / counsellor and school (web dashboard)

| ID | Screen | Contents |
|---|---|---|
| D-01 | Log in | Email + password + one-time code |
| D-02 | Classes | List of classes, completion %, flags count, invite code per class |
| D-03 | Class roster | Students (nicknames + roll codes), status per week, top path, confidence, flags ("mixed signals", "not started"); filters |
| D-04 | Student summary | One page: Blueprint paths, reasons, confidence, doors, notes; print or PDF for a parent meeting |
| D-05 | Class insights | Distribution of top paths; average interest profile (cells under 5 students hidden) |
| D-06 | Notes | Short notes per student, visible only to staff of that school |
| D-07 | Export | CSV (UTF-8 with BOM) of the roster and bands |
| D-08 | Panel labelling (research) | Blinded cases for counsellor labels (M3) |
| D-09 | School setup and teachers | School name, city, board(s); invite and remove teachers; assign classes |
| D-10 | School reports | Participation and path mix across classes (aggregated; no individual data by default) |
| D-11 | Consent records | Which students have family consent, and how it was given |
| D-12 | Data settings | Retention period, export, delete school data |

## 4. Platform admin (the team, web)

| ID | Screen | Contents |
|---|---|---|
| A-01 | Schools and classes | Create schools and classes; generate and rotate class codes; assign teachers |
| A-02 | Content packs | Upload, validate, diff and activate the compiled Ink story, task banks, framework files and streams/rules (each rule with its source and date, e.g. the IBCC change) |
| A-03 | Models | Scoring and recommender versions, evaluation reports, activate or roll back |
| A-04 | Audit log | Who accessed what, when |
| A-05 | Data requests | Export and deletion requests; retention job status |

---

## 5. Payment and plans (future; outside SRS v1.1 scope)

**Research basis:** Pakistani competitors sell a free taster plus a paid report or counsellor session (CareerCoachs PKR 1,700). Schools buy B2B, and parents decide. Students are minors, so **the parent or school pays, never the teen alone**.

| Plan | Who pays | What's in it |
|---|---|---|
| **Free** | — | The whole game, the Blueprint, top 3 + Plan B, Explore, family report. The core is never paywalled |
| **Family report+** (one-time, [PRICE] PKR) | Parent via P-04 | Detailed family PDF in Urdu/English, a new term after 3 months with comparison |
| **Counsellor session** ([PRICE] PKR) | Parent | A 30-minute call with a partner counsellor, who receives the Blueprint (with consent) |
| **School** (per seat per year, [PRICE]) | School | Dashboard, class reports, bulk invites |

**Methods:**
- Digital goods inside the Android app must use **Google Play Billing**.
- Human services and school invoices may use **JazzCash / Easypaisa / card** through a Pakistani gateway on the parent web link.
- Confirm current Play policy before launch.

**No dark patterns:** no countdowns, no fake discounts, a clear refund policy.

**FYP scope:** not built in the FYP; the free core is the product.

---

## 6. Key flows

1. **First run:** S-01 → S-02 → S-03 → S-04 (family gets P-02) → S-05 → S-06 → prologue in S-08 → S-07.
2. **A week:** S-07 → S-08 (planner → 3 scenes with tasks → value moment → story beat) → S-09 → S-07.
3. **Results:** after Week 4, S-09 → S-21 (the letter opens) → S-10 → S-11 → S-14 (send to family → P-01).
4. **Explore:** S-10 → S-13 → S-24 → S-23.
5. **School:** D-02 invite code → student S-26 → D-03 progress → D-04 summary at a parent meeting.

---

## 7. Mapping from the retired v1 IDs

| v1 (31 Oct) | v2 / SRS |
|---|---|
| S-01 Welcome · S-07 How it works | S-02 Welcome |
| S-02 Sign up · S-03 Verify · S-09 Log in | S-03 Join (no phone, OTP or password for students) · S-29 Re-link |
| S-04 Family consent · S-32 Family | S-04 · S-25 |
| S-05 About you · S-06 Make it yours | S-05 · S-06 |
| S-08 Calibration · S-12 Year map · S-13 Plan your week · S-14 Scene · S-15 Task | S-08 Week player |
| S-10 Home · S-11 Notifications | S-07 · S-27 |
| S-16 Week wrap · S-17 Paused | S-09 · S-28 |
| S-18 Blueprint reveal · S-19 Your paths | S-10 Blueprint |
| S-20 Why this? · S-21 Share · S-22 History | S-11 · S-14 · S-17 |
| S-23 Explore home · S-24 Stream detail · S-25 Career detail | S-12 · S-13 · S-16 |
| S-26 Your path · S-27 Try a day · S-28 Saved | S-24 · S-23 · S-15 |
| S-29–S-31 You, Look, Language · S-33 School · S-35 Privacy · S-36 Help | S-18 · S-26 · S-18 · S-20 |
| S-34 Plan | P-04 (future) |
| P-01 Consent · P-02 Family report · P-03 Stream guide · P-05 Manage | P-02 · P-01 · P-01 · P-02 |
| T-01–T-08 | D-01–D-07 |
| A-01–A-06 (school admin) | D-09–D-12 |
| X-01–X-05 (platform admin) | A-01–A-05 |

## 8. Tablet and responsive layouts

On tablets (≥ 600 px wide):
- the bottom tabs become a **side rail**;
- cards sit in **two columns**;
- text keeps a readable line length.

Drawn examples: T-07 (Home) and T-10b (Your paths) in `design/screens/`. The rules for every breakpoint (compact < 360, phone, tablet ≥ 600, desktop ≥ 1024) are in `design/specs/responsive.md`. The dashboard is desktop-first and stays usable at 768 px.
