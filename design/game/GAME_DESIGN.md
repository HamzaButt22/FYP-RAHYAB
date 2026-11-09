# Rahyaab: Game Design Document (final, v3, 4 Nov 2026)

**Product:** Rahyaab, a career guidance app for Pakistani students in **class 8–12 (ages about 13–18; a class-8 student under 13 cannot sign up)**. Students play one story game, "Your Year". From how they play, the app estimates their interests, abilities and work values. It then recommends an education stream or field, with a Plan B, for the student and their family to discuss.

**Rule:** game-based assessment. There are no questionnaires in the student app; the only self-report element is the optional one-tap "meh / okay / loved it" reaction after a scene (a 3-category rating, scored in M1).

**Related files:**
- `design/game/frameworks/` (machine-readable framework data: RIASEC, pairs, abilities, work values, streams and gates, scoring settings)
- `docs/` (SRS, project brief, research reports and notes)
- `design/brand/BRAND_GUIDELINES.md` (Branch logo, Hudhud mascot, terracotta and teal)
- `design/tokens/` (colours, type, spacing, breakpoints)
- `design/specs/` (components, responsive rules)

**Supersedes:** v1 (31 Oct) and v2 (3 Nov). Section 18 lists the changes applied to the SRS (now v1.1).

---

## Contents

1. Summary
2. Audience and needs
3. Market survey and positioning
4. Design pillars
5. Format decisions
6. Hook, story and structure
7. Characters and customisation
8. Mechanics
9. Content and writing
10. Art, sound, feel and technology
11. Assessment frameworks: what we measure
12. AI and ML models
13. Datasets
14. Data flow and training pipeline
15. Validation and research plan
16. Ethics, privacy and safety
17. Scope and milestones
18. Changes applied to the SRS (v1.1)
19. Open questions
20. Sources

---

## 1. Summary

