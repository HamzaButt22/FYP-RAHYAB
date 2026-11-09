# Rahyaab FYP review

Reviewed on 29 Oct 2026, against:

- the two research reports (`reports/Career guidance games app Pakistan.md`, `reports/Career guidance games literature review.md`)
- the CCP guide, FYP handbook, rubric and deliverables timeline
- the faculty comments sheet from the proposal defence
- your documents: Template-01, the initial proposal, Template-04 (v1.4, 30 Sep), and the proposal slides (final draft)
- GitHub `HamzaButt22/FYP-RAHYAB` at commit `b04419b` (27 Oct), all branches

Not seen yet: your uncommitted local work (see the last section). I didn't check the 17 system-design diagrams in detail.

---

## 1. Summary

The **Template-04 proposal is good and mostly agrees with the research.** It:

- keeps games (abilities) separate from interests (RIASEC);
- uses public-domain or open instruments;
- plans a games-only vs questionnaire-only vs hybrid comparison, a fairness check and a discriminant check.

Those are exactly the things the literature supports.

The problems are elsewhere:

1. **Three versions of the project disagree with each other.** The slides, Template-04 and the code describe three different systems. Faculty already said the scope is "too open" and "not clear". The code now contradicts the proposal you submitted.
2. **The Complex Computing Problem is never stated.** Two evaluators (Mubariz Rehman, Usman Sharif) said the CCP is unclear. Template-04's "Faculty Proposed Changes" table does not list or answer that comment. The CCP carries the most marks: LO3 + LO4 = 40/100.
3. **There is no real AI/ML yet, and no plan for training data.** All scoring is hand-set weights. The ML scripts exist but need paired data that nobody has planned to collect.
4. **The app recommends university careers, not Pakistani streams.** For a Grade 9–12 scope, the output should be Matric/Intermediate groups.

None of this needs a full restart. It needs one locked scope, a written CCP, and an ML plan that works without waiting for months of pilot data.

---

## 2. Faculty comments: status

| Comment | Who | Status | What's still needed |
|---|---|---|---|
| Scope not clear / too open / redefine | Mubariz, Usman S., Sherjeel, Sajid | **Partly.** Template-04 narrowed it, but the code and slides don't match. | One scope, followed by every artifact. |
| CCP not clear | Mubariz, Usman S. | **Not addressed** (missing from the changes table) | A CCP section mapping 7–9 Seoul Accord characteristics (Section 4 below). |
| Clarify dataset and target audience | Usman S. | Audience done. Datasets listed but their roles are unclear. | Say which dataset trains which model (Section 5). |
| Do a market survey, not only papers | Tabassum Javed | **Partly.** Table 1 covers recruitment tools only. | Add student career platforms: Mindler, iDreamCareer, Univariety (India), YouScience, Naviance, Xello (global), CareerCoachs, Merafuture, Eduvision (Pakistan). Also note that Maqsad, Taleemabad and Edkasa have no career product. Pricing and gaps are in report 1, §Competitors. |
| More literature; define techniques | Tajamul Shahzad | **Partly** | Add the closest academic systems: Ecuador IEEE TLT 2025 RIASEC story game, Kazakhstan 2025 (already in slides), like2be, the Parola et al. 2023 review, and the stream-recommender papers (report 2). |
| Define the features of the personality assessment | Hammad Ahmad | Partly | Template-04 says Big Five comes from IPIP-NEO-120. The code instead infers Big Five from games with invented weights. Pick one (see 3.4). |
| Define game features before building games | Zeeshan FC | Done in Template-04 Table 3 | The code's 5 games don't match the 6–8 games in Table 3. Update one of them. |
| Committed to app + web portal | Sajid Qureshi | Answered: "mobile app + lightweight admin dashboard" | The admin dashboard and backend don't exist yet. |

---

## 3. Where your work clashes with the research or with itself

### 3.1 Three different projects

