> **Superseded.** Kept for history only. See `design/` and `docs/project/` for current documents.

# Rahyaab app and game design (game-based only, Grades 9–12)

Updated 29 Oct 2026 after the team's clarifications:

- The scope is Grades 9–12 and **game-based assessment only**. There is no questionnaire track, no interview, and no other age tiers.
- Everything on GitHub is experimental, AI-assisted prototype code.
- The team has O\*NET Web Services API access.
- Free and open-source tools are preferred.

This document replaces the instrument-related parts of `Rahyaab FYP review.md` (sections 3.3–3.4). The other review points still apply: the CCP section, the stream outputs and eligibility gates, the ML experiments, the backend and Git.

---

## 1. The key design question: measuring interests with games only

The research is clear on one point: **cognitive puzzles measure ability, not interest.** A student who is good at Tower of Hanoi may still hate engineering. Your own Template-04 said the same: "games modulate, not generate".

So a games-only app needs two kinds of game:

1. **Choice games, for interests (RIASEC).** The student repeatedly chooses between activities, roles or actions, and each choice maps to a RIASEC type. The game is the wrapper and the choices are the measurement. The literature calls this *stealth* or *gamified* assessment, and it is the form with the best validity evidence: the Owiwi missions study found β .53–.57, versus .17–.39 for the plain-text version. It still counts as game-based. Your `riasec_core.py` design already gives one option per RIASEC letter at every step, which is the right fairness rule.
2. **Puzzle games, for abilities.** Matrix reasoning, spatial rotation, number puzzles, sequence memory and planning. Score them on accuracy and level reached, not speed.

**Validation without breaking the "game-only" promise:** the product has no questionnaire. Your research study can give pilot students the O\*NET Interest Profiler once, through your API access, as a **research benchmark** only. You then report how well game-derived RIASEC agrees with it. That is your main validity experiment, and the gap the literature review found: no published teen game has reported this number. Say this explicitly in the report, so examiners don't read it as a questionnaire track.

---

## 2. How competitors work

This section is based on our research notes plus general product knowledge, not hands-on trials. Before the progress presentation, watch each vendor's public demo videos and record screenshots for the market-survey chapter.

| Product | Who it's for | Flow | Assessment style | Results screen | Copy / avoid |
|---|---|---|---|---|---|
| **YouScience Brightpath** (US) | High-school students, via schools | School login → several short timed "brain games" (aptitudes) → interest check → results | Game-like aptitude tasks plus an interest check; split over sessions | Aptitude and interest profiles → "pathways" and careers with fit → linked courses and certifications; educator dashboard | **Copy:** aptitude games, pathway output, educator view. **Avoid:** long total time, US-only content. |
| **Pymetrics / Harver** | Job applicants | Instructions → about 12 short games (~25–30 min) → done | Lab-task games: balloon risk (BART), towers, digit span, money exchange, faces | Trait spectrums ("you lean towards…"), no good/bad labels, role matches | **Copy:** one game per screen with instructions and a practice round; neutral trait language. **Avoid:** traits with weak validity; speed-based scoring. |
| **Arctic Shores** | Job applicants | Browser tasks, "no right or wrong answers" | Abstract interactive tasks | Strengths-based feedback report | **Copy:** reassuring framing, which reduces test anxiety. |
| **Xello** (K-12) | School students | Student account → "About me" activities → career matchmaker (rate activities) → saved careers → lessons by grade | Short interactive quizzes, rating cards | Career cards with "save", match reasons, portfolio | **Copy:** career cards, saving, short lessons. |
| **Mindler** (India) | Grades 8–12 | Buy plan → ~2.5-hour multi-part test → PDF report → counsellor call | Questionnaires, marketed as "gamified" | Long PDF report, stream/career suggestions | **Avoid:** test length, paywalled report. **Copy:** stream-level advice and counsellor follow-up. |
| **Kazakhstan GCG (2025)** | Grade 11 | 3-D web game levels → counsellor dashboards | Stealth assessment from gameplay | Competency scores for counsellors | **Lesson:** completion fell from 57% to 41% across levels, so keep chapters short. |
| **Pakistani sites** (CareerCoachs, Merafuture, Eduvision) | Matric/Inter | Web questionnaire → report → paid counsellor session | Questionnaires | Text report | Your gap: no games, no Urdu-first mobile app, no parent report. |

**Common pattern among the good ones:**

- short, chunked activities;
- a practice round before each task;
- no "test" language;
- strengths-based results;
- a few concrete options with reasons;
- a next action (explore, save, talk to a counsellor);
- an adult-facing dashboard.

---

## 3. App structure (information architecture)

### Users