| | Decision |
|---|---|
| **Game** | One 2D narrative life-sim, "Your Year", with tasks and job simulations inside the story. It is not a menu of separate mini-games. |
| **Hook** | Hudhud, the hoopoe, brings a sealed letter from you, five years from now. It becomes readable as the AI learns you. |
| **Length** | A prologue plus 4 weeks of about 5 minutes each. The first result comes after about 30 minutes, spread over several sittings. |
| **Measures** | **RIASEC interests** (core), **abilities** (6 task families modelled on ICAR item types), **work values** (O\*NET's six, secondary). Big Five is *not* used. |
| **ML** | **3 core models:** M1 interest estimation (Thurstonian IRT with adaptive scene choice), M2 ability estimation (Rasch/2PL IRT), M3 stream recommender (rules vs congruence vs LightGBM ranker with SHAP). **1 optional model:** M4, a self-hosted small LLM with LoRA that only rewrites explanations. |
| **Training data** | Open-Source Psychometrics RIASEC dataset (≈145,828 responses), O\*NET occupation data, ICAR as a design reference, our own consented pilot, and counsellor-labelled cases |
| **Output** | Top-3 streams with reasons and confidence, a Plan B, eligibility checks (e.g. Biology for MBBS), and a family report |

---

## 2. Audience and needs

**Who:**
- Pakistani students in class 8–12, **boys and girls alike** (gender is never used to choose a path), in every province, Urdu and English medium, public and private schools, cities, towns and villages, including technical-school, O/A-Level and private students.
- Most play on budget Android phones in the PKR 20,000–50,000 tiers (itel, Tecno, Infinix, Redmi), often shared with family.

**The decision each class faces:**

| Class | Decision | Gate examples |
|---|---|---|
| 8 | Matric group: Science (Biology), Science (Computer), Humanities, or Matric Technical where offered | Biology in Matric keeps medicine open |
| 9–10 | FSc Pre-Medical, Pre-Engineering, ICS, I.Com, FA/Humanities, General Science, **DAE and technical or vocational diplomas (TEVTA/NAVTTC)**, early nursing or allied health where offered, or A Level subjects; **plus a check that the current Matric group fits** | Pre-Med → engineering possible with Additional Maths. Medicine needs Biology: from the Matric group, by re-taking class 9 in that group, or as an additional subject where the board allows (**verify**) |
| 11–12 | University field and entry tests (MDCAT, ECAT, NTS, SAT), including **engineering technology, nursing and allied health, pharmacy, agriculture and veterinary, CA/ACCA, armed forces, hospitality, IT skills, and fine arts and fashion**; **plus a check that the current stream fits** | MBBS and BDS need 60% in FSc Pre-Medical plus MDCAT; engineering needs 60% in HSSC; ICS students are eligible for engineering |

**Joining midway, and exceptions.** The game's "year" is 4 play-weeks, so a student can start in any month. The class picked at join (and at later check-ins) sets the decision shown.

A student who joins in class 9 is guided toward the **Intermediate stream**, because 9 → 10 has no choice; the group carries on. They **also** see whether their current group fits. If a better path is behind a closed door, the app lists the real routes to it, with honest costs: switch while the board allows, **re-take class 9 in another group**, add the missing subject, or an alternative route. "Stay and do well where you are" always comes first, and costly routes are never pushed.

The app also handles:
- late and over-age learners (adults give their own consent);
- under-13s (a neutral stop);
- repeating, private, returning, O/A-Level, DAE and madrassa learners.

The full rules are in `docs/project/EDGE_CASES.md`.

**What the research says students and families need:**
- **Choices are made under pressure.** 69.5% of first-year MBBS students at one university named parental pressure as their main reason. About 140,000 candidates competed for roughly 22,000 MDCAT seats in 2025.
- **Parents decide.** 82.6% of students rely on parents, and about 30% are "clearly not allowed to choose". The family must be part of the product.
- **Structured assessment helps.** In a 2025 Pakistani study of 1,445 students, those counselled with psychometric testing reported more career-decision confidence than those given general guidance (Saya et al.).
- **Thinking about real work matters most.** In like2be, a career game tested with 809 students, *cognitive stimulation* predicted gains in job knowledge; enjoyment and flow alone did not. So the game must also make students think about real work (section 8.5).
- **What teens want:** to be treated as near-adults, short sessions, no test feeling, Roman Urdu / English, and their own culture on screen.

---

## 3. Market survey and positioning

| Product | What it is | Price | Gap Rahyaab fills |
|---|---|---|---|
| CareerCoachs (PK) | ~30-minute "AI psychometric" questionnaire in English, Urdu and Punjabi; counsellor upsell | Free test; PKR 1,700 session | A form, not a game; no published validation |
| Career Guidance PK (Play Store, Neuron Solutions) | Personality-based counselling app | Free | Questionnaire; personality-based, not interest/ability-based |
| Merafuture, Eduvision (PK) | Web aptitude and career questionnaires | Free / unclear | Web forms; no mobile game, no family view |
| Maqsad, Taleemabad, Sabaq, Edkasa (PK edtech) | Exam prep and learning | Freemium | No career assessment; likely partners, or a threat if they add one |
| Mindler (India) | 5-dimension battery of about 2.5 hours; school and parent sessions | ₹2,400–25,000+ | Long, Indian streams |
| YouScience Brightpath (US) | Up to 12 timed aptitude "brain games" plus interests | ~US$25–45 per student | US-only, timed, no action plan |

**Positioning: "Explore before you lock in."** No product in Pakistan is all of these:
- the only **game-first**, mobile-first stream advisor built for Pakistani streams and gates;
- **under 40 minutes**;
- **bilingual**;
- **bringing parents in**;
- with **published validation** (our pilot) instead of an unexplained "AI".

**Business model:**
- The student result is always free.
- A low-cost parent report or counsellor session, priced under PKR 1,700.
- School or NGO licences (B2B/B2G).

---

## 4. Design pillars

1. **It's my year, not a test.** Every input is an action in a story. No timers, scores or "correct".
2. **Honest AI.** The letter sharpens only as fast as the model's real certainty. It can blur again. Every result says why.
3. **Family is part of the story.** Parents are loving and anxious, never villains. The result is built to be talked about at home.
4. **Pakistani, Gen-Z, grown-up.** Local places, food, festivals and pressures. Dry humour. Never childish.
5. **Small and polished.** Finish a short game well, as a 3-person team can.

---

## 5. Format decisions

| Question | Decision | Why |
|---|---|---|
| Many mini-games or one game? | **One story game with tasks inside** | A menu of mini-games feels like a test battery and loses the *why* behind choices. A story without tasks can't measure ability. |
| Story type | **Fixed spine + reactive storylets** ("branch and bottleneck") | A fully dynamic world like RDR2's is out of scope, and it breaks measurement, because everyone must meet comparable choices. Memory and callbacks make it feel dynamic. |
| 2D or 3D | **2D portrait, illustrated, parallax** | Budget phones, download size, art time. Mood comes from light and layers, as in Thomas Brush's hand-drawn games. |
| Genre | **Narrative life-sim + light time management + "try a day" job simulations + small exploration map** | Life-sim fits the question "who am I becoming?". Simulations teach real work. |
| Puzzles | **Only as everyday in-world tasks** | Abstract puzzles feel like IQ tests. |
| Action/reflex | **None that is scored** | Speed isn't a career ability and is unfair on slow phones (device latency of 50–200 ms). |
| Questions | **Only dialogue choices**, plus one optional "meh / okay / loved it" tap | Keeps the game-only rule |
| Playable characters | **One: you**, customisable | The game measures *you* |
| Session | **About 5-minute weeks**, autosave, offline | Short attention, shared phones, school periods |

**What we borrow (mechanics only; all content is original):**

| Source | What we take |
|---|---|
| Thomas Brush | A first-minute hook, mood and a mystery |
| Stick A Round | Messy input becomes an object shaped like you: the Blueprint |
| Shouldermen | Two arguing inner voices: Dil and Duniya. Pre-written, not live AI |
| AI Learns To Drive | Watching an AI learn |
| RDR2 | A world that remembers |
| Persona / Citizen Sleeper | A calendar and a weekly time budget |
| Reigns | Bars bad at both ends |
| Florence / Unpacking | Meaningful everyday actions |

---

## 6. Hook, story and structure

### 6.1 Hook: a letter from future you

1. **Sunday night,** load-shedding, candlelight. Hudhud taps the window and drops a letter in *your* handwriting. Only "Dear me, by the time you read this…" is readable.
2. **Hudhud:** "I carry letters across long journeys. This one isn't finished, because you haven't decided who you are yet. Live your year. The ink will settle."
3. **Each Sunday** more words appear. **This is M1's real certainty.** If a choice surprises the model, a line blurs again ("Hmm, I was guessing").
4. **The Blueprint** is the letter opening: who you're becoming, your top paths, and Plan B as a "P.S.".

### 6.2 Structure

```
Prologue (5 min) → Week 1 → Week 2 → Week 3 → Week 4 → Letter opens (Blueprint) → Try-a-day job sims → new term (later)
```

| Part | Story beat (same for everyone) | Time |
|---|---|---|
| Prologue | The letter arrives; make your avatar; practice scene | 5 min |
| Week 1 | New term, clubs fair, meet the cast | 5–6 min |
| Week 2 | First test pressure; family dinner debate about "streams" | 5–6 min |
| Week 3 | Competition week (science fair, debate, sports or stall) | 5–6 min |
| Week 4 | Results day; the stream conversation at home | 5–6 min |
| Blueprint | The letter opens: 7 slides, then a plain report | 3 min |

**The year matches the student's real class** (section 2): the stakes and the decision in the final beat change; the spine doesn't.

### 6.3 The weekly loop

| Step | Player action | Evidence |
|---|---|---|
| Plan (Sunday) | Pick 3 of 6 activity cards (3 energy) | Ranking choice → interests |
| Scenes ×3 | Chat-style scene with **2 Dil vs Duniya** moments → sometimes a task → "meh / okay / loved it" | Forced-choice pairs → interests; task → ability; tap → intensity |
| Value moment (1 per week) | A small dilemma ("Uncle offers paid weekend work, or you help at the clinic for free") | Work values |
| Explore (optional) | Tap places on the city map | Weak interest signal; curiosity |
| Story beat | Fixed scene | — |
| Sunday diary | Recap, one callback, the letter sharpens | Shows M1 certainty |

### 6.4 Reactive world (the RDR2 feeling)

- **Memory:** Ink variables drive callbacks ("Zain still has the bracket you fixed").
- **Relationships:** 5 ranks per character, shown as icons; ranks unlock personal scenes.
- **Reputation tags** from the *pattern* of your actions ("the one who fixes things"), shown as stickers in your room. Never good or bad.
- **Your room fills with objects** from your choices: a soldering iron, a sketchbook, a ledger.
- **Never:** game over, wrong answers, moral scores, or locked content because of a choice.

---

## 7. Characters and customisation

| Who | Role | Note |
|---|---|---|
| **You** | Player | Name (nickname), pronoun, skin tone, hair, hijab, cap, glasses, outfit colours. No photos, no real names. |
| **Hudhud** | Guide and messenger | Chubby hoopoe (brand B2). Calm, witty older cousin. Never judges. |
| **Dil** | Inner voice: what you'd love | Warm, impulsive |
| **Duniya** | Inner voice: what's practical | Dry, careful. Argues for *different* interests in different scenes, so it is never simply "be a doctor". |
| Zain | Fixer | Robotics, bikes (R) |
| Bilal | Coder | Code jam (I/R) |
| Hira | Writer, debater | Magazine, debate (A/E) |
| Sara | Hustler | Thrift stall (E) |
| Dr Amna | Doctor, family friend | Clinic (S/I) |
| Ustad Karim | Workshop owner | Trades, DAE (R/E) |
| Ammi, Abbu | Parents | Loving, anxious |
| Nani | Grandmother | Humour, wisdom |

**Fairness:**
- Every activity is open to every gender.
- Measured content never changes by pronoun.
- A DIF check runs on the pilot (section 15).

---

## 8. Mechanics

### 8.1 Week planner

- **12 activities, 2 per RIASEC type.** The type tags are hidden from players.
- **Each week shows 6, rotated** so every type appears every week. Screen positions are randomised.
- Picking 3 is a ranking that M1 scores.

### 8.2 Scenes and Dil/Duniya choices

- **Each choice is a forced-choice pair of two RIASEC types.** Both options are attractive and both have a cost.
- **Coverage:**
  - Each activity scene holds **2 Dil/Duniya moments**, and each story beat holds 1. That's ≈7–8 choices a week and ≈30 over 4 weeks.
  - The planner adds 9 comparisons a week (3 picked × 3 not picked), 36 in total.
  - Together, all 15 type pairs appear at least twice and every type ten or more times.
  - The pair inside each scene variant is picked adaptively, so coverage holds whichever activities a player chooses. Every administered pair is logged, item parameters are fixed from calibration (so scores stay comparable across paths), and `pairs.json` caps how often any pair is shown (exposure control).
  - `design/game/frameworks/pairs.json` holds the target schedule.
- **No option glows, is paid, carries warnings, or can be rewound.**
- **The voices rotate** which interest they argue for. Which voice you follow is logged as autonomy vs conformity, for context only.

### 8.3 Everyday tasks (abilities)

Modelled on the **ICAR item families**, with our own content:

| Ability | ICAR family it follows | In-story task |
|---|---|---|
| Spatial | 3D rotation | Fit the robot bracket; pack the car boot |
| Abstract reasoning | Matrix reasoning | Complete the mehndi pattern / tile design |
| Numerical | Numerical reasoning | Split the chai bill; price the stall |
| Logic | Letter–number series / deduction | Who took the cricket bat? (clue grid) |
| Planning | (executive function) | Plan the class trip route; order the steps to set up the science-fair stall (familiar to every student; household-routine scenes like cooking are avoided because familiarity differs by family) |
| Verbal | Verbal reasoning | Which statement must be true from the notice-board message; which word completes the analogy; which reply answers the question asked (inference and meaning, not social judgement) |

**Rules:**
- Untimed, with no score shown.
- The first attempt is scored.
- Difficulty adapts (staircase).
- "Ask a friend" counts as missing data, not failure.
- Timing is logged for research only, with device calibration.

### 8.4 Work-value moments

4–6 small dilemmas, each trading two of **O\*NET's six work values**:
- **Achievement** (results);
- **Independence** (own way);
- **Recognition** (status, advancement);
- **Relationships** (people, service);
- **Support** (fair, supportive employer);
- **Working Conditions** (security, pay, conditions).

For example: "paid weekend job at the shop (Working Conditions) vs volunteering at the clinic (Relationships)".

### 8.5 "Try a day" job simulations (after the Blueprint)

3–4 minute hands-on slices of real work for the student's top paths.

| Path | Simulation |
|---|---|
| Medicine / allied health | Triage three patients at the clinic |
| Engineering | Wire a small solar setup for the shop during load-shedding |
| Computer science | Debug a friend's game |
| Business / commerce | Run the stall for a day |
| Arts / design | Design the school fair poster from a brief |
| Humanities / law | Build a debate case from three sources |
| Trades / DAE | Diagnose a motorbike at the workshop |
| Teaching / social | Help a younger kid with fractions |

**After each simulation:**
- **Reflection:** "What surprised you?" (pick one) and "What does this job need?" (drag 3).
- **The model is also checked:** "loved it but struggled" leads to a different conversation than "aced it, meh".

### 8.6 Blueprint (the letter opens)

Seven slides:
1. your year in numbers;
2. your archetype and three traits;
3. the 3 moments that shaped it;
4. top 3 paths with reasons;
5. "in 10 versions of you, 6 fit X best" (uncertainty as frequency: 10 draws of the six interest scores from their estimated uncertainty, each re-ranked; it describes how stable the result is, not the chance of success);
6. Plan B and what each path opens (degrees, tests, gates);
7. a shareable card and **Send to family**.

Then the plain report for parents and teachers.

---

## 9. Content and writing

| Item | Amount |
|---|---|
| Activities | 12 |
| Activity scenes | 24 (2 per activity) |
| Story beats | 6 |
| Dil/Duniya choices written | 48 in activity scenes (24 × 2) + 6 in story beats; each player meets ≈30 |
| Value dilemmas | 4–6 |
| Task families × levels | 6 × 4 |
| Job simulations | 4 (MVP) → 8 |
| Characters | 10 + Hudhud, 4 expressions each |
| Dialogue | ≈1,200–1,500 lines, Roman Urdu / English; English-only toggle |

**Tools:**
- Ink with the free Inky editor.
- Tags on each choice, e.g. `#pair:R-A #left:R #voice:dil`.
- A CI script checks pair coverage and tags.
- Every scene gets a "cringe check" by 2–3 real teens.

---

## 10. Art, sound, feel and technology

- **Art:**
  - 2D illustrated scenes in the brand palette, 3–4 parallax layers, warm light;
  - characters are simple shapes with expressive poses;
  - Hudhud from `design/brand/mascot`;
  - dark mode uses the `-dark` files (cream edge drawn as shapes, so `react-native-svg` renders it).
- **Animation:** Rive (`rive-react-native`) for Hudhud and the cast. Skia and Reanimated for tasks and parallax.
- **Sound:** optional lo-fi music with rabab and tabla, off by default; haptics on choices.
- **Stack:**
  - Expo / React Native app (already in the repo);
  - inkjs for the story;
  - Skia for tasks;
  - offline-first local store with an upload outbox;
  - FastAPI + PostgreSQL for scoring;
  - Python scoring engine.
- **Performance:** 60 fps on a 3–4 GB RAM Android, Play download ≤ 35 MB per device (SRS NFR-11), works offline after the first sync.

---

## 11. Assessment frameworks: what we measure

| Framework | Used? | Role | Why |
|---|---|---|---|
| **Holland RIASEC** (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) | **Yes, core** | Main input to the stream recommendation | Interests are fairly stable by the teenage years and predict school performance and persistence (Nye et al. 2012). RIASEC maps onto streams and onto every O\*NET occupation code. It's the framework of the O\*NET Interest Profiler, our validation benchmark. |
| **Cognitive abilities, ICAR-style** (spatial, abstract, numerical, logic, planning, verbal) | **Yes, core** | Second input; supports or cautions a path (e.g. strong spatial supports engineering) | Spatial and maths ability predict STEM outcomes. ICAR is public-domain and validated on about 97,000 people, so its item families give us a proven design. We write our own items and don't ship ICAR items (their data is for scientific use). |
| **O\*NET Work Values** (Achievement, Independence, Recognition, Relationships, Support, Working Conditions) | **Yes, secondary** | Explanations, tie-breaks between close paths, career suggestions within a stream | It's what students care about in a job. It matches O\*NET occupation value profiles and gives parents a language ("she values helping people"). It's not used for ranking in v1. |
| **Big Five / OCEAN** | **No** | — | It doesn't link reliably to stream choice. Inferring personality from game behaviour had invented weights in the prototype, and profiling minors' personality is a privacy risk. It may appear later as an optional research question only. |
| **Eligibility rules** (marks, subjects, council rules) | **Yes, hard gates** | Filters what can be recommended | PMDC, PEC, IBCC and board rules are binding facts, not preferences |
| Autonomy vs conformity (which voice you follow) | Context only | Shown in the family conversation guide, never scored | Useful for counselling and for parents |

### 11.1 Evidence map

| Observable | Construct | Scoring rule |
|---|---|---|
| Planner: 3 of 6 picked | RIASEC | Ranking → pairwise comparisons (picked > not picked) in M1 |
| Dil/Duniya pick | RIASEC | One binary forced-choice comparison between two types in M1 |
| Meh / okay / loved it | RIASEC intensity | Graded response (3 categories) for the activity's type in M1. This anchors absolute level, because forced choice alone is relative. |
| Task first attempt and level | Ability k | Correct / incorrect at item difficulty b → Rasch/2PL in M2 |
| Value dilemma pick | Work value | Pairwise count, Bradley–Terry scores |
| Map taps, simulation "would do again" | RIASEC (weak) | **Weight 0 in v1:** logged and reported separately only; used in scoring only if a later study shows they improve measurement without engagement bias |
| Marks (optional, typed by student or parent) | Eligibility, support | Rule gates and a small fit term in M3 |

---

## 12. AI and ML models

**Total: 3 core models + 1 optional model.** Simple, explainable statistics are used wherever they are the right tool. Students are minors, and every result must be explainable to parents and examiners.

### M1: Interest estimation (core)

| | |
|---|---|
| **Job** | Turn planner picks, Dil/Duniya choices and reaction taps into 6 RIASEC scores with uncertainty. Choose the next scenes to reduce that uncertainty. Drive the letter. |
| **Model** | **Thurstonian IRT** for the forced-choice data (Brown & Maydeu-Olivares, 2011), plus a **graded response model** for the taps. Bayesian EAP scoring gives a score and a standard error per type. |
| **Adaptive part** | Each week the storylet picker prefers scenes and pairs with the highest expected information for the least certain types. This is computerised adaptive testing inside the story. |
| **Why not deep learning** | Fewer than 60 data points per student. IRT is interpretable, gives honest uncertainty, and is the standard in psychometrics. |
| **Training data** | (1) **Pre-calibration on the Open-Source Psychometrics RIASEC dataset** (≈145,828 people × 48 activity ratings). We map each game option to the matching marker items and *simulate* each respondent's game choices from their real ratings, then fit item parameters. (2) **Recalibration on our pilot data**, because tapping choices in a story isn't the same as rating items. |
| **Training** | Offline in R `thurstonianIRT` (Stan/lavaan) and `mirt`. Parameters are exported as versioned JSON. The production scorer is a NumPy EAP quadrature in the FastAPI service. |
| **Success** | Feasibility: mean r ≥ .80 (stretch .90) between game scores and full-48-item scores in simulation; validity: r ≥ .50 with the O\*NET Mini Interest Profiler for at least 4 of 6 types in the pilot. These are hypotheses, reported either way. |

### M2: Ability estimation (core)

| | |
|---|---|
| **Job** | Turn first-attempt task results into ability levels for 6 families |
| **Model** | **Rasch (1PL)** per family first, with adaptive difficulty (a staircase that moves to the most informative next level); the 2PL only if n ≥ 300 for that family and fit favours it. Each family has ≥ 12 items across its 4 levels. Bands (developing / solid / strong) come from pilot tertiles. |
| **Not used** | Reaction time as a score (device latency of 50–200 ms makes it unfair) |
| **Training data** | Pilot item responses (target n ≈ 150–300 students). ICAR's published validation data is a reference for difficulty spread and item design only. |
| **Training** | Offline `mirt` / `girth`; item difficulties stored as JSON |
| **Success** | Split-half reliability ≥ .70; floor and ceiling under 15% per family; correlation with interest scores under .30 (tasks shouldn't measure interests) |

### M3: Stream recommender (core)

| | |
|---|---|
| **Job** | Rank streams (or university fields for class 11–12), apply gates, explain why, and give a confidence level |
| **Inputs** | 6 RIASEC scores, 6 ability levels, optional marks, class. **Never** gender, district, school type or device. |
| **Three candidates, compared honestly** | **(a) Counsellor rules:** weights from 3–5 teachers or counsellors using AHP (pairwise comparisons). **(b) Congruence:** fit = 0.55 × cosine(student RIASEC, stream RIASEC profile) + 0.35 × ability support + 0.10 × marks support. Stream profiles come from the O\*NET RIASEC codes of the careers each stream leads to. **(c) Learned ranker:** **LightGBM LambdaRank** (gradient-boosted trees) with **SHAP** explanations. |
| **Labels** | The learned ranker (c) is **exploratory**: data are split by vignette, never by rater, and only out-of-sample results count. There is no public "right stream" dataset for Pakistan. We build **120–200 vignettes** from real RIASEC profiles in the 145k dataset, with sampled abilities and class. A blinded panel of 3 counsellors ranks the top 3 for each. We add 30–60 consented pilot profiles. If the dataset's "major" field is usable, majors are mapped to stream families to pre-train (c). |
| **Decision rule** | (c) goes to production only if it beats (b) on NDCG@3 by ≥ .05, with a confidence interval excluding 0, **and** passes fairness checks. Otherwise (b) ships. This is the likely outcome for the FYP, and that's fine. |
| **Fairness** | Gender is not an input, so the real risk is proxy bias through the scores. Checks: (1) top-1 and top-3 STEM rates by gender, raw and at matched interest and ability scores (logistic regression), with 95% CIs; (2) DIF on every forced-choice pair and task item by gender and medium; (3) score distributions by group. A gap above .10 in matched rates, or flagged DIF, triggers review (SCIENTIFIC_BASIS.md V6) |
| **Explainability** | (b): exact contributions. (c): SHAP. Students see reasons only from the model actually used. |

### M4: Explanation writer (optional, research only)

| | |
|---|---|
| **Job** | Rewrite the already computed result into 2–3 warm sentences in English or Roman Urdu |
| **Default** | Bilingual templates (no AI). These ship first. |
| **Optional model** | A small open-weights multilingual LLM (7–8B class; for example a Llama-3.1-8B base with Urdu adaptation such as UrduLLaMA, or Qwen2.5-7B, checking each licence), **self-hosted**. Minors' data never goes to a third-party API. |
| **Fine-tuning** | **LoRA / QLoRA** adapters on ≈500–1,000 explanation pairs the team writes (result → good explanation, in both languages) |
| **Guardrails** | The LLM **never ranks or decides**. Every stream and reason it names must appear in its input. A gender-swap audit on 200 synthetic profiles allows at most a 5-point gap in STEM mentions. Readability ≤ Grade 6. It ships only if humans prefer it to the templates. |

### Not ML, but automated

| Rule | Use |
|---|---|
| Data-quality checks | Repeated-pair consistency, always-left or always-one-voice patterns, implausibly fast play. These lower the confidence level; they never punish. |
| Eligibility gates | PMDC, PEC, IBCC and board rules as a versioned rule table |

### Models we are **not** using, and why

| Model | Why not |
|---|---|
| Linear regression | No continuous target to predict; congruence is simpler and explainable |
| Logistic regression | Used only inside the DIF fairness analysis, not for recommendations |
| Random Forest | LightGBM covers tree ensembles better on small tabular data. RF can be reported as an extra baseline. |
| XGBoost | Equivalent to LightGBM; we pick one (LightGBM, for LambdaRank and speed) |
| CNN | We have no images to learn from |
| RNN / LSTM / Transformers on play logs | Sequences are tiny (≈60 events per student), there's no labelled outcome, and they're not explainable to parents. IRT is the right tool. |
| Sora (video generation) | Irrelevant; all art is drawn and animated by the team |
| LLM ranking or chat with students | Bias (a GPT-4o-mini pilot suggested STEM to 93% of one gender vs 27% of the other), hallucination, safety for minors, cost |
| LoRA / QLoRA | Used **only** for the optional M4 |

---

## 13. Datasets

| Dataset | Size | Licence / access | Used for | Caveats |
|---|---|---|---|---|
| Open-Source Psychometrics **RIASEC** test responses | ≈145,828 people; 48 items (1–5); age, gender, education, **major**; also 10 TIPI items | Free download for research (verify the exact licence) | M1 pre-calibration and simulation; M3 vignettes; maybe major → stream pre-training | Mostly adult, Western, online volunteers. Hence pilot recalibration. |
| **O\*NET** database and Web Services | ~900 occupations with RIASEC codes, work values, tasks | Team has a Web Services account; attribution required | Stream RIASEC profiles (M3b), career pages, work values matching | US occupations: we localise routes and drop US wages. The Work Values file is no longer updated. |
| **O\*NET Interest Profiler (Mini-IP)** | 30 items | Via Web Services, unchanged, in English | Validation benchmark only, in supervised pilot sessions, never in the app | Urdu use would need the Developer License |
| **ICAR** (SAPA project) | ≈97,000 people; matrix and 3D rotation items, among others | Public-domain items; data for scientific use | Design reference for task families and difficulty | Don't ship ICAR items. It was too hard in one Malaysian sample, so calibrate locally. |
| Pakistani rules (boards, PMDC, PEC, IBCC) | Rule tables | Public | Eligibility gates | Re-check every year |
| **Rahyaab pilot** (to collect) | Target 150–300 students, with parent consent | Our own, consented | Recalibrate M1, calibrate M2, validate, fairness | Must follow the ethics plan (section 16) |
| Counsellor-labelled vignettes (to create) | 120–200 cases × 3 raters | Our own | M3 labels | Report rater agreement (Fleiss' κ, Kendall's W) |
| Explanation pairs (to write) | 500–1,000 | Our own | M4 LoRA fine-tune | Only if M4 is attempted |

**Is there a public dataset of "student → right stream" for Pakistan?** No. That's why M3 starts with rules and congruence, and learns only from counsellor-labelled cases and the pilot.

---

## 14. Data flow and training pipeline

```
Phone (offline-first)                         Server (FastAPI + PostgreSQL)              Offline research (R / Python)
Ink story + tasks → events (≤1 KB each) ──► /events:batch (idempotent) ──► scoring service:   145k dataset ─┐
Local store + outbox, sync when online        M1 EAP + M2 IRT + M3 ranker + gates      ├─► fit item params (TIRT, GRM, Rasch)
Letter / meter from latest M1 SE  ◄────────── results + "why" + confidence             pilot data ────┤   → versioned JSON → server
                                              O*NET cache (server-side, no student data) vignettes ───┘   M3 train / compare / fairness
```

**Training steps:**
1. Map every game option to RIASEC marker items. A CI check verifies coverage.
2. Simulate game play from the 145k respondents; fit M1 parameters; test the adaptive picker in simulation (items used vs accuracy curve).
3. Pilot round 1 (vertical slice, 10–15 students): usability and the cringe pass.
4. Pilot round 2 (150–300 students): recalibrate M1 and calibrate M2; O\*NET Mini-IP benchmark; reliability; DIF.
5. Build and label the vignettes; train and compare M3 (a/b/c); fairness audit; pick the production model by the decision rule.
6. Freeze versions (`params_v1.json`, `rules_v1.json`). Every result stores the model version that made it.

---

## 15. Validation and research plan

| Question | Method | Target |
|---|---|---|
| Does the game measure interests? | Convergent r with the O\*NET Mini-IP per type | ≥ .50 on ≥ 4/6 types |
| Is it reliable? | Split-half; 2-week retest on a subset of ≥ 30 students | ≥ .70 |
| Are tasks fair across phones? | Device-tier effect on scores | No significant effect |
| Is it fair across genders? | DIF per choice; matched-score recommendation audit | No flagged items; gap ≤ .10 |
| Is the recommender good? | NDCG@3, top-3 hit vs the counsellor panel, κ | (b) or (c) beats (a) |
| Does it help? | Career decision confidence before and after; family-conversation follow-up | Improvement, reported honestly |
| Does it feel like a game? | Playtest, enjoyment, "felt like a test?" rating | Most students say no |

---

## 16. Ethics, privacy and safety

**Data and consent:**
- Nothing is saved before parental consent.
- Nicknames only: no photos, CNIC/B-form numbers, contacts or precise location.
- Pseudonymous IDs.
- Data download and deletion are available in the app.

**Standards:** Pakistan has no enacted data protection law yet, so the app is built to the UK Children's Code, GDPR-style practice, OWASP MASVS and WCAG 2.2 AA.

**Never:**
- ads, streaks, leaderboards, loot boxes, paid choices or timers;
- open chat or user-generated content;
- sending student data to third-party AI.

**Results:**
- always "a starting point, not a verdict";
- confidence is always shown;
- a Plan B is always given.

**Wellbeing:** a helpline screen in Settings that gameplay never triggers. No romance, religion or sect, politics, self-harm or abuse content.

---

## 17. Scope and milestones

| FYP-1 (demo) | FYP-2 | Later |
|---|---|---|
| Prologue + Week 1 polished, then Weeks 2–4 | Map exploration, value moments, 4 job simulations | All 8 simulations, new term, family co-play |
| 6 task families × 4 levels | Rive animation for the cast | Voice acting |
| M1 (simulation-calibrated), M2 (staircase), M3 (b) congruence + gates | Pilot calibration, M3 (c) comparison, fairness audit | M4 explanations (if the audits pass) |
| Letter / meter, Blueprint, family share | Urdu-script parent report | School dashboard analytics |

**Build order:** vertical slice (prologue + Week 1) → playtest → Weeks 2–4 → scoring service → pilot.

**The delivery plan wins over this table.** The MVP for both semesters (`docs/project/MVP.md`) builds FYP-1 with 3 task families and the class 9–10 mode only. The other 3 families, the other class modes, the fit check and routes, the parent page and the dashboard follow in FYP-2. Job simulations are post-MVP.

---

## 18. Changes applied to the SRS (v1.1)

1. **Audience:** class 8 is added (Science vs Arts decision).
2. **M1:** move from "graded response model on swipe cards" to **Thurstonian IRT on story choices + GRM on reaction taps**. The 145k dataset is used through *simulated* game choices.
3. **Work values:** added as a **secondary** construct (O\*NET six), used for explanations and tie-breaks only.
4. **Abilities:** 6 task families, named against their ICAR item families.
5. **Big Five:** stays out of scoring (unchanged).
6. **The letter** replaces the plain "knows you" ring as the visible form of M1's uncertainty.

**SRS v1.2 (5 Nov 2026):**

7. A current-group and current-stream fit check, with routes (FR-99).
8. Age handling (FR-100).
9. A class check-in (FR-101).
10. Guided field help (FR-102, FR-103).
11. Non-standard learners (FR-104).

---

## 19. Open questions for the supervisor

1. Is class 8 in scope for recommendations (Science vs Arts)?
2. Is the one-tap "meh / okay / loved it" acceptable under the game-only rule?
3. Is the letter-from-future-you hook approved?
4. Should job simulations count in scoring, or stay exploration-only? We recommend exploration-only for the FYP.
5. Will the O\*NET Mini-IP benchmark be English-only with read-aloud, or will we apply for the Developer License to validate an Urdu version?
6. Are Riphah GPU resources available if M4 is attempted?
7. May the app show "re-take class 9 in another group" as a route, on request and only with high or medium confidence, with a teacher flag?
8. Should learners aged 18+ and over-age learners be allowed in the pilot, or only offered the app outside the study?
9. Which boards' group-switch windows and additional-subject rules can the supervisor's contacts help verify?

---

## 20. Sources

**Earlier project research** (in the team's research notes and reports): stream rules and gates, competitor table, privacy standards, device latency, Career Key Urdu (Hussain et al. 2014), parental pressure and MDCAT figures, stealth-assessment literature, game mechanics.

**New sources for this version:**
- Saya et al. 2025, *Psychology in the Schools*, career decision confidence in Pakistani youth: https://onlinelibrary.wiley.com/doi/10.1002/pits.23552
- like2be career game, 809 students (Keller, Döring & Makarova 2022): https://bildungswissenschaften.unibas.ch/fileadmin/user_upload/bildungswissenschaften/04_Forschung/Dokumente/Career-Choice-With-the-Serious-Game-Like2be.pdf
- Interactive narrative RIASEC assessment (Gutierrez et al.): https://web.ua.es/va/phdinf/documentos/jdi-2026/rommeljairgutierrezyepez.pdf
- thurstonianIRT R package (Bürkner 2019): https://cran.r-project.org/web/packages/thurstonianIRT/readme/README.html and https://joss.theoj.org/papers/10.21105/joss.01662.pdf
- RIASEC dataset fields (subset documentation): https://rdrr.io/github/Rkabacoff/qacr/man/holland.html ; Kaggle mirror: https://baselight.app/u/kaggle/dataset/lucasgreenwell_holland_code_riasec_test_responses
- O\*NET Work Values: https://www.onetcenter.org/dictionary/30.0/text/work_values.html
- ICAR (Condon & Revelle 2014): https://personality-project.org/revelle/publications/condon.icar.14.pdf ; Cambridge Psychometrics Centre: https://www.psychometrics.cam.ac.uk/research/the-international-cognitive-ability-resource-icar ; PsychArchives deposit: https://www.psycharchives.org/en/item/be35b8b4-2bc7-4691-964d-52cfc1cf17a9
- UrduLLaMA 1.0: https://arxiv.org/abs/2502.16961
- react-native-svg filters (15.4 release): https://newreleases.io/project/npm/react-native-svg/release/15.4.0
- Career Guidance PK (Google Play): https://play.google.com/store/apps/details?id=neuron.solutions.pk.careerguidance
- CareerCoachs: https://careercoachs.com/online-career-counselling/pakistan
- Brazilian adolescent RIASEC differences: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1498424/full
- Stick A Round: https://stickaroundgame.notion.site/sar-press-kit
- Pinstripe (Thomas Brush): https://en.wikipedia.org/wiki/Pinstripe_(video_game)
- RDR2 honour system: https://www.rdr2.org/wiki/honor-system/
- Pakistan phone tiers: https://www.techjuice.pk/top-5-best-mobiles-under-rs-50000-in-pakistan-for-2025/
