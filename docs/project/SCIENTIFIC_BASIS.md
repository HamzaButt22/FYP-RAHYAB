# How Rahyaab measures and how we prove it works (evidence for the committee)

This document is the argument the team presents to the FYP committee. It answers:
1. How does a game produce a career recommendation?
2. Which established science is it built on?
3. How do we show, with numbers, that the result is valid and fair?
4. What exactly can we claim, and what can't we?

It brings together GAME_DESIGN.md §8 and §11–15, SRS §12.6 and §14.4, and `design/game/frameworks/`.

## 1. The claim, stated carefully

> Rahyaab estimates a student's **interests**, **abilities** and **work values** from how they play. It then ranks the education paths that fit those estimates **and** the student's eligibility. It explains every ranking, states how sure it is, and always gives a Plan B.

We **do not** claim to know "the right field" for a student. Nobody has that ground truth: no dataset says which stream a teenager *should* have chosen.

Instead, we prove four measurable things:
1. **Validity:** the game's interest scores agree with an established, validated inventory.
2. **Reliability:** scores are stable when measured twice, and consistent within the game.
3. **Expert agreement:** recommendations agree with a blinded panel of counsellors.
4. **Fairness:** recommendations do not differ by gender, school type or phone, at the same scores.

These are the standards used for any psychological or educational assessment (AERA, APA and NCME *Standards for Educational and Psychological Testing*, 2014).

### 1.1 What rests on established science, and what we still have to prove

A new tool is never "scientifically proven" on day one. What we can say honestly is which parts come from established science and data, and which parts are our own design choices that the pilot must test. The app shows results as provisional until V2–V6 are reported.

| Part | Basis | Status |
|---|---|---|
| Six interest types (RIASEC) and person–environment fit | Holland (1997); interests predict performance and persistence (Nye et al., 2012) | **Established theory**; used, not re-proven |
| Interest profiles of occupations | O*NET 31.0 Occupational Interest data (US Department of Labor, CC BY 4.0) | **Official data, applied 11 Nov 2026.** Each path's profile is the mean profile of the occupations it leads to (§4.3, `tools/onet_profiles.py`), replacing the hand-made v1.2 estimates. The occupation lists themselves are our judgement, reviewed by the counsellor panel |
| Admission rules (gates) | PEC regulations, PM&DC statements, IBCC; each gate carries `verification` (primary, reported or unverified) and a source in `streams.json` | **Official sources**, checked yearly. Unverified rules are never shown as fact (`tools/check_streams.py` enforces the fields in CI) |
| Scoring forced choices | Thurstonian IRT (Brown and Maydeu-Olivares, 2011); abilities with Rasch/GRM (Samejima, 1969) | **Established methods**; our item bank must still show fit and reliability (V3, V4) |
| That the *game* measures interests | Our design | **To be proven**: V1 (simulation feasibility), V2 (agreement with the O*NET Mini Interest Profiler), V3–V4 |
| The fit weights 0.55 / 0.35 / 0.10 and the differentiation minimum 0.15 | Our starting values | **To be tested**: compared with counsellor AHP weights and a learned ranker against a blinded panel (V5, ADR-0006) |
| Fairness | Our design (gender not an input) | **To be proven**: DIF and outcome checks (V6) |

## 2. Design method: Evidence-Centred Design

The game was designed with **Evidence-Centred Design (ECD)**, the standard method for game-based assessment (Mislevy, Almond and Lukas, 2003). Every game element exists because it produces evidence about a defined trait.

| ECD layer | In Rahyaab |
|---|---|
| **Student model:** what we want to know | 6 interest scores (RIASEC), 6 ability levels, 6 work values |
| **Task model:** what the student does | Planner picks, Dil/Duniya choices, reaction taps, 6 everyday tasks, value dilemmas |
| **Evidence model:** how actions become scores | M1 (Thurstonian IRT + GRM), M2 (staircase → Rasch/2PL), Bradley–Terry counts |
| **Assembly:** how much evidence is enough | About 30 forced choices + 36 planner comparisons, each type ≥ 10 times, each pair ≥ 2 (`pairs.json`); confidence rules |

## 3. The scientific frameworks, and why each is used

