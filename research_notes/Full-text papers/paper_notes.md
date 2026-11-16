# Full-text paper notes for Rahyaab

Source folder: `W:\Development\papers` (12 PDFs). Text was extracted with pypdf and read in full. The 392-page GREduc proceedings were searched, and only the relevant paper was read in full.

Conventions:
- **Page numbers are journal page numbers** unless marked "PDF p." (the page inside the PDF file).
- Numbers are copied exactly from the paper. Anything I calculated is marked **[computed]**. Anything that does not come from the PDF is marked **[not in PDF, verify]**.
- Quotations are kept to short phrases. Everything else is paraphrased.

## File-to-paper map

| File | Paper |
|---|---|
| `Development_and_initial_validation_of_brief_public.pdf` | Armstrong, Allison & Rounds (2008), JVB |
| `Applying evidence-centered design ... Physics Playground.pdf` | Kim, Almond & Shute (2016), IJT (online-first version) |
| `The_Use_of_Interactive_Narratives_in_Educational_Games....pdf` | Gutierrez, Maldonado Navarro, Villegas-Ch & Mera-Navarrete (2025), IEEE TLT |
| `Int J Selection Assessment - 2022 - Landers ....pdf` | Landers & Sanchez (2022), IJSA |
| `Career_Decision_Confidence_in_Pakistani_Youth_An_E.pdf` | Saya, Aslam & Habib (2025), Psychology in the Schools |
| `Hamdard_Guidanceandcounseling.pdf` | Saya & Aslam (2025), Hamdard Educus (an earlier, weaker report of the **same dataset** as Saya et al. 2025) |
| `Investigating_machine_learnings_capacity_to_enhan.pdf` | Song, Shin, Tang, Hanna & Behrend (2022 online; 2024 issue), Personnel Psychology |
| `NyeSuRoundsDrasgow2012.pdf` | Nye, Su, Rounds & Drasgow (2012), Perspectives on Psychological Science |
| `AdaptationoftheCareerKeyintoUrdu.pdf` | **Hussain**, Jones, Fouad, Ismail, Munaf & Khan (2014), PJPR |
| `Career_Choice_With_the_Serious_Game_Like2be.pdf` | Keller, Makarova & Döring (2023), IJGBL |
| `16440457.pdf` | **Georgiou, Gouras & Nikolaou (2019)**, IJSA: the gamified SJT paper |
| `GREDUC_GREduc2019_E-proceedings.pdf` | GREduc 2019 seminar proceedings (Universiti Putra Malaysia). The only relevant paper is Arokianathan, Zainudin & Yusop (2019), "A review on Holland's career theory", pp. 194–205 |

---

## 1. Armstrong, Allison & Rounds (2008): brief public-domain RIASEC markers

**Citation (APA 7).** Armstrong, P. I., Allison, W., & Rounds, J. (2008). Development and initial validation of brief public domain RIASEC marker scales. *Journal of Vocational Behavior, 73*(2), 287–299. https://doi.org/10.1016/j.jvb.2008.06.003. The issue number (2) is not printed in the PDF **[verify]**.

**What it studied.** The authors built short RIASEC scales that are free of copyright, for research use. There are two kinds:
- **Activity-based scales:** two alternate forms (Set A and Set B), with **8 items per type** in each. The items were chosen from the 30-item-per-type scales of the O*NET Interest Profiler (IP; 180 items).
- **Occupation-based scales:** two alternate forms (Set A and Set B), with 8 O*NET job titles per type in each. They were chosen from 30 titles per type.

So each set has 48 items, and there are **96 activity items** across the two activity sets (p. 287, p. 289).

**Sample.** Three US college samples, 1,024 women and 639 men in total (p. 287):

| Sample | N | Source | Mean age (range) | Used for |
|---|---|---|---|---|
| 1 | 814 in the text (494 F, 322 M). Those counts add up to 816, which is the figure in the Table 1 note (a minor internal inconsistency) | Psychology participant pool, Midwestern university | 19.7 (17–50) | Item selection |
| 2 | 534 (328 F, 206 M) | Psychology participant pool | 19.5 (17–31) | Validation, and building the occupation scales |
| 3 | 313 (202 F, 111 M) | Career development course, second university | 19.6 (18–23) | Convergence with the Strong Interest Inventory |

Samples 1 and 2 were about 87–89% White (p. 289).

**Method.**
- The IP's 3-point format was changed to a **5-point Likert scale (1 = strongly dislike to 5 = strongly like)**. Scales are summed (p. 290).
- Items were selected using multidimensional scaling of the 180×180 item correlation matrix, plus judgement about RIASEC content (pp. 290–291).
- Structure was tested with circular unidimensional scaling (CUS). The fit statistic is VAF, with a cutoff of .60 (p. 291).

**Key results.**

| Result | Values | Page |
|---|---|---|
| Reliability (alpha), full 30-item IP scales | .93–.97 | p. 291 |
| Reliability, 8-item activity scales, Sample 1 | **.79–.93 (mean .87)** | p. 291, Table 1 |
| Reliability, 8-item activity scales, Sample 2 | **.79–.94 (mean .88)** | p. 291, Table 2 |
| Reliability, 8-item occupation scales | **.74–.88 (mean .84)** | p. 292 |
| Convergent validity: activity scales vs the 30-occupation ratings | .72–.87 (mean .80) | p. 291, Table 4 |
| Convergent validity: activity scales vs SII General Occupational Themes (n = 313) | **.56–.72 (mean .64)** | p. 291, Table 4 |
| Convergent validity: occupation scales vs brief activity scales | .73–.86 (mean .78) | p. 292 |
| Structure (CUS VAF), Sample 1 | Women .76 (Set A) / .73 (Set B); men .79 / .72 | p. 292 |
| Structure (CUS VAF), Sample 2 | Activity .80 / .73; occupation .90 / .88 | p. 293 |