| | Slides (final draft) | Template-04 (submitted) | Code on GitHub |
|---|---|---|---|
| Users | Under-14, 14–18, 18+ | Grades 9–12 only | Grades 9–12 |
| Games | Unity/C# | jsPsych/OpenSesame, 6–8 cognitive tasks | Expo app with 5 games; desktop Pygame Big Five game; browser RIASEC game |
| RIASEC | Psychometric test | O*NET Interest Profiler, 60 items | 24 items the team wrote |
| Big Five | Questionnaire + AI video | IPIP-NEO-120 questionnaire | **Inferred from game scores** via hand weights (app); inferred from gameplay (Pygame demo) |
| Games produce RIASEC? | n/a | **No**: "games modulate, not generate" | The browser RIASEC game infers interests from play |
| Output | Field + skills | ICS / Pre-Med / Pre-Eng / Humanities / Arts | **11 university careers** (Software Engineering, Data Science, Law, …) |
| Backend | FastAPI, PyTorch | FastAPI + PostgreSQL + JWT | None. AsyncStorage on the phone; the comment says "Flask + MySQL". Demos use Flask + SQLite. |

**Fix:** Treat Template-04 as the source of truth, with the changes below. Then delete or archive anything that contradicts it, such as the video interview, Unity and the under-14/18+ tiers. Never reuse the slides' tier diagram.

### 3.2 Unsupported statistics in the slides

The slides make three claims that aren't backed by a citation that supports them:

- "99% of students lack access to formal counseling"
- "34% higher employment rates"
- "Over 50% … parental pressure"

The first two cite university studies, not school students. Template-04 correctly switched to Yaqoob et al. 2017. Use only figures you can quote with page numbers. Better ones from the research:

- 46% of secondary students chose subjects unrelated to their goals (Taj et al. 2025, n=400)
- 69.5% of MBBS students chose medicine mainly because of parents (Nishtar, JPMA 2025)
- 140,071 MDCAT 2025 candidates for about 22,000 seats

### 3.3 Instrument length breaks "doesn't feel like a test"

Template-04 plans the O*NET IP (60 items), IPIP-NEO-120 (120 items) and 6–8 games. That is about 180 questionnaire items plus 30–40 minutes of games. Mindler's 2.5-hour battery is exactly what students complain about. The research recommends 3–7 minute sessions over several days.

**Fix:**

- Use the **48-item IPIP RIASEC Markers** (public domain). These are the same items as your 145,828-response Kaggle dataset, so your norms and your instrument finally match.
- Then build a **short adaptive version** (Section 5, M1).
- Drop IPIP-NEO-120, or replace it with a 20–50-item IPIP form used only to frame advice. The research found Big Five predicts how well a student does, not which field fits.

### 3.4 Big Five from games is not defensible as built

`RahYaab Application/src/scoring.js` → `bigFive()` sets, for example:

- **Openness** = 0.4×memory + 0.3×BART risk + 0.3×choosing hard tasks
- **Conscientiousness** includes 100 − balloon-pop rate
- **Neuroticism** = 0.4×(100 − risk) + …

None of these weights come from any study. Then 30% of the final recommendation depends on this "Big Five fit". The Pygame demo is honest about the same problem: its README says the weights are "design assumptions, not fitted".

The research (report 2, §game-based measurement) explains why this matters:

- game-derived personality agrees with questionnaires at only about r ≈ .47, and only in adults;
- the gamified-questionnaire approach (validated items wrapped in a story) works better than inferring traits from play.

**Fix:** Keep Template-04's rule that games measure abilities and behaviour, and RIASEC and personality come from short validated items. The Pygame Big Five game can stay as a **research experiment**, not a recommendation input: "can gameplay predict IPIP Big Five? Ridge regression, cross-validated R²". Its `train_model.py` already does this.

### 3.5 Speed-based scoring will penalise students with cheap phones

Several scores use reaction time or speed:

- Emotify perception (30% speed, 3 s limit)
- the memory game's maths speed
- Hanoi's "pause before first move" (45% of the planning score)

On Android, touch latency varies by 50–200 ms between devices (report 1). The Hanoi pause also rewards just waiting.

**Fix:** Score accuracy, number of moves, peak level and first-attempt results. Log timings, but use them only within one device, after a short calibration block. Turning that calibration into a measured ablation study gives you a clean LO4 experiment.

### 3.6 The output must be streams, with eligibility rules