| What | Framework | Status in science | How we use it | Source |
|---|---|---|---|---|
| Interests | **Holland's RIASEC** (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) | The most widely used career-interest model; the basis of the US Department of Labor's O*NET system | Core input (55% of the fit score) | Holland (1997); Nye et al. (2012) meta-analysis: interests predict performance and persistence |
| Abilities | **ICAR** item families (matrix reasoning, 3D rotation, number series, verbal reasoning) + planning | Public-domain cognitive items validated on about 97,000 people | Our own items, modelled on the ICAR families; 35% of the fit score | Condon and Revelle (2014) |
| Values | **O*NET Work Values** (six values) | The official US occupational values model | Explanations and tie-breaks only | O*NET Resource Center |
| Eligibility | Board, IBCC, PMDC and PEC rules | Binding regulations | Hard gates; a closed door can't be ranked as open | Board and council sources, dated (`streams.json`) |
| **Not used:** personality (Big Five) | — | Weak link to stream choice; privacy risk for minors | Excluded | GAME_DESIGN.md §11 |

## 4. From play to result: the measurement chain

```
Play  →  Events (each choice and task step, offline, ≤ 1 KB)  →  Server checks (schema, order, plausibility)
      →  M1: 6 interest scores ± error   M2: 6 ability levels   Values: 6 counts
      →  Confidence (errors, coverage, consistency)  →  M3: fit score for every path  →  Eligibility gates
      →  Top 3 + Plan B + reasons + confidence  →  stored with the model and content versions (reproducible)
```

### 4.1 M1: interests from story choices

- **Forced choice.** Each Dil/Duniya moment offers two attractive options from **two different RIASEC types**, for example "open the robot up and find the fault" (Investigative) vs "organise the team for the demo" (Enterprising). Choosing one is a comparison between two types.
  - **Why forced choice?** It reduces faking and "everything sounds good" answers, which are common with rating scales.
- **The model:** **Thurstonian IRT** (Brown and Maydeu-Olivares, 2011), the standard model for forced-choice data. It turns many comparisons into a score **and a standard error** for each type.
- **Absolute level:** the "meh / okay / loved it" taps add a **graded response model** (Samejima, 1969). Forced choice alone only shows relative preferences.
- **The planner:** picking 3 of 6 activities is a ranking that adds 9 comparisons per week.
- **Estimation:** Bayesian EAP (expected a posteriori) scoring. The standard error drives the **confidence** level and **the letter's readability**.
- **Calibration:**
  1. **Before any student plays**, item parameters are estimated by **simulating** game choices from **145,828 real respondents** of the Open-Source Psychometrics RIASEC test.
  2. They are **recalibrated on the pilot**.

### 4.2 M2: abilities from everyday tasks

- Six puzzle families inside the story: pack the boot (spatial), complete the pattern (abstract), split the bill (numerical), who took the bat? (logic), plan the route (planning), fix the message (verbal).
- **Untimed.** Only the **first attempt** is scored.
- **Difficulty adapts:** a staircase over 4 levels in R1, then **Rasch/2PL** item response models on the pilot data.
- **Reaction time is never scored.** Phones differ by 50–200 ms, and timing would favour expensive phones.

### 4.3 M3: from scores to ranked paths

Each path in `streams.json` has a RIASEC profile and the abilities it needs. **Where the profiles come from:** each path lists the occupations it leads to (`design/game/frameworks/path_occupations.json`, by exact O*NET title, reviewed by the counsellor panel), and its profile is the mean of those occupations' O*NET Occupational Interest scores, rescaled from 1–7 to 0–1 (`tools/onet_profiles.py`, which records the O*NET version and codes in `streams.json`). The profiles in `streams.json` 1.3.0 were derived from O*NET 31.0 on 11 Nov 2026 (codes recorded per path). O*NET 31.0 lists the source of its interest scores as "Machine Learning/Expert". Military occupations have no O*NET interest data, so the armed-forces path uses related uniformed roles (noted in `path_occupations.json`). The **congruence** score (Holland's person–environment fit) is:

> **fit = 0.55 × interest match + 0.35 × ability support + 0.10 × marks support**, where **interest match = (r + 1) / 2** and r is the Pearson correlation between the student's interest profile and the path profile.

Correlation compares the **shape** of the two profiles (which interests are high and which are low), not their overall level. The first version used cosine similarity; a check on 12 Nov 2026 showed that, because every score is positive, cosine rewarded paths with flat profiles and gave a student with **no** clear interests a confident-looking top 3 (Humanities at 0.93). **Holland's differentiation** (highest minus lowest of the six scores) is now computed for every student: below 0.15 (provisional; calibrated in V1) the interest term is dropped and the app says "no clear interest pattern yet" instead of guessing (FR-51).

The weights are renormalised when marks are missing. The eligibility rules then close any door the student's group or board doesn't allow, and the top 3 open paths are shown.

