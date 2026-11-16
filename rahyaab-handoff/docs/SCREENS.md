# Rahyaab screens and navigation (v1, 31 Oct 2026)

Every screen, per user, with what it does. Visual style: `docs/DESIGN_SYSTEM.md`. Requirements: `docs/SRS.md`. Screen IDs (S-xx, P-xx, T-xx, A-xx, X-xx) are for issues and test cases.

## The game in one paragraph

**Your Year** is a life simulation. The student plays one school year as themselves in a modern Pakistani city. Each in-game week (about 5 minutes) they **plan their week** by picking 3 of 6 activities (clubs, side gigs, shadowing, hangouts). Each activity plays as a short **scene** with characters and **inner voices** (two perspectives, such as "what I'd enjoy" and "what's expected"; never good vs bad). Some scenes hide an untimed **task** inside the story: rotate a robot part (spatial), price a thrift stall (numbers), fix a bot's route (logic), plan a fundraiser (planning). A **"Rahyaab knows you"** meter fills as the model becomes surer, so progress means "your results are getting more reliable", not a score. After about 4 weeks the **Blueprint** unlocks, and the year continues with optional **Try-a-day** sims. Nothing is called a test, question or score.

---

## 1. Student app (mobile, Android first)

### Navigation

Bottom tabs: **Home · Play · Explore · You**. The onboarding and Blueprint flows sit outside the tabs, as full-screen stacks.

### 1.1 Get started (first launch)

| ID | Screen | Contents | Notes |
|---|---|---|---|
| S-01 | Welcome | Logo, one line ("Play your year. Find your path."), **Get started**, "I have an account" | Language chip (English / اردو) top right |
| S-02 | Sign up | Phone number **or** school invite code; nickname; grade (9–12); password; terms in plain words | No CNIC, B-form or photo. A school code links the student to a class |
| S-03 | Verify | OTP code (6 digits), resend after 30 s | SMS OTP via provider |
| S-04 | Family consent | Parent's phone number → we send them a link; status "Waiting for Mama/Baba" | Under-18 rule: **no gameplay data is stored until consent**. Teens can browse Explore while waiting |
| S-05 | About you | Board (FBISE / Punjab / Sindh / KP / Balochistan / Cambridge), current group if Grade 10–12, city, optional marks | Every field skippable except grade and board |
| S-06 | Make it yours | Avatar (shape and colour builder, no photos), theme Light / Dark / System | |
| S-07 | How it works | Three cards, swipeable: Plan your week · Live the scenes · Get your Blueprint. "No right answers. No clock." | Shown once; reachable again from You |
| S-08 | Calibration | 20-second "tap the moving dot" warm-up | Measures touch latency for fairness on cheap phones; framed as "get comfy with the controls" |
| S-09 | Log in | Phone/code + password, "Forgot password" (OTP reset) | |

### 1.2 Home tab

| ID | Screen | Contents |
|---|---|---|
| S-10 | Home | Greeting, **Week N of your year**, this week's plan, one **Continue** button (Coral), "Rahyaab knows you" meter, Blueprint status, "Paths to peek at" |
| S-11 | Notifications | Only decision-time reminders (Matric results, admissions windows, entry-test dates) and family-link status. Weekly cap of 1, opt-in |

### 1.3 Play tab (the game)

| ID | Screen | Contents |
|---|---|---|
| S-12 | Your Year map | Weeks as a vertical timeline; current week highlighted; completed weeks show their activities |
| S-13 | Plan your week | Pick 3 of 6 activities, energy dots, friends' plans as flavour text, **Lock my week** |
| S-14 | Scene | Characters, chat-style dialogue, **inner voices** choice, optional hidden task; pause anytime (saves) |
| S-15 | Task (inside a scene) | Rotate / arrange / price / route; untimed; neutral feedback ("Clicked in"); adaptive difficulty behind the scenes |
| S-16 | Week wrap | Short recap of what you did, meter growth, what unlocks next. Honey reward moment only on unlocks |
| S-17 | Paused / offline | "Saved on your phone. We'll sync when you're online." |

### 1.4 Blueprint (unlocks after about 4 weeks)

| ID | Screen | Contents |
|---|---|---|
| S-18 | Blueprint reveal | Archetype name and line ("The Builder"), 3 trait chips, one Honey reveal animation |
| S-19 | Your paths | Top 3 streams with words and 5-segment bars, **Plan B**, eligibility doors (open / extra step / closed, with the rule source) |
| S-20 | Why this? | 2–3 plain reasons from the model's explanation ("You chose building and fixing 7 times"), plus confidence ("Rahyaab is fairly sure") |
| S-21 | Share | Share card image (no name or personal data) and **Send to family** |
| S-22 | History | Past Blueprints over time (retake after 3 months) |

### 1.5 Explore tab

| ID | Screen | Contents |
|---|---|---|
| S-23 | Explore home | Search, streams (Matric groups, FSc Pre-Med, Pre-Eng, ICS, I.Com, FA, General Science, DAE, O/A Levels), "Your matches first" |
| S-24 | Stream detail | Subjects, what it leads to (degrees), entry tests (MDCAT, ECAT, NET, NTS), minimum marks, real costs ([fill from sources]), Plan B routes |
| S-25 | Career detail | What the work is like, skills, where it's studied in Pakistan; content from O\*NET Web Services, localised, with attribution |
| S-26 | Your path (skill gap) | Steps from where you are to the stream: strengths done, then free lessons, a small project, test prep. Tick off steps (Template-04 commitment) |
| S-27 | Try a day | Optional 2-minute sims: ER triage, bridge build, debug a bot, balance a ledger, newsroom deadline |
| S-28 | Saved | Saved streams and careers |