`src/data.js FIELDS` lists 11 university careers. For Grades 9–12 the app should recommend:

- **Grade 8/9 (Matric group):** Science-Biology, Science-Computer, Humanities, Technical
- **Grade 10/11 (Intermediate group):** FSc Pre-Medical, FSc Pre-Engineering, ICS (Physics/Stats/Economics variants), I.Com, FA (elective combos), General Science, DAE; or O/A-Level subject sets

Show the **top 3** with reasons, a Plan B, and **hard eligibility gates**:

- Matric Computer Science → Pre-Medical is not possible. This is inferred from the subject structure, so confirm it with the board.
- Pre-Medical → engineering needs additional maths.
- 60% FSc minimum for PMDC and PEC.

Careers can stay as a second "where this stream leads" layer.

Note: "Arts" in Template-04 should be **FA / Humanities**. I.Com and General Science are missing.

### 3.7 Licensing and citation checks

- **O*NET Interest Profiler licence.** Template-04 says "CC BY 4.0". Our research found the Interest Profiler is **CC BY-ND 4.0**, which allows use only unchanged; translating it to Urdu or turning it into a game needs the O*NET Developer License. The O*NET occupation database is CC BY 4.0. Check onetcenter.org. Switching to the IPIP markers (3.3) avoids the issue.
- **"Hussain et al. (2014)" Career Key Urdu.** Our literature check listed the authors as Jones, Fouad, Ismail, Munaf & Khan. Open the PJPR 29(2) page and copy the author list exactly.
- **Validation plan, bullet 1.** "Game telemetry correlated with RIASEC norms from the 145k dataset" can't be done. You can only correlate measures taken **from the same students**. Use the 145k dataset for norms, item analysis and the adaptive test (M1). Use your own pilot for game-vs-questionnaire correlations.

### 3.8 Missing pieces the research says matter

- **Parent report.** Parents are the strongest influence (β = .50 in a Pakistani study; 66.8% of students trust parents most). The report should be in Urdu and shareable on WhatsApp.
- **Counsellor/teacher mode.** Guidance with a counsellor involved beats app-only guidance (Whiston 2003).
- **Urdu interface**, or at least Urdu result screens.
- **Consent flow for minors** (in Template-04 scope, not built).
- **Ethics approval** from the university and school permission before any pilot with minors.

---

## 4. The Complex Computing Problem: suggested wording

> **CCP:** Infer a Grade 9–12 student's interests, abilities and constraints from short, noisy, multi-source evidence: game telemetry, a short adaptive questionnaire and Matric marks. The data comes from very different low-end phones and has no ground-truth "correct stream". Turn that evidence into fair, explainable, eligibility-constrained stream recommendations that balance the student's interests against admission realities and parental expectations.

| Seoul Accord characteristic | How Rahyaab shows it | Strength |
|---|---|---|
| Conflicting requirements | Accuracy vs. engagement (test-like vs game-like); fewer items vs reliability; personalisation vs minors' privacy; fairness vs accuracy; rich games vs low-end phones; student interest vs parental preference | Strong |
| Depth of analysis | Latent-trait estimation from telemetry; device-latency confound; no labels | Strong |
| Depth of knowledge | Item response theory and computerized adaptive testing, ML ranking, SHAP explainability, fairness metrics, psychometric validation | Strong |
| Familiarity of issues | The Urdu RIASEC adaptation didn't fit Holland's hexagon; no validated teen game-based interest measure exists anywhere | Strong |
| Level of problem | Beyond questionnaire-plus-lookup; no published system does this for Pakistani streams | Moderate–strong |
| Stakeholders | Students, parents, counsellors, schools, boards and councils (PMDC/PEC); conflicting goals | Strong |
| Consequences | A wrong stream costs years: 46% mismatch; MDCAT 140k vs 22k seats | Very strong |
| Interdependence | Game → telemetry → cleaning → latency normalisation → trait estimation → fusion with questionnaire and marks → eligibility gates → ranking → explanation → parent report | Very strong |
| Requirement identification | What counts as a "right" stream is ill-defined; labels must come from a counsellor panel | Strong |

Add this table to Template-04 (or Chapter 1) and to the progress presentation. Then add a line to the changes table: "CCP not clear (Mubariz, Usman S.) → Addressed, Section X."