All structural results kept the R-I-A-S-E-C order and were above the .60 cutoff.

**Licence.**
- The IP items were already in the public domain, being US Department of Labor items with no copyright restrictions (p. 289).
- The brief scales "will be made available on a public domain website" (p. 293).
- The paper uses the term "public domain" throughout and names no other licence.
- The freedoms to reword, translate and administer items without permission are stated for Goldberg's IPIP model. Liao et al.'s interest markers are described as offering the same freedoms (p. 288).

**Limitations stated by the authors.**
- The scales are **for research**. In their current form they are not intended for use in career counselling. Norms for diverse groups and interpretive materials would be needed first (p. 295).
- Evidence comes only from college students. Links to real choices, and validity across cultures, still need work (p. 296).

**Use in Rahyaab.**
- This is the source for the **item content of the Career Bazaar**: 48 core cards, 8 per type.
- Activity Set B gives a ready-made, structurally matched source for the 24 reserve CAT cards.
- The reliabilities of about .79–.94 for 8 items justify **8 cards per type** as a starting point.
- The SII convergence of .56–.72 is a realistic benchmark for convergent validity in §14.4.
- Cite the authors' warning that the scales are not for counselling as a reason to (a) recalibrate on Pakistani pilot data, (b) build local norms, and (c) word results as "starting points".
- The paper does **not** mention the OpenPsychometrics/Kaggle dataset.

Example in-text citation: *Armstrong et al. (2008) showed that 8-item public-domain RIASEC activity scales keep alphas of .79–.94 and correlate .56–.72 with the Strong Interest Inventory.*

---

## 2. Kim, Almond & Shute (2016): ECD for game-based assessment in Physics Playground

**Citation.** Kim, Y. J., Almond, R. G., & Shute, V. J. (2016). Applying evidence-centered design for the development of game-based assessments in Physics Playground. *International Journal of Testing, 16*(2), 142–163. https://doi.org/10.1080/15305058.2015.1108322.
- The PDF is the online-first version (pages "00: 1–22", downloaded December 2015).
- Volume, issue and pages 16(2), 142–163 **[not in PDF, verify]**.
- The page references below are pages of the PDF.