### 1.6 You tab

| ID | Screen | Contents |
|---|---|---|
| S-29 | You | Avatar, grade, board; links to all below |
| S-30 | Look | Theme Light / Dark / System, text size, reduce motion |
| S-31 | Language | English / اردو (whole UI; Nastaliq) |
| S-32 | Family | Linked parent(s), invite another, stop sharing |
| S-33 | School | Join a class with a code, leave class |
| S-34 | Plan | Free or Plus (see Payment); "Ask family to upgrade" |
| S-35 | Privacy and data | What we collect (plain list), download my data, delete account (with a cooling-off week) |
| S-36 | Help | FAQ, contact, report a problem, "talk to someone" (helpline links for distress) |

---

## 2. Parent (no app install; a secure web link, mobile-first)

| ID | Screen | Contents |
|---|---|---|
| P-01 | Consent request | Who is asking, what the app does, exactly what data is collected, **Allow / Don't allow**; OTP to the parent's phone |
| P-02 | Family report | Child's top paths in plain words (Urdu/English), reasons, "talk about it together" prompts |
| P-03 | Stream guide | Costs, entry tests, careers, Plan B for each recommended stream |
| P-04 | Upgrade (payment) | Plus plan or a counsellor session; parent pays (see Payment) |
| P-05 | Manage | Revoke consent, delete the child's data, change language |

---

## 3. Teacher / counsellor (web dashboard)

| ID | Screen | Contents |
|---|---|---|
| T-01 | Log in | Email + password, 2-step verification optional |
| T-02 | Classes | List of classes, invite code per class |
| T-03 | Class overview | Started / Blueprint ready / worth a chat; stream mix of the class; progress |
| T-04 | Students | Table with progress, top path, flags ("mixed signals", "not started") |
| T-05 | Student summary | One page: Blueprint, reasons, confidence, notes; print or PDF for a parent meeting |
| T-06 | Notes | Private counsellor notes per student |
| T-07 | Reports and export | CSV / PDF per class |
| T-08 | Settings | Profile, password, language |

## 4. School admin (web dashboard, "School" section)

| ID | Screen | Contents |
|---|---|---|
| A-01 | School setup | Name, city, board(s), logo |
| A-02 | Teachers | Invite and remove teachers, assign classes |
| A-03 | Seats and billing | Plan, seats used/available, invoices (bank transfer / card) |
| A-04 | School reports | Participation and stream mix across classes (aggregated, no individual data by default) |
| A-05 | Consent records | Which students have family consent |
| A-06 | Data settings | Retention period, export, delete school data |

## 5. Platform admin (your team, web)

| ID | Screen | Contents |
|---|---|---|
| X-01 | Content: streams and rules | Eligibility rules with sources and dates (for example the IBCC change), Plan B routes |
| X-02 | Content: careers | O\*NET import and local edits |
| X-03 | Content: story | Weeks, activities, scenes, inner-voice lines, tasks (versioned) |
| X-04 | Models | Scoring and recommender versions, evaluation metrics, roll back |
| X-05 | Schools and users | Support tools, audit log |

---

## 6. Payment and plans

Research basis: Pakistani competitors sell a free taster plus a paid report or counsellor session (CareerCoachs PKR 1,700; Eduvision PKR 4,000); schools buy B2B; parents decide. Students are minors, so **the parent or school pays, never the teen alone**.

| Plan | Who pays | What's in it |
|---|---|---|
| **Free** | — | The whole game, Blueprint, top 3 + Plan B, Explore, family report. The core is never paywalled |
| **Plus** (one-time, [PRICE] PKR) | Parent via P-04 | Detailed family PDF in Urdu/English, Try-a-day sims, 3-month retake with comparison |
| **Counsellor session** ([PRICE] PKR) | Parent | A 30-minute call with a partner counsellor, who receives the Blueprint (with consent) |
| **School** (per seat per year, [PRICE]) | School | Teacher dashboard, class reports, bulk invites, all Plus features for students |

**Methods:**
- Digital goods inside the Android app must use **Google Play Billing**.
- Human services (counsellor sessions) and school invoices may use **JazzCash / Easypaisa / card** through a Pakistani payment gateway on the parent web link.
- Confirm current Play policy before launch.

**Screens:** P-04 (choose plan), checkout (provider page), receipt, and S-34 "Ask family to upgrade" for the student. No dark patterns: no countdowns, no fake discounts, a clear refund policy.

**FYP scope:** payment is **Could have**. Build the plan screens and a sandbox checkout in FYP-2 only if time allows; the free core is the product.

---

## 7. Key flows

1. **First run:** S-01 → S-02 → S-03 → S-04 (parent gets P-01) → S-05 → S-06 → S-07 → S-08 → S-10.
2. **A week:** S-10 → S-13 → S-14 (+ S-15) × 3 → S-16 → S-10.
3. **Results:** after week 4, S-16 → S-18 → S-19 → S-20 → S-21 (send to family → P-02).
4. **Explore:** S-19 → S-24 → S-26 → S-27.
5. **School:** T-02 invite code → student S-33 → T-04 progress → T-05 summary in a parent meeting.