| Role | Platform | What they do |
|---|---|---|
| Student (main) | Mobile app | Play chapters, see their profile and top 3 streams, explore streams, share with a parent |
| Parent | Link, no app needed | Give consent via OTP or link; read an Urdu/English report |
| Counsellor / teacher | Lightweight web dashboard | See their class, students' profiles, low-confidence flags, notes. This is the "web portal" you committed to. |
| Admin | Same web dashboard | Schools, content (stream rules, careers), model versions |

### Student screens

1. **Welcome:** language (Urdu/English), what Rahyaab is, "no right or wrong answers".
2. **Sign up:** school code or individual sign-up; grade 9–12 check; parent consent (phone OTP or link). Nickname only; no CNIC or B-form number.
3. **Profile:** grade, board (FBISE / Punjab BISE / Sindh / KP / Cambridge), current group if in grade 10–12, optional Matric/9th marks, city.
4. **Avatar and journey map (home):** a map with 4 chapters, a progress ring per chapter, and a "continue" button. Sessions of 3–7 minutes; students can stop any time and resume later.
5. **Chapter player:** the shared shell for every game: intro card → practice round → play → short "what you did" recap, with no scores for interest games.
6. **Your profile (results):** unlocked after chapters 1–3.
   - an interest hexagon (RIASEC) and ability strengths in bands, not IQ-style numbers;
   - **top 3 streams** with fit, reasons ("You often chose building and fixing; you were strong in spatial puzzles"), confidence (low/medium/high), eligibility check, Plan B;
   - "what you'll study" and "where it leads".
7. **Stream library:** each stream's subjects, entry tests (MDCAT/ECAT/NET), careers (from the O\*NET API, localised), and a "try this stream" sim.
8. **Share with parent:** an Urdu/English report as a WhatsApp link or PDF, with a "talk together" checklist.
9. **Retake / history:** replay after 3 months; shows what changed.

---

## 4. Game designs

Each game: what it measures, the mechanic, what to log, how to score it, and its length. Puzzle games are scored on the **first attempt**; replays are allowed for fun but don't count.

### Chapter 1: Career bazaar (interests)

- **Mechanic:** walk through a Pakistani bazaar. Each stall shows an illustrated activity card ("repair a motorbike", "design a shop sign", "help at a clinic camp", "run a stall's accounts"). Swipe right to "try it", left to "skip". Chosen cards fill your shop.
- **Content:** about 48 activity cards, 8 per RIASEC type, written from the public-domain IPIP RIASEC marker items but localised. O\*NET occupation data supplies the example activities.
- **Log:** card id, choice, dwell time (logged only, not scored), order.
- **Score:** per-type preference scores, estimated with an item response model (Section 6, M1). An adaptive version shows the most informative next card, so fewer cards are needed.
- **Length:** about 4 minutes.

### Chapter 2: Story town (interests in context)

- **Mechanic:** a short branching story set in a Pakistani town: a flood relief camp, a school science fair, a family shop, a cricket club. Each step has 6 options, one per RIASEC type, shuffled. This is the design already in `riasec_core.py`.
- **Log:** option chosen, step, time.
- **Score:** pooled with chapter 1, as a second, independent source of interest evidence. Agreement between the two chapters gives a **consistency/confidence** score.
- **Length:** 5–7 minutes, played in two parts.

### Chapter 3: Puzzle lab (abilities)

| Puzzle | Ability | Mechanic | Score (no speed) |
|---|---|---|---|
| Pattern gates | Fluid/abstract reasoning | Matrix puzzles: pick the missing tile; adaptive difficulty | Correct answers and level reached (item response model) |
| Rotate and fit | Spatial | Rotate a shape to fit a slot; mental rotation and folding | Accuracy, level reached |
| Bazaar budget | Numerical | Make change, compare prices, simple ratios in a shop | Accuracy, level reached |
| Glyph sequence | Working memory | Repeat growing symbol sequences (your `glyph_sequence`) | Longest correct span |
| Power grid | Planning | Connect the grid in the fewest moves (your `power_grid`) | Moves vs optimum, first attempt |

- **Log:** item id, difficulty, correct/incorrect, attempts, device model, time (logged only).
- A 20-second **calibration tap block** at the start records device latency, for the latency experiment.
- **Length:** about 6 minutes, in two parts.

### Chapter 4: Stream sims (try a stream)

- **Mechanic:** four 2-minute "day in the life" mini-tasks, one per main stream:
  - **Pre-Medical:** triage patients at a clinic camp.
  - **Pre-Engineering:** build a bridge from limited parts.
  - **ICS:** program a robot's path with blocks.
  - **I.Com:** balance a shop's ledger.
  - **FA / Humanities:** debate or write a news headline.
- **Purpose:** world-of-work information, which meta-analyses identify as an effective guidance ingredient, plus extra interest evidence: which sims students replay, finish, or rate "would do again".
- Unlocked after results, so it doesn't delay the first profile.

### Out of the scoring