**Worked example** (computed with the O*NET 31.0-derived profiles in `streams.json` 1.3.0). A class 9 student with interests R .8, I .7, A .3, S .2, E .3, C .4 and strong spatial ability:

| Path | Interest match (correlation → 0–1) | Ability support | Fit (no marks) |
|---|---|---|---|
| FSc Pre-Engineering | 0.96 (r = .93) | 0.70 | **0.86** |
| DAE (technical diploma) | 0.93 (r = .86) | 0.75 | **0.86** |
| ICS | 0.76 (r = .52) | 0.63 | 0.71 |
| FSc Pre-Medical | 0.72 (r = .43) | 0.57 | 0.66 |
| FA Humanities | 0.09 (r = −.82) | 0.40 | 0.21 |

The student sees **DAE, Pre-Engineering and ICS** as their top 3. The reasons are taken from the exact contributions ("you chose building and fixing in 7 of 9 choices; your spatial tasks were strong"). Pre-Engineering and DAE are close, so the app says it is "fairly sure" rather than "sure", and the work values break the tie.

**Three recommenders are compared honestly:**
- **(a) counsellor rules:** AHP weights (Saaty, 1980);
- **(b) congruence:** the default;
- **(c) a LightGBM LambdaRank model with SHAP explanations** (Lundberg and Lee, 2017).

(c) replaces (b) only if it beats (b) by ≥ .05 NDCG@3 and passes the fairness checks (ADR-0006).

## 5. Validation plan: the numbers we will show

| # | Question | Study | Metric | Target (hypothesis, reported either way) | When |
|---|---|---|---|---|---|
| V1 | Is the scoring **feasible**: can ~30 game choices recover a full interest test under simulation? (feasibility only, not validity) | **Simulation** on held-out real respondents from the 145k dataset; game choices generated from their ratings (3 generation rules compared) | r between game θ and full 48-item θ; RMSE; agreement on the top-3 Holland code; parameter recovery; **trade-off curve** of choices vs accuracy; fixed vs **adaptive** pair selection | mean r ≥ .80 with ≤ 30 choices + planner (stretch .90) | **FYP-1** (no pilot needed) |
| V2 | Do game scores measure the same thing as an established inventory? | Pilot in classes 8–10, 5 Apr – 14 May 2027 (N = 150 target, ≥ 100; class 11–12 and O/A-Level validation is future work): every student also takes the **O*NET Mini Interest Profiler** (Mini-IP, 60 items, used unchanged in English under its licence) | Convergent r per type, with 95% CIs | Pre-registered rule: r ≥ .50 on ≥ 4 of 6 types **and** the lower 95% CI bound above .30 for those types; all six CIs reported (published inventory-to-inventory range: .31–.80; game-vs-questionnaire meta-analytic mean ≈ .47) | FYP-2 |
| V3 | Do they measure *different* traits separately? | Multitrait–multimethod matrix (Campbell and Fiske, 1959); a check of the RIASEC circular order | Same-type correlations > different-type correlations | Holds for most types (**exploratory** at N ≈ 150: reported with CIs, no pass/fail claim) | FYP-2 |
| V4 | Is it reliable? | Split-half; a 2-week retest (n ≥ 40); IRT marginal reliability; the individual SE at each score level | Reliability coefficients; conditional SE | ≥ .70 for group-level research use. For an **individual** result, precision comes from that student's SE: High confidence needs every interest SE ≤ .35 (about reliability .88) | FYP-2 |
| V5 | Do recommendations agree with experts? | 120–200 vignettes + 30–60 pilot profiles, ranked blind by 3 counsellors | Top-3 hit rate, NDCG@3, Cohen's κ; panel agreement (Fleiss' κ, Kendall's W) first | (b) or (c) beats the rule baseline (a) | FYP-2 |
| V6 | Is it fair? | Gender is not an input, so the test is for **proxy bias**: DIF on every pair and task item by gender and medium; STEM top-1 and top-3 rates by gender, raw and at matched interest and ability scores (logistic regression); score distributions by group; device-tier effects | Matched-rate difference with 95% CI; flagged items (ΔR² ≥ .035) | Matched gap ≤ .10; no unexplained DIF. Power is limited by the opt-in gender sample, so results are reported as estimates with CIs | FYP-2 |
| V7 | Is it reproducible? | Rescore stored runs | Bit-identical results for the same versions | 100% | Every release (CI) |
| V8 | Is it usable and does it help? | Usability rounds; decision-confidence survey before and after | SUS; task success; confidence change | SUS ≥ 70; ≥ 90% success | FYP-2 |