---

## 5. The AI/ML core: experiments you can run without months of pilot data

The CCP guide requires **baseline + experiment + quantitative comparison**. Here are four modules, ordered by priority. M1 and M3 are the core, M2 is lighter, and M4 is optional.

**M1. Adaptive short-form RIASEC (computerized adaptive testing).** Uses public data only, so you can start now.

- **Data:** the Kaggle/OpenPsychometrics 145,828 responses to the 48 IPIP RIASEC items.
- **Method:** fit a graded response IRT model per RIASEC scale (Python `girth` or `py-irt`; or R `mirt`). Then build a computerized adaptive test that picks the next most informative item.
- **Baselines:** the full 48 items; a fixed random 24; a fixed best-24 short form.
- **Metrics:** correlation with the full-test score; top-3 RIASEC code agreement; items needed to reach a target reliability (SE).
- **Trade-off curve (LO4):** items vs accuracy. Also check the hexagon structure, and whether fairness by gender holds (differential item functioning).

**M2. Game ability estimation with device-latency correction.** Uses pilot data.

- **Games:** keep Memory, Hanoi and BART, and add matrix reasoning. Score from accuracy and peak level, first attempt only.
- **Experiments:**
  - reliability (split-half; test-retest on a subset);
  - correlation with an in-app matrix test;
  - an ablation of the latency calibration (with vs without);
  - the discriminant check from Template-04 (games should *not* predict RIASEC).
- **Synthetic data:** the existing bots and synthetic generators let you test the pipeline before the pilot. Label those results "pipeline test only", as the code already does.

**M3. Stream recommender with baselines.** This is the main ML contribution.

- **Candidates:**
  - (a) a counsellor-written rule table (the expert baseline);
  - (b) Holland congruence / cosine matching between the student's RIASEC profile and each stream's profile;
  - (c) a learned ranker (gradient boosting / LightGBM LambdaRank) with SHAP explanations.
- **Training signal:**
  - **Pre-training:** check whether the 145k dataset includes a field-of-study/major column. I believe it has a free-text one, but confirm. If so, map majors to streams and train RIASEC → field.
  - **Fine-tuning and evaluation:** 30–60 student profiles, each labelled by a panel of 3 counsellors/teachers.
- **Metrics:**
  - top-3 hit rate, NDCG@3 and Cohen's kappa vs the counsellor panel;
  - games-only vs questionnaire-only vs hybrid (already in Template-04, good);
  - fairness: demographic parity and equal opportunity by gender, and a counterfactual gender swap;
  - SHAP-based explanation fidelity.
- **Hard gates** apply after ranking.

**M4 (optional). LLM explanation in Urdu/English.** An LLM only rephrases the already-computed reasons and receives de-identified input. Evaluate with a gender-swap bias audit, since a GPT-4o-mini pilot suggested STEM 93% for male-coded profiles vs 27% for female-coded ones. It must never change the ranking.

Together these give LO1/LO4 maths (IRT, information functions, ranking losses), LO3 design, and measurable LO-evidence. They also directly answer "clear the dataset" (Usman Sharif).

---

## 6. What's implemented vs what's left

### Implemented (on GitHub)

| Area | State | Notes |
|---|---|---|
| Expo app (`RahYaab Application`) | Working prototype, ~490 lines | Login/register, a demo admin and an institution subscription toggle, 5 games (BART, Hanoi, Memory, Emotify, Easy/Hard), 24-item RIASEC, results with top-5 careers and a roadmap. Data is stored only on the phone. |
| Pygame Big Five game (`demos/big-five-game`) | Strongest engineering so far | 10 levels, telemetry logger, cleaning and feature pipeline, weighted + Ridge ML models, Flask dashboard, SQLite, Docker, pytest suite, bots that generate demo data. **Desktop only.** |
| RIASEC browser game (`riasec_career_game`) | Prototype | Six stations; `train_model.py` has grouped cross-validation, a demographics baseline, a hexagon check and test-retest. This matches the research recommendations very well. README and `riasec_core.py` describe different games ("Arcade Career Explorer" vs "Career Expedition"). |
| System design | 17 draw.io diagrams + PNGs | Context, architecture, use cases, activity, sequence, ER, DFD 0/1, deployment. Check they match the locked scope. |