**What it studied.** A design paper and case study. It describes the **10-step procedure** the Physics Playground (PP; formerly Newton's Playground) team used, which adapts evidence-centred design (ECD) for game-based assessment (GBA). The **scoring engine is a Bayesian network** (p. 1).

**Sample.** No new study. It draws on an earlier field study of **167 middle-school students (grades 8–9)** (Shute et al., 2013; p. 6) and on the PP field test data.

**Method.** The paper explains the four ECD models:
- competency model: what is measured;
- evidence model: how, through evidence rules plus a statistical model;
- task model: where;
- assembly model: how much (pp. 2–4).

It also shows how Bayes nets implement these models (p. 5).

**The 10 steps (Fig. 2, p. 7).** They are grouped into four phases: Task Authoring, conceptual assessment framework (CAF), "Nuts & Bolts" and Debugging. The process is iterative.

| Step | What it involves | Page |
|---|---|---|
| 1 | Identify key variables: purpose, competencies, in-game observables. Use an augmented Q-matrix | pp. 7–8 |
| 2 | Draw the network structure: competency model plus evidence fragments ("links") | pp. 8–10 |
| 3 | Write operational definitions of the observables from the logs | pp. 11–12 |
| 4 | Parameterise the conditional probability tables (CPTs) | p. 12 |
| 5 | Elicit prior values from experts | pp. 13–15 |
| 6 | Optional: build proxy variables for the latent competencies, from the pre/post-test | p. 15 |
| 7 | Compute observables from game logs (evidence identification, then evidence accumulation) | p. 16 |
| 8 | Update the CPTs with field data | p. 17 |
| 9–10 | Debugging | pp. 18–19 |

**Key quantitative and design results.**
- **Field-study validity:** the number of gold trophies per agent correlated with an external physics test: ramp r = .27, lever .22, pendulum .31, springboard .40 (p < .01) (p. 6).
- **Network:** four agent nodes (ramp, lever, pendulum, springboard) plus an overall Newton's-laws node. Each observable has three states: Gold, Silver or None (p. 10).
- **Category model:** the **graded response model did not fit**, because the gold/silver and silver/none boundaries needed different discriminations. They switched to the **generalized partial credit model** (pp. 12–13).
- **Expert priors:** 74 levels × 4 observables. Each observable got four expert values: two difficulties (−5 to 5) and two discriminations (0 to 2). The Low/Medium/High states were placed at −0.97, 0 and +0.97 (pp. 13–14).
- **Calibration:** with expert numbers alone, the network score correlated about **.1** with the post-test. After calibrating the CPTs (the prior was weighted as 10 pseudo-observations), it rose to about **.36**, close to the gold-trophy count (p. 17).
- **Debugging found:**
  - an observable that had been reverse-coded by accident;
  - evidence balance sheets, used to spot levels with high weight of evidence;
  - a "stacking" exploit that let players solve levels without physics knowledge. It led to changes in the game mechanics and the detection rules (p. 18).
- **Framing matters:** a $25 prize for the most trophies pushed students to play for trophies rather than for physics (p. 19).
- **Generality:** most steps also apply if a simple IRT or tally score replaces Bayes nets. High-stakes use would need better-defined latent nodes (p. 20).

**Limitations.** One game and one domain (qualitative physics). The proxy-variable calibration biases validity estimates upward. A full EM algorithm was not implemented. Validity correlations were modest (pp. 15, 17–18).

**Use in Rahyaab.**
- Use ECD as the **design method** for each mini-game: claims, then observables, then evidence rules, then the scoring model. Keep a Q-matrix of items/cards → scales.
- Make evidence identification on the device (event logs) separate from evidence accumulation on the server (Python scoring engine). This is the four-process architecture.
- **Test GPCM against GRM** for the 3-category swipe (Skip / Try / Love). Kim et al. dropped the GRM for exactly this reason.
- Use evidence balance sheets and replay review to catch exploits, and avoid prize or points framing.
- Cite it as an honest warning that early validity can be low (≈ .1 → .36).

---

## 3. Gutierrez et al. (2025): RIASEC in an AI-driven interactive narrative (Ecuador)

**Citation.** Gutierrez, R., Maldonado Navarro, A., Villegas-Ch, W., & Mera-Navarrete, A. (2025). The use of interactive narratives in educational games to assess vocational interests: An application of the RIASEC test integrated with OpenAI. *IEEE Transactions on Learning Technologies, 18*, 639–651. https://doi.org/10.1109/TLT.2025.3579226. Open access, CC BY 4.0.

**What it studied.** A Unity serious game that hides RIASEC items inside narrative decisions. Scenarios are generated in real time by **GPT-4 Turbo (gpt-4-0125-preview)**, with temperature 0.8 and a 512-token limit, through a Node.js/Express backend (pp. 640–642).

**Sample.**
- **N = 200**, Ecuador (the authors are at Universidad de Las Américas / Universidad Internacional del Ecuador, Quito).
- 100 last-year high-school students (aged 16–18) and 100 first-year university students (aged 18–20), 50/50 gender (p. 643).
- Compliance was 96%, with 8 dropouts (p. 645).
- Self-reported SES: 25% low, 50% middle, 25% high (p. 646).

**Method.**
- **Exposure:** 8 sessions over 4 weeks, each 45–60 minutes, giving 1,600 session records (pp. 644).
- **Measures:**
  - a traditional RIASEC test before and after the game;
  - an **ad hoc 12-item, 5-point satisfaction questionnaire** (usability, narrative, clarity, vocational impact; p. 643);
  - 30 interviews analysed in NVivo (p. 645).
- **Analyses:** ICC for consistency across sessions, Pearson r between game and traditional test, ANOVA and paired t-tests before vs after, regression on overall satisfaction, and correlations with grades (pp. 644–645).

**Key results.**
- **Consistency:** ICC **> .65** on all six dimensions (p. 646, Table III).
- **Agreement with the traditional test:** Pearson r **> .75** on all six dimensions (pp. 646–647, Table IV). The per-scale values in Tables III, IV and X are not in the PDF's text layer and must be read from the rendered tables.
- **Before vs after the game:** RIASEC responses changed significantly on R, I, S, E and C. A did not reach significance (ANOVA p = .065; t-test p = .067; p. 647).
- **Satisfaction (Table VII, pp. 647–648):**

| Category | Mean (SD) |
|---|---|
| Narrative | **4.5 (0.6)** |
| Vocational impact | 4.4 |
| Usability | 4.3 |
| Clarity of instructions | **4.2 (0.8)** |

  The abstract gives the range as **4.2–4.5**. The results text says averages ranged "between 4.0 and 4.5" (p. 647).
- **Regression on overall satisfaction (Table VIII, p. 648):** narrative **0.40**, vocational impact 0.38, usability 0.35, clarity 0.25, all p < .05. The paper calls these "coefficients" and does not say whether they are standardized.
- **Impact items (Table IX, p. 649):** "helped me identify my interests" 4.2 (SD 0.8); confidence in career choice 4.1; would recommend 4.5.
- **Correlation of game responses with academic grades (p. 649):** science **r = .42**, social studies .38, mathematics .35, language .30, art .25, all p < .05.

**Limitations.** Stated by the authors (p. 650):
- the sample may not generalise;
- self-report satisfaction;
- turning RIASEC items into narrative raises **construct-validity concerns**, and further validation is needed.

Additional weaknesses I observed:
- The satisfaction "predictors" are themselves satisfaction subscales, which is circular.
- No per-scale coefficients are stated in the text.
- Equation (1) prints F = MS_between/MS_within "= 1".
- Large before/after changes in RIASEC scores sit uneasily with a claim of r > .75 accuracy.
- The paper does not say which RIASEC instrument was used ("widely used structured versions"; p. 643).
- The questionnaire is available only on request.

**Use in Rahyaab.**
- It is the closest prior work to **Story Town**: embedding RIASEC choices in narrative is feasible and well liked.
- It is the only published game-vs-test RIASEC agreement figure that includes **high-school students** (r > .75). Cite it as weak and preliminary.
- It supports a guardrail: **do not generate narrative with an LLM at run time** in a measurement instrument, because it breaks fixed exposure (Rahyaab FR-20 uses fixed, balanced nodes).
- It supports reporting satisfaction separately from validity.

---

## 4. Landers & Sanchez (2022): game-based, gamified and gamefully designed assessment

**Citation.** Landers, R. N., & Sanchez, D. R. (2022). Game-based, gamified, and gamefully designed assessments for employee selection: Definitions, distinctions, design, and validation. *International Journal of Selection and Assessment, 30*(1), 1–13. https://doi.org/10.1111/ijsa.12376. An editorial for a special issue; open access, CC BY-NC.

**What it studied.** A conceptual review. No sample.

**Definitions (p. 1 abstract; p. 2 and Table 1).**
- **Game-based assessment (GBA):** an *assessment method*. Candidates play through a **core gameplay loop** while traits are inferred. It aims to produce "gameful experience", which needs three states: goals that seem nontrivial but achievable, motivation to pursue them under arbitrary rules, and voluntary participation (p. 3). If there is no core loop, it is "probably neither a game nor a GBA" (p. 4).
- **Gamification:** a *redesign strategy*. Game mechanics are added to an **existing** assessment, which stays the same method. Examples are framification and storification (p. 2).
- **Gameful design:** a *design strategy*. A **new** assessment is built using game concepts (p. 2).
- A gamified test can become a GBA. A storified SJT with branching and character creation is the example, but the concepts stay distinct (p. 5).

**Key points with numbers.**
- Landers et al. (in press): latent convergence of **.97** between a cognitive-ability GBA and an ability battery, but observed scores were contaminated by gender (p. 4).
- Melchers & Bausch: small effects favouring males and younger people (p. 4).
- A gamified BART risk task correlated **r = .04** with a traditional risk measure (p. 4).
- In educational GBA, score gains while playing are expected. In assessment, they confound measurement (p. 4).
- Theory-driven vs data-driven scoring (p. 6). Theory-driven scoring should combine **content validation** (subject-matter experts rate behaviours for trait relevance) with **nomological-net validation** (convergence and divergence with known measures). Metrics that fail either test are dropped.
- Points, badges and leaderboards are the most common mechanics and the easiest to implement harmfully (p. 7).

**Validation recommendations (pp. 9–11).**
- The usual standards (AERA/APA/NCME 2014 Standards; SIOP Principles) still apply.
- **Choose the reliability estimate from the theoretical sources of error.** Alpha may be inappropriate for a GBA. Test–retest with enough delay to forget the mechanics may be better. Levels can be treated as items, so alpha or omega becomes possible.
- For gamified or gamefully designed tests, **evaluate them by the standards of the underlying method**.
- Use all four sources of validity evidence: content, response processes, internal structure, relations to other variables.
- Validity of the *game elements* is a separate question. It needs evidence of good design, plus causal evidence (such as experiments) of the elements' effects on mediators and outcomes.
- **Fairness:** any mid-game ML predictions must be evaluated too, and third-party cloud ML services must be checked for privacy.
- **Reactions:** measure reactions to individual components separately.

**Limitations.** Written for employee selection. Mostly theory. It notes that empirical GBA work is sparse (p. 4).

**Use in Rahyaab.**
- **Terminology** in the glossary and in Chapter 2:
  - Career Bazaar is a *gamified* assessment: marker items redesigned as cards.
  - Story Town is a *gamefully designed or storified* measure.
  - Puzzle Lab tasks are the closest to GBA.
- **Reliability choice:** test–retest and IRT marginal reliability, not alpha by default.
- Report reactions (SUS, IMI) **separately** from validity.
- Make the absence of points-for-answers in the reward design explicit.

---

## 5. Saya, Aslam & Habib (2025): career decision confidence in Pakistani youth

**Citation.** Saya, A., Aslam, R., & Habib, Z. (2025). Career decision confidence in Pakistani youth: An evaluation of general and psychometric counseling. *Psychology in the Schools, 62*, 3428–3439. https://doi.org/10.1002/pits.23552. Issue number not shown in the PDF.

**What it studied.**
1. Validation of the Career Decision Self-Efficacy Scale (short form; Betz et al., 1996), translated into Urdu and adapted.
2. A comparison of CDSE between students who had psychometric-test counselling (PT) and students who had general guidance and counselling (GGC).

**Sample (pp. 3431–3432).**
- Karachi, 2022–23. Mean age 18.59 (SD 3.72).
- The emailed survey got 3,275 responses. 1,831 (56%) had never had counselling and were excluded.
- **N = 1,445** had had counselling: **645 PT (45%) and 800 GGC (55%)**; 821 male and 624 female.
- Level: 890 A-Level (62%), 374 O-Level (26%), 161 first-semester undergraduates, **19 Intermediate and 1 Matric**. The sample is overwhelmingly Cambridge-system.

**Method.** EFA (principal axis factoring, varimax), CFA in AMOS, Cronbach's alpha, and an independent t-test (p. 3432).

**Key results.**
- KMO = .968. Bartlett χ² = 30,569.419, df = 300 (p. 3432).
- Five factors were retained. One occupational-information item (internet search) was dropped, giving **24 items** (p. 3433).
- **CFA fit (Table 1, p. 3432):** CMIN/DF 3.17, **CFI .864, TLI .844**, RMSEA .078. The authors call this "acceptable", although CFI and TLI fall below the > .90 cutoff in their own table.
- Standardized loadings ranged from .59 to .86 (pp. 3433–3434).
- **Reliability:** alpha .965 overall. Subscales: self-appraisal .896, occupational information .752, goal selection .884, planning .861, problem solving .836 (p. 3434).
- **PT vs GGC (p. 3434, Table 2):** M = 4.4051 (SD 0.489) vs 3.4233 (0.749); t = 29.986, p < .001.
- **The effect sizes in Table 2 are wrong.** The column labelled "Cohen's d" (0.646 for the total; 0.693–0.733 for subscales) is numerically equal to the **pooled SD**, not d **[computed]**. Dividing the mean difference by that pooled SD gives:

| Scale | True d **[computed]** |
|---|---|
| Total CDSES | ≈ **1.52** |
| Self-appraisal | 1.54 |
| Occupational information | 0.84 |
| Goal selection | 1.47 |
| Planning | 1.34 |
| Problem solving | 1.69 |

**Limitations.**
- Cross-sectional and self-report. **Counselling type was self-selected, not assigned**, so the PT–GGC difference is associational and confounded (PT is more common in affluent private schools).
- One city. Fewer than 1.5% of the sample were in the Matric or Intermediate streams.
- Weak CFA fit. The response format is described inconsistently (5-point, "0 to 5").
- The authors only call for replication (p. 3435). They do not discuss confounding.

**Use in Rahyaab.**
- Local evidence that structured, assessment-based guidance goes with higher career-decision self-efficacy among Pakistani students, which supports the problem statement.
- A **validated Urdu/Pakistani 24-item CDSE-SF** that could be the pre/post outcome measure for a later impact study (§17 Q9 "baseline for CDSE").
- Cite it as **correlational**. Give the effect as d ≈ 1.5 [computed] or quote only the means and t.

---

## 6. Saya & Aslam (2025): Hamdard Educus paper (same dataset)

**Citation.** Saya, A., & Aslam, R. (2025). Exploring career guidance in Pakistan's educational landscape: A comparative analysis of different counselling approaches. *Hamdard Educus, 4*(1), 52–66. O-ISSN 2958-6909. No DOI is shown.

**What it is.** A second report of the **same Karachi CDSE survey** as Paper 5. The aim and the 3,275 / 1,831 split are the same, and the t-test is identical (t = 29.986; M 4.4051 vs 3.4233).

**Numbers that differ from Paper 5.**

| Item | Hamdard paper | Paper 5 |
|---|---|---|
| Counselled sample | 1,444 | 1,445 |
| PT / GGC split | **643 / 801** (abstract, p. 57; Table 1, p. 58) | 645 / 800 (also used in this paper's own t-test table, p. 60) |
| Male / female | 818 / 626 | 821 / 624 |
| Instrument | "CDSE-SF" (5 subscales), alpha .965 | Same |

**Extra demographics (pp. 58–59, Table 1).**
- 98.6% Karachi.
- Level: A-Level 61.1%, O-Level 26.2%, Intermediate 1.2%, Matric 0.07%.
- Age: 12–17 years 40%; 18–25 years 58.6%.
- **64.1% report parental income above PKR 200,000 a month**, a highly affluent sample.

**Method flaw.** The "regression analyses of impact" (pp. 59–60) use a predictor with **SD = 0**, a constant group code (GGC = 1.00 for everyone; PT = 2.00 for everyone). They estimate nothing. The only valid comparison is the t-test.

**Use in Rahyaab.**
- The demographic table is useful for describing *who currently gets counselling* in Pakistan: affluent, Cambridge-system, Karachi.
- Do **not** cite its regression "impact" claims.
- Prefer Saya et al. (2025) in *Psychology in the Schools* for any numbers.

---

## 7. Song et al. (2022/2024): machine learning and the prediction of career choice

**Citation.** Song, Q. C., Shin, H. J., Tang, C., Hanna, A., & Behrend, T. (2024). Investigating machine learning's capacity to enhance the prediction of career choices. *Personnel Psychology, 77*, 295–319. https://doi.org/10.1111/peps.12529.
- Accepted May 2022 and published online in 2022, so "Song et al., 2022" refers to the online-first version. Cite the volume as 2024.
- Open access, CC BY.

**What it studied.** O*NET-style **profile matching** compared with an **ML-augmented** method for predicting RIASEC career choice:
- occupational membership, for employed people;
- dream job (vocational aspiration), for unemployed people.

**Sample.**
- **N = 81,267** (from 84,349 before cleaning). Adults who took a TIME magazine online survey in 2016.
- 75% employed, 62% female, mean age 38 (SD 13.46) (p. 302).
- Interests were measured with the 16-item **PGI-Mini** on a 7-point scale. The target is the RIASEC profile of the chosen O*NET title (p. 302).

**Method.**
- Inputs: 16 item scores plus 6 scale scores.
- Four models (neural network, k-NN, elastic net, random forest), ensembled by averaging.
- Tuned with a random grid and 10-fold cross-validation.
- **Trained and tested on random samples of n = 300, repeated 100 times**, to mimic one organisation (p. 303).
- Metrics: high-point hit rate, differential hit rate (hit rate minus base rate), Euclidean distance and profile correlation (pp. 303–305).

**Key results (Table 5, p. 307).**

| Outcome | Hit rate: profile → ML | Euclidean distance: profile → ML | Profile r: profile → ML |
|---|---|---|---|
| Occupational membership | .28 → **.34** | 5.18 → 4.07 | .23 → .44 |
| Vocational aspiration | .34 → .36 | 4.97 → 4.25 | .28 → .36 |

**Rare-category under-prediction (Table 6, p. 308; discussion pp. 310–311).**
- Enterprising (base rate .35): ML hit rate **.79** vs profile .38.
- Artistic (base rate .06): ML hit rate **.00** vs profile .45.
- For occupational membership, ML's hit rate fell below the base rate for R, I, A and S (differential hit rates −.07 to −.13).
- For aspirations, ML did better only for Enterprising.
- The authors put this down to base-rate learning. They recommend combining the two methods: ML for high-base-rate categories and profile matching for low-base-rate ones. They also stress that training data must be local and representative (p. 311).

**Limitations (pp. 313–314).**
- Adults, not adolescents.
- Aspiration data came from unemployed adults.
- No outcomes after the choice were measured.
- Occupational imbalance across categories.
- Small-sample training. ML may hide bias.

**Use in Rahyaab.**
- Supports **ADR-05** (transparent baselines first) and the M3 fairness audit.
- In Pakistan, Pre-Medical and Pre-Engineering dominate, so a learned ranker trained on local choices would tend to under-recommend Arts, Commerce or DAE. Report recall per stream and differential hit rate against base rate, not only overall top-3 accuracy.

---

## 8. Nye, Su, Rounds & Drasgow (2012): interests and performance

**Citation.** Nye, C. D., Su, R., Rounds, J., & Drasgow, F. (2012). Vocational interests and performance: A quantitative summary of over 60 years of research. *Perspectives on Psychological Science, 7*(4), 384–403. https://doi.org/10.1177/1745691612449021.

**What it studied.** A meta-analysis of the relationship between interests and performance and persistence, in work and academic settings, comparing **interest scale scores** with **congruence indices**.

**Sample.**
- 60 studies: 42 employed samples and 18 academic samples.
- **568 correlations**, total **N = 15,301** (9,472 employed; 5,829 academic). Studies date from 1942 to 2011 (p. 389).

**Method.** Correlations were corrected for indirect range restriction and criterion unreliability (Hunter–Schmidt–Le). Regression-based meta-analysis was used to allow for dependent correlations (p. 389).

**Key results.**
- **Work samples:**
  - baseline interest–performance correlation **.20**; with congruence indices **.36** (+.16) (p. 390);
  - congruence was always the stronger predictor across criteria (Table 1, p. 390);
  - in longitudinal studies, congruence correlated .28 with task performance, .35 with OCB and .34 with persistence (p. 391);
  - first-letter **match** between interest scale and occupation: **.27**; adjacent types .23; alternate types .15 lower and opposite types .21 lower than matching (p. 391).
- **Academic samples:**
  - baseline **.23**; with congruence **.32** (p. 391);
  - predicted values (Table 2, p. 392): grades .18 (scale score) vs **.27** (congruence); persistence .22 vs .31;
  - **multiple-major samples are lower:** congruence correlates .16 with grades and .20 with persistence; the SII is .19 lower than other inventories (p. 392);
  - in the appendix, the congruence moderator in academic samples was **not significant (b = .09, p = .22)** (p. 399).
- Interests could help in admissions decisions. Mean-level group differences raise **adverse-impact** concerns (p. 393).

**Limitations.** The moderators covered were limited. No group-specific (gender or race) correlations were available. Expressed interests were excluded (p. 393).

**Use in Rahyaab.**
- Theoretical and empirical support for the **congruence baseline (FR-44 b)**: fit between a student's interests and a stream predicts grades and persistence (about .27–.32 corrected).
- It also sets **modest expectations**: correlations are about .2–.3, and smaller when the sample spans many majors.
- The note on adverse impact supports the gender-fairness audit.

---

## 9. Hussain, Jones, Fouad, Ismail, Munaf & Khan (2014): Career Key in Urdu

**Citation.** Hussain, S., Jones, L. K., Fouad, N., Ismail, I. M., Munaf, S., & Khan, M. A. (2014). Adaptation of the Career Key into Urdu. *Pakistan Journal of Psychological Research, 29*(2), 187–201. **First author: Sadiq Hussain** (Karakoram International University). Lawrence K. Jones, the author of the Career Key, is second author.

**What it studied.** Translation (with back-translation and expert merging) and initial validation of the **Career Key Urdu (CKU)**:
- 24 statements on a 0–2 scale plus 42 occupations on a 0–2 scale;
- 4 statements and 7 occupations per RIASEC type;
- scores range from 0 to 22 per type (pp. 189–191).

**Sample.**
- **N = 179**: 94 boys and 85 girls, mean age 17.42 (SD 2.14), aged 14–24.
- Karachi and Lahore; 89 private and 90 public institutions.
- 55 in grades 9–10, 56 in grades 11–12, 68 first-semester university students.
- **All fluent in English and Urdu.** 95% middle class and urban.
- 11 further students were excluded because they missed the second session (pp. 190–192).

**Method.** The English CK was given first and the CKU **one week later**, always in the same order (order effects were not controlled; pp. 191–192). The analyses were:
- alpha by gender and level;
- CK–CKU correlations;
- Hubert & Arabie randomization test of circular order, which gives a correspondence index (CI).

**Key results.**
- **CKU alpha, overall:** .73–.76 (Table 1, p. 192; discussion p. 196).
- **Alpha by subgroup:** .67–.86 across subgroups (Tables 1–2, pp. 192–193).
- **CK–CKU correlations:** **.85–.90** overall; .73–.91 across subgroups (Table 3, p. 193).
- **Hexagon fit (Table 4–5, p. 195):**

| Sample | Instrument | Predictions met (of 72) | CI |
|---|---|---|---|
| Pakistan | **CKU** | 42 | **.16** |
| Pakistan | **CK (English)** | 41 | **.13** |
| US (Jones, 1990) | CK | 66 | .83 |
| US (Jones, 1990) | VPI | 58 | .61 |

  - All Pakistani CIs were non-significant (p > .05), meaning the ordering was random.
  - Subgroup CIs ranged from .02 (women, CKU) to .25 (men, CKU).
- **Gender differences (Table 6, p. 196):** boys higher on Realistic (d = .78), Conventional (.50) and Enterprising (.30); girls higher on Artistic (.53).

**Limitations stated by the authors (p. 198).** Small sample from two cities only. No test–retest, convergent or discriminant validity.

**Interpretation note.** The **English original also failed** in the same bilingual students. So the misfit cannot be blamed on the Urdu translation. It reflects either RIASEC structure in this population or the instrument and sample, which was small and bilingual. The authors suggest cultural and economic reasons: choices driven by opportunity and status rather than interest (p. 197).

**Use in Rahyaab.**
- Justifies RK-04 and M1: score the six scales independently, and report a circumplex check without depending on it.
- Expect sizeable gender differences on R and A. This is a reason for DIF checks and gender-neutral content.
- Cite it as **Hussain et al. (2014)**.

---

## 10. Keller, Makarova & Döring (2023): the serious game like2be

**Citation.** Keller, C., Makarova, E., & Döring, A. K. (2023). Career choice with the serious game like2be. *International Journal of Game-Based Learning, 13*(1), 1–18. https://doi.org/10.4018/IJGBL.327788. Open access, CC BY.

**What it studied.**
- **The game:** web-based. The player acts as a job coach, matching avatars of deliberately ambiguous gender to 44 occupations under time pressure (p. 4).
- **The study:** a quasi-experiment with three groups:
  - control: conventional lessons;
  - treatment 1: like2be only;
  - treatment 2: like2be plus a 4-lesson teaching concept and card set.
- **Outcomes:** self-perceived occupational knowledge, perceived fit with occupations, and gender-stereotyped attitudes (pp. 6–7).

**Sample.**
- **809** lower-secondary students from six German-speaking Swiss cantons. **532 had complete pre and post data** (65.8%).
- Aged 12–17 (M = 13.77, SD 0.82). 50.6% girls.
- Control n = 133; treatment 1 n = 220 (221 in the tables); treatment 2 n = 179.
- 81.8% already had a desired occupation at baseline (p. 7).

**Method.** Pre/post over 6 weeks, with an ANCOVA on the post-test controlling for the pre-test (p. 8).

**Key results (pp. 8–10).**
- **Knowledge about occupations:** F(2,529) = 5.39, p = .005, ηp² = .02. Only treatment 2 beat control (mean difference 0.22, p = .041).
- **Number of occupations known:** not significant (p = .275).
- **Number of occupations judged a personal fit:** F(2,529) = 4.28, p = .014, ηp² = .02. Treatment 1 beat control (mean difference 0.93, p = .041).
- **Fit-quality scale:** not significant (p = .683).
- **Gender-stereotype attitudes:** not significant, F = 2.43, p = .089. Descriptively they moved slightly *toward* stereotyping in the game groups (p. 12).
- **Scale reliabilities:** fit .78/.82; stereotype .81/.79 (p. 8).
- Two of three hypotheses were rejected. Effects were "very small" (p. 11).
- **Learning motivation and engagement were not analysed** (p. 12).

**Limitations (p. 13).**
- The control condition was not equivalent.
- The intervention was cut to four lessons.
- Only self-report measures were used.
- Randomisation inside the game meant students saw different occupations.

**Note.** The claim that cognitive engagement predicted learning while enjoyment and flow did not is **not in this paper**. This paper only cites "Keller et al., 2023" (p. 2) for a finding about cognitive processes. That reference is Keller, Doering & Makarova (2023), *Education Sciences, 13*(1), 16, https://doi.org/10.3390/educsci13010016, a different paper that is not in the folder.

**Use in Rahyaab.**
- Evidence that career serious games produce **small** effects on adolescents' world-of-work knowledge, and that **teacher scaffolding** matters. This supports the teacher dashboard and "talk together" materials.
- A cautionary result on gender stereotypes: a game alone did not reduce them.
- The closest adolescent age group in the folder (13–14 years).

---

## 11. Georgiou, Gouras & Nikolaou (2019): gamified SJT (file `16440457.pdf`)

**Citation.** Georgiou, K., Gouras, A., & Nikolaou, I. (2019). Gamification in employee selection: The development of a gamified assessment. *International Journal of Selection and Assessment, 27*(2), 91–103. https://doi.org/10.1111/ijsa.12240.
- The PDF is the early-view version (pages "1–13").
- Volume, issue and pages 27(2), 91–103 **[not in PDF, verify]**.
- The page references below are pages of the PDF.

**What it studied.** A 25-scenario situational judgement test (SJT) covering resilience, adaptability, flexibility and decision-making. A professional writer turned it into an "islands of adventure" story with avatars, feedback, narrative and voice-overs. The study tested construct validity and equivalence between the two modes (pp. 4–5).

**Sample.**
- Development: 20 HR professionals interviewed; 7 experts set the scoring key; 8 did face validation.
- **Study 1:** N = 321 business students and graduates, 61% female, mean age 26.5.
- **Study 2:** 410 employees and job seekers, 46% female, mean age 29. Of these, **N = 97** completed both the SJT and the gamified version.
- Cross-validation used 731 people (321 + 410). All participants were in Greece (p. 4).

**Key results.**
- **Study 1 (SJT vs self-report scales):** standardized β for same-construct relationships was **.350–.389**. Some cross-relations were also significant (p. 5, Table 1).
- **Gamified version vs self-report (n = 97):**

| Facet | β |
|---|---|
| Resilience | **.565** |
| Adaptability | .528 |
| Flexibility | .552 |
| Decision-making | **.450** |

  All p < .01. Small cross-loadings were also present (p. 7).
- **Study 2 CFA (n = 410):** χ²(269) = 306.94, p = .05; CFI .91; NNFI .89 (p. 7).
- **Multigroup invariance (N = 731):** factor loadings and factor correlations were invariant. Factor variances were not (p. 9, Table 3), giving partial invariance.

**Limitations.**
- Fit was marginal, which the authors acknowledge (p. 8).
- The convergent sample was small (n = 97), and the criteria were self-report scales.
- Adults in an employee-selection context.
- No criterion validity with real outcomes. Applicant reactions were reported elsewhere.

**Use in Rahyaab.** Supports **gamifying an existing validated item set** (the Career Bazaar approach): converting an assessment into a story-game kept convergent validity (β ≈ .45–.57) with partial invariance. Cite it with the n = 97 and adult-sample caveat.

---

## 12. Arokianathan, Zainudin & Yusop (2019): "A review on Holland's career theory" (GREduc 2019)

**Citation.** Arokianathan, N., Zainudin, Z. N., & Yusop, Y. M. (2019). A review on Holland's career theory. In S. N. Alias, M. M. Muhamad, L. Ismail, T. S. Yet, & M. M. Arshad (Eds.), *Graduate Research in Education Seminar (GREduc) 2019: Humanising education and human resource development through value driven research and practices* (pp. 194–205). Faculty of Educational Studies, Universiti Putra Malaysia, 13 December 2019. No DOI.

**What the file is.**
- A 392-page graduate seminar proceedings volume, mostly Malaysian education topics, many in Malay.
- The publisher's disclaimer says the editors are not responsible for misconduct or content (PDF p. 2).
- The only other paper that is even loosely related is "Game-based learning as students' learning strategies in enhancing problem-solving skills" (Amran et al., p. 131), a narrative review with no data and not relevant.

**What the paper did.**
- A "PRISMA" systematic review of **10 quantitative articles (2013–2018)** on how Holland's theory is used in career counselling.
- The countries covered are the US, UK, Italy, Korea, Nigeria, Pakistan and Belgium (pp. 194–196).
- It summarises studies on SDS interpretive reports, gender and RIASEC, SIMON-I, the Career Key Urdu, and others (pp. 197–201).

**Quality.**
- The PRISMA flow figures are internally inconsistent: about 61,000 records narrow to "2,843 included" and then to 10 (p. 196).
- It reviews only "positive" effects, by design (p. 195).
- It **misdescribes Hussain et al. (2014)** as comparing Holland's SDS with the CKU. In fact the study compared the English CK with the CKU (p. 197).

**Use in Rahyaab.** **Do not cite it as evidence.** At most, it shows that Hussain et al. (2014) is picked up in regional reviews. Cite Hussain et al. directly.

---

## Quick reference: numbers that are safe to cite

| Claim | Value | Source |
|---|---|---|
| 8-item public-domain RIASEC activity scales, reliability | α .79–.94 | Armstrong et al. 2008, p. 291 |
| Brief markers vs Strong Interest Inventory | r .56–.72 (mean .64) | Armstrong et al. 2008, p. 291 |
| Narrative RIASEC game vs traditional test | r > .75 (no per-scale values in text) | Gutierrez et al. 2025, pp. 646–647 |
| Narrative satisfaction mean | 4.5 / 5 | Gutierrez et al. 2025, p. 647 |
| Gamified SJT vs self-report | β .450–.565 (n = 97) | Georgiou et al. 2019, PDF p. 7 |
| Interest congruence vs work performance | ρ .36 (scale scores alone: .20) | Nye et al. 2012, p. 390 |
| Interest congruence vs academic performance | ρ ≈ .27–.32 (scale scores alone: .23); the congruence increment was not significant in academic samples | Nye et al. 2012, pp. 391–392, 399 |
| ML vs profile matching, occupational hit rate | .34 vs .28 | Song et al. 2024, p. 307 |
| Artistic category hit rate | ML .00 vs profile .45 | Song et al. 2024, p. 308 |
| Career Key hexagon fit, Pakistan | CI .16 (Urdu) and .13 (English) vs US .83 | Hussain et al. 2014, p. 195 |
| Psychometric-test vs general counselling, CDSE | M 4.41 vs 3.42; t = 29.99; d ≈ 1.5 [computed] | Saya et al. 2025, p. 3434 |
| like2be knowledge effect | ηp² = .02 | Keller et al. 2023, p. 9 |
| Physics Playground network score vs post-test | ≈ .1 (expert numbers) → ≈ .36 (calibrated) | Kim et al. 2016, PDF p. 17 |