**Calibrate and test on different students.** Item parameters are recalibrated on pilot data with 5-fold cross-validation: each student's scores used in V2–V6 come from parameters fitted without that student, so the results are not optimistic.

**What N = 100–150 can and cannot support.** It is enough for V2 (convergent correlations), V4 and V8. It is **not** enough for stable structural modelling or 2PL item calibration, so V3, the Rasch calibration of each ability family and the learned ranker are reported as **exploratory** with confidence intervals.

**Language protocol for V2.** The Mini-IP licence does not allow a modified (translated) version without O*NET's permission. Students read it in English; a researcher reads each item aloud in English and may explain a word from a fixed glossary, never the item. Students are asked to self-rate English reading (3 levels). V2 is reported for all students and separately by school medium; the main validity claim rests on the group with adequate English reading. Applying for permission for an Urdu version is an open question for the supervisor (SRS §17.6).

**Sample-size precision:**
- With N = 100, a 95% confidence interval around r = .50 spans about .34–.63.
- With N = 150, it spans about .37–.61.

That is enough to test the r ≥ .50 hypothesis.

### 5.1 How validity is proven: the five sources of evidence

In measurement science, "validity" is not a yes/no badge. It is an **argument backed by evidence** that a score means what we say it means, for the use we put it to (Messick, 1995; Kane, 2013). The *Standards* (AERA, APA and NCME, 2014) list five sources of evidence. Rahyaab collects all five:

| Source of evidence | Question it answers | Rahyaab's evidence | Study |
|---|---|---|---|
| 1. **Test content** | Do the game moments cover each interest type and ability fairly? | Every scene is tagged to an ECD evidence rule; each RIASEC type appears ≥ 10 times and each pair ≥ 2 (`pairs.json`); a content review of scenes by 2 counsellors | Content review (FYP-1) |
| 2. **Response process** | Are students choosing for the reason we think? | Think-aloud sessions with 5–8 students while they play; timing and straight-lining checks | Usability rounds (FYP-1/FYP-2) |
| 3. **Internal structure** | Do the scores hang together as six types? | Model fit of the Thurstonian IRT model; reliability; the circular RIASEC order (neighbouring types correlate more) | V1, V4 |
| 4. **Relations to other variables** | Do scores agree with an established test, and differ from unrelated traits? | Convergent r with the O*NET Interest Profiler; MTMM discriminant pattern; abilities vs school marks | V2, V3 |
| 5. **Consequences of use** | Does using it help, and does it harm any group? | Fairness audit (DIF, matched scores); decision-confidence change; no "closed door" shown as open | V6, V8 |

### 5.2 Benchmarks: how we prove effectiveness with numbers

AI models are judged on public benchmarks. A psychometric recommender is judged the same way, against **reference measures, published thresholds and baselines**:

| What is measured | Our "benchmark" | Accepted threshold | Source of the threshold |
|---|---|---|---|
| Interest scores (M1) | O*NET Interest Profiler, a validated public inventory, as the criterion | Convergent r ≥ .50 (inventory-to-inventory range .31–.80) | Published inventory comparisons |
| Recovery from fewer choices (M1), feasibility only | The full 48-item test on 145,828 real respondents (open RIASEC dataset) | mean r ≥ .80 (stretch .90) | Simulation (V1) |
| Reliability (M1, M2) | Classical and IRT reliability | ≥ .70 for group decisions and research use | Nunnally and Bernstein (1994) |
| Ranking quality (M3) | A blinded counsellor panel's rankings as the reference | NDCG@3 and top-3 hit rate above the **rule baseline**; κ ≥ .40 ("moderate") | Järvelin and Kekäläinen (2002); Landis and Koch (1977) |
| Model choice (M3) | Congruence vs AHP rules vs LightGBM LambdaRank | The learned model is used only if NDCG@3 improves by ≥ .05 **and** fairness holds | ADR-0006 |
| Fairness | Same scores, different gender or medium | Gap in STEM top-1 rate ≤ .10; no unexplained DIF | Fairness audit (V6) |
| Usability | System Usability Scale | ≥ 70 (the published average is 68) | Brooke (1996); Sauro and Lewis (2016) |
| Speed on budget phones | Device performance budget | p95 ≤ 2 s per step (RFC-0003) | NFR targets |