### Left to build (FYP-1 progress presentation: after finals)

The progress presentation needs the first 5 report chapters (Template-05), a prototype and an active GitHub.

1. **Lock the scope** (3.1) and update Template-04 to v1.5 with the CCP section, the changes table, streams, instruments and datasets.
2. **Backend.** FastAPI + PostgreSQL as written, or Supabase (report 1 recommended Supabase Pro). Pick one. Add JWT auth, consent, assessment, telemetry and recommendation endpoints, and replace `store.js` AsyncStorage with API calls.
3. **Proper password hashing and no hard-coded admin password.** The comment says "demo only"; fix it before any pilot.
4. **Stream knowledge base:** Matric/Intermediate groups, eligibility rules, Plan B routes, and stream → careers.
5. **M1 adaptive RIASEC** on the 145k dataset, as a notebook plus a service.
6. **Rescore the games** (3.5): accuracy and level, a calibration block, first-attempt scoring.
7. **M3 baselines (a) and (b)** working end-to-end. The learned ranker can come in FYP-2.
8. **Parent report screen** and a consent flow.
9. **Report chapters 1–5:** Introduction, Literature/Market survey, Requirements (SRS), Design, Implementation so far. Both research reports supply most of Chapters 1–2.

### FYP-2

- M2 game reliability study and pilot (needs ethics approval and schools);
- the M3 learned ranker with counsellor labels, fairness and SHAP;
- M4 optional;
- Urdu UI;
- admin/counsellor dashboard;
- testing, performance on low-end Android, and the final report.

---

## 7. Recommended stack, one choice each

| Layer | Use | Why |
|---|---|---|
| Mobile | **Expo (keep your SDK 57)** + Reanimated + Gesture Handler + react-native-skia for games | You already have the app. Drop jsPsych/OpenSesame for the phone: jsPsych needs a WebView and OpenSesame is desktop-only. Write the tasks natively, using the published task rules (BART, Hanoi, digit span, matrices). Mention jsPsych only as the reference for the task designs. |
| Backend | **FastAPI + PostgreSQL** (as proposed) | Python matches your ML stack. Keep the demos' Flask only for the research dashboards, or move them to FastAPI. |
| ML | scikit-learn, LightGBM, SHAP, `girth`/`py-irt` (or R `mirt`) | M1–M3 |
| Offline | expo-sqlite queue → sync to API | Shared and low-end phones |
| Deploy | Docker on a free or cheap VPS; EAS builds for the APK | Matches the WBS |
| Research compute | Riphah GPU portal (aiml.riphah.edu.pk) if needed | M1–M3 don't need a GPU; a laptop is enough |

Remove Unity, PyTorch/OpenCV video and WebSockets from all documents unless they're back in scope.

---

## 8. Git evidence (LO6 = 15 marks)

The current history has 10 commits:

| Author | Commits |
|---|---|
| Zahid Bashir | 7 (mostly merges and bulk adds) |
| NotLighter | 2 (one "Initial commit" containing the whole Expo app) |
| HamzaButt22 | 1 |

A third contributor has no commits under their own name. Examiners look for steady, per-person, per-feature history. Also fix:

- `__pycache__/*.pyc`, `tmp_check.js` and real session JSON files are committed. Add them to `.gitignore` and remove them.
- Use a **GitHub Issue** for each WBS activity (A1–A12), a branch per feature, PRs reviewed by a teammate, and small commits with clear messages.
- Each member commits under one consistent name and email.

---

## 9. Sharing your uncommitted work with me

The best option is to **push a WIP branch**. It also counts as Git evidence. In your project folder:

```bash
git checkout -b wip/<your-name>-<topic>
```
```bash
git add -A
```
```bash
git commit -m "WIP: <what it is>"
```
```bash
git push -u origin wip/<your-name>-<topic>
```

Check `git status` before `git add -A` so you don't commit secrets or `.env` files. Then tell me the branch name.

**Alternatives:**

- Give this session access to your local project folder; I can request it.