The existing BART, Emotify and Easy/Hard games measure risk, emotion recognition and ambition. The research gives no link from these to stream fit, and speed-based scoring is unfair across phones. Keep them as optional fun or research data, or drop them, but **don't feed them into recommendations**.

---

## 5. Results logic

1. **Interest profile** (chapters 1–2) → RIASEC scores plus a consistency/confidence score.
2. **Ability profile** (chapter 3) → bands per ability.
3. **Stream fit** = f(interest match with the stream's RIASEC profile, ability support, marks if given):
   - **Baselines:** counsellor rule table; cosine/Holland congruence.
   - **ML:** a learned ranker with SHAP explanations.
4. **Eligibility gates:** hard rules such as group and marks thresholds.
5. **Output:** top 3 + Plan B + reasons + confidence. Never a single verdict.
6. An optional LLM rephrases the reasons in Urdu/English from de-identified inputs. It never ranks, and it gets a gender-swap bias test.

---

## 6. AI/ML and the CCP (game-only version)

| Module | Method | Data | Experiment and metrics |
|---|---|---|---|
| **M1 Adaptive interest estimation** | Item response model on swipe/story choices; computerized adaptive card selection | Pre-train item parameters on the public 145,828-response IPIP RIASEC dataset, which matches your card items; recalibrate on the pilot | Cards needed vs accuracy; agreement with the O\*NET IP benchmark (correlation, top-3 code match); adaptive vs fixed vs random order |
| **M2 Ability estimation** | Adaptive puzzle difficulty (item response model or a staircase); latency calibration | Pilot | Reliability (split-half, test-retest); latency-correction ablation; discriminant check (puzzles shouldn't predict interests) |
| **M3 Stream recommender** | Rules vs congruence vs gradient-boosted ranker with SHAP | Public data (if the 145k set has a field-of-study column, check) plus counsellor-labelled pilot profiles | Top-3 hit, NDCG@3, Cohen's kappa vs counsellor panel; games-only components ablation; fairness by gender |
| **M4 Explanation** (optional) | LLM rephrasing | n/a | Gender-swap audit; factual consistency with the computed reasons |

These give you the CCP's conflicting requirements, concretely:

- fewer cards (fun) vs accuracy;
- game-like vs reliable;
- speed signals vs fairness on cheap phones;
- accuracy vs fairness;
- personalisation vs minors' privacy.

---

## 7. Architecture and repo layout

Use one Expo app with the games as **screens inside it**, not separate programs. Each game uses a shared shell:

```
GameShell(config) → Intro → Practice → Play(component) → Recap
                      ↳ telemetry.emit(event)  → local queue (expo-sqlite) → POST /events
```

Suggested monorepo:

```
apps/mobile/           Expo app (screens, games/, shell/, telemetry/, i18n/ ur+en)
apps/dashboard/        Counsellor/admin web (Next.js or plain React + Vite)
services/api/          FastAPI: auth, consent, sessions, events, results
services/scoring/      Python: your stream_transformation_engine, calibration, aggregate,
                       item response models, ranker; versioned models
research/              notebooks: M1 on the 145k dataset, M3 experiments, pilot analysis
content/               cards.json, stories.json, puzzles.json, streams.json (rules, Plan B)
docs/                  report chapters, diagrams, CCP mapping
```

- **Stack:** Expo + Reanimated + Gesture Handler + react-native-skia for games; FastAPI + PostgreSQL; Docker.
- **ML:** scikit-learn / LightGBM / SHAP; `girth` or `py-irt` for item response models.
- **Free resources:**
  - O\*NET Web Services (careers, activities; keep their attribution);
  - DiceBear (avatars);
  - OpenMoji / unDraw (illustrations, check each licence);
  - Noto Nastaliq Urdu (font);
  - LibreTranslate, self-hosted, for draft translations only; a human checks the Urdu.
  
  From the free-public-apis list, only use APIs that don't receive student data. Never send minors' data to third-party APIs.

---

## 8. Build order

1. Lock this design. Update Template-04 v1.5: game-only instruments, CCP section, streams and gates. Present it to the supervisor.
2. Restructure the repo as in Section 7. Move the current experiments to `research/` or `_archive/`.
3. Build the mobile shell: onboarding, consent, profile, journey map, GameShell, telemetry queue.
4. Build chapter 1 (Career bazaar) and chapter 3 (Puzzle lab: 2–3 puzzles) first.
5. Build the backend: auth, consent, events, a results endpoint; the scoring service with baselines (rules + congruence).
6. Build the results screen and parent report.
7. Run M1 on the public dataset (notebook + report chapter).
8. Write report chapters 1–5 for the progress presentation.
9. FYP-2: chapters 2 and 4, the counsellor dashboard, the pilot (ethics approval first), M2/M3 experiments, Urdu, testing.