**Baselines.** Every result is compared with simple alternatives, so the gain is visible:
- **random** ranking of eligible paths (the floor);
- **rules only** (marks and group, as a typical school would do);
- **questionnaire only** (the Mini-IP top code mapped to paths);
- **Rahyaab** (game scores + abilities + eligibility).

If Rahyaab does not beat the questionnaire baseline, we report that honestly; the game still has value if it matches the questionnaire while students prefer it (V8).

## 6. What to demonstrate in front of the committee

1. **Live play:** a student plays one week on a budget phone, offline. Show the events being written, then syncing.
2. **Three bot students** (built from real response patterns): an "R/I builder", an "S/A helper" and an "E/C organiser". Run all three through the scoring service live. Their top 3s differ in the expected direction, and "Why this?" shows the evidence.
3. **The V1 simulation chart:** accuracy (r) against the number of choices, fixed vs adaptive. This answers "why 30 choices?".
4. **Eligibility:** change the student's group to Science (Computer). Pre-Medical becomes a closed door with a source, and the routes appear (FR-99).
5. **Reproducibility:** rescore a stored result. It is identical, with its model and content versions shown.
6. **Fairness:** the matched-score audit table (gender swapped, same scores → same recommendations).
7. **Pilot results (FYP-2):** the V2–V6 tables with confidence intervals. Report them honestly, including any target that was missed.

## 7. Threats to validity, and what we do about them

| Threat | Mitigation |
|---|---|
| Calibration data are mostly adult, Western volunteers | Used only as priors; recalibrated on Pakistani pilot data |
| Choosing in a story is not rating items (a mode effect) | V2 tests it directly; recalibration; "planner vs scene" agreement check |
| The Mini-IP benchmark is in English | Researcher reads items aloud for Urdu-medium students; recorded as a covariate |
| Few forced choices → weak identification | GRM taps and planner anchors; identification checks in simulation (RK-19) |
| Path profiles are first-version heuristics | Replaced with O*NET-derived profiles and counsellor AHP weights before the pilot |
| Social desirability ("doctor = respect") | Forced choice; family-neutral framing; no option is marked "better" |
| Careless play | Quality flags lower confidence; never shown as a verdict |

## 8. References

- AERA, APA and NCME (2014). *Standards for Educational and Psychological Testing.*
- Bradley, R. A. and Terry, M. E. (1952). Rank analysis of incomplete block designs. *Biometrika.*
- Brooke, J. (1996). SUS: a quick and dirty usability scale. In *Usability Evaluation in Industry.*
- Brown, A. and Maydeu-Olivares, A. (2011). Item response modeling of forced-choice questionnaires. *Educational and Psychological Measurement.*
- Campbell, D. T. and Fiske, D. W. (1959). Convergent and discriminant validation by the multitrait–multimethod matrix. *Psychological Bulletin.*
- Condon, D. M. and Revelle, W. (2014). The International Cognitive Ability Resource. *Intelligence.*
- Holland, J. L. (1997). *Making Vocational Choices* (3rd ed.).
- Järvelin, K. and Kekäläinen, J. (2002). Cumulated gain-based evaluation of IR techniques. *ACM Transactions on Information Systems.*
- Kane, M. T. (2013). Validating the interpretations and uses of test scores. *Journal of Educational Measurement.*
- Landis, J. R. and Koch, G. G. (1977). The measurement of observer agreement for categorical data. *Biometrics.*
- Lundberg, S. and Lee, S.-I. (2017). A unified approach to interpreting model predictions. *NeurIPS.*
- Messick, S. (1995). Validity of psychological assessment. *American Psychologist.*
- Mislevy, R. J., Almond, R. G. and Lukas, J. F. (2003). *A Brief Introduction to Evidence-Centered Design.* ETS.
- Nunnally, J. C. and Bernstein, I. H. (1994). *Psychometric Theory* (3rd ed.).
- National Center for O*NET Development. *O*NET Database* (Interests and Occupation Data files). U.S. Department of Labor, Employment and Training Administration. Licensed under CC BY 4.0. https://www.onetcenter.org/database.html
- Nye, C. D., Su, R., Rounds, J. and Drasgow, F. (2012). Vocational interests and performance. *Perspectives on Psychological Science.*
- Saaty, T. L. (1980). *The Analytic Hierarchy Process.*
- Samejima, F. (1969). Estimation of latent ability using a response pattern of graded scores. *Psychometrika Monograph.*
- Sauro, J. and Lewis, J. R. (2016). *Quantifying the User Experience* (2nd ed.).

The full research notes and verified citations are in `docs/research/`.
