# Claim verification against the full-text papers

Scope: the 10 requested checks, then passages in `Rahyaab SRS and design spec.md` that need correcting.
- Line numbers refer to the SRS file as of 31 Oct 2026.
- Page numbers are journal pages unless marked "PDF p.".
- Detailed notes for each paper are in `paper_notes.md` in this folder.
- I did not edit the SRS.

Status labels:
- **Confirmed**: the claim matches the paper.
- **Corrected**: the paper gives a different value, which is shown.
- **Not found**: the paper does not contain the claim.
- **Partly**: some elements are confirmed and others are corrected or not found.

---

## Part A: the 10 requested checks

### 1. Armstrong, Allison & Rounds (2008): brief public-domain RIASEC markers

| Claim | Status | What the paper says |
|---|---|---|
| 48 items, 8 per type | **Confirmed, with nuance** | There are **four** 48-item forms, each with 8 items per type: activity Sets A and B (from the O*NET Interest Profiler) and occupation Sets A and B (from O*NET job titles). That makes 96 activity items in total (p. 287, p. 289; Appendix A, pp. 296–297) |
| Reliabilities | **Confirmed (values)** | Activity scales: α **.79–.93** (mean .87) in Sample 1 and **.79–.94** (mean .88) in Sample 2. Occupation scales: α .74–.88 (mean .84). The full 30-item scales: .93–.97 (pp. 291–292) |
| Validity | **Confirmed (values)** | Brief activity scales vs the 30 occupation ratings: r .72–.87 (mean .80). Vs Strong Interest Inventory GOTs (n = 313): **r .56–.72 (mean .64)**. Occupation vs activity brief scales: r .73–.86. Circular-order fit (VAF): .72–.90, all above the .60 cutoff (pp. 291–293) |
| Licence: public domain | **Confirmed, with nuance** | The Interest Profiler items are described as already public domain and free of copyright restrictions (p. 289). The brief scales were to be posted on a public-domain website (p. 293). No licence instrument (such as CC0) is named. The freedom to reword and translate items is described for Goldberg's IPIP and for Liao et al.'s interest markers (p. 288) |
| Sample | **Confirmed** | 3 US college samples; 1,024 women and 639 men. Sample 1 is given as 814 in the text, but its counts (494 + 322) add up to 816 (p. 289) |
| Relation to the OpenPsychometrics dataset (~145,828 responses) | **Not found** | The paper never mentions OpenPsychometrics, Kaggle, or any online dataset. The link (the OpenPsychometrics 48-item RIASEC test reusing these markers) and the dataset's licence must be checked against the OpenPsychometrics codebook and download page. From memory, the dataset's R1–R8 items read like activity Set A ("Test the quality of parts before shipment", "Lay brick or tile"…), but **verify** this |
| Important caveat to add | **New** | The authors say the scales are for research and are **not intended for career counselling** in their current form. Norms and interpretive materials would be needed first (p. 295) |

### 2. Kim, Almond & Shute (2016): ECD, Bayesian networks, Physics Playground

| Claim | Status | What the paper says |
|---|---|---|
| 10-step procedure | **Confirmed** | The 10 steps (Fig. 2, PDF p. 7) fall into four phases: Task Authoring, CAF, Nuts & Bolts and Debugging. They are: (1) identify key variables; (2) draw the network structure; (3) operational definitions of observables; (4) parameterise the CPTs; (5) elicit priors; (6) optional proxy variables; (7) compute observables from logs; (8) update the CPTs; (9–10) debugging. The process is described as iterative |
| Bayesian network scoring | **Confirmed** | The competency model has 4 agent nodes plus a Newton's-laws node and a fixed-weight "Physics Knowledge" reporting node. The evidence model has 4 observables (Gold / Silver / None). It was built in Netica/RNetica. **The GRM was replaced by the GPCM** because category boundaries needed different discriminations (PDF pp. 10–13) |
| Physics Playground details | **Confirmed** | A 2D physics drawing game with four agents of motion (ramp, lever, pendulum, springboard) and **74 levels** with 4 observables each. In the earlier field study (167 students in grades 8–9), gold trophies correlated .22–.40 with an external physics test. The network score correlated about **.1** with the post-test using expert priors and about **.36** after calibration (PDF pp. 6, 13, 17) |
| Venue | **Confirmed / verify pagination** | *International Journal of Testing*, 2016, DOI 10.1080/15305058.2015.1108322. The PDF is the online-first version. Vol. 16(2), pp. 142–163 is not printed in it **(verify)** |

### 3. Gutierrez et al. (2025): RIASEC interactive narrative with OpenAI (Ecuador)

| Claim | Status | What the paper says |
|---|---|---|
| Venue: IEEE TLT 2025 | **Confirmed** | *IEEE Transactions on Learning Technologies*, 18, 639–651. DOI 10.1109/TLT.2025.3579226. Authors: Gutierrez, Maldonado Navarro, Villegas-Ch & Mera-Navarrete. Open access, CC BY 4.0 |
| N = 200 | **Confirmed** | 100 high-school students (aged 16–18) and 100 first-year university students (aged 18–20), 50/50 gender, Quito, Ecuador; 8 dropouts (pp. 643, 645). It is **not** a Grade 9–12 sample |
| Satisfaction 4.2–4.5 / 5 | **Confirmed, with nuance** | The abstract says 4.2–4.5. The category means are: narrative 4.5 (SD 0.6), vocational impact 4.4, usability 4.3, clarity 4.2 (SD 0.8). The results text says "between 4.0 and 4.5" (pp. 647–648). The scale is an ad hoc, unvalidated 12-item questionnaire (p. 643) |
| Correlation with the standard RIASEC test > .75 | **Confirmed (as stated)** | "All values greater than 0.75" (pp. 646–647). The per-scale values are only in Table IV, which is not in the PDF's text layer. ICC across sessions was > .65 for all dimensions. The instrument behind the "traditional RIASEC test" is not named |
| Correlation with academic performance | **Confirmed** | Game responses correlated with grades: science .42, social studies .38, mathematics .35, language .30, art .25, all p < .05 (p. 649) |
| Narrative quality β = .40 | **Corrected (wording)** | The value .40 is the regression **coefficient** for *satisfaction with the narrative* predicting *overall satisfaction*. The others were vocational impact .38, usability .35 and clarity .25 (p. 648). The paper does not say the coefficient is standardized (β). It is not a measure of "narrative quality", and the outcome is satisfaction, not validity or engagement. The model is circular: satisfaction subscales predict overall satisfaction |

### 4. Landers & Sanchez (2022): definitions and validation

| Claim | Status | What the paper says |
|---|---|---|
| Game-based assessment | **Confirmed** | An **assessment method**: candidates play a **core gameplay loop** while traits are inferred, and it aims at gameful experience. If there is no core loop, it is probably not a GBA (pp. 1–4) |
| Gamified assessment | **Confirmed** | A **redesign strategy**: game mechanics are added to an **existing** assessment, and the method itself does not change. Examples are framification and storification (pp. 1–2) |
| Gamefully designed assessment | **Confirmed** | A **design strategy**: a **new** assessment of a conventional type is built using game concepts (p. 2). Table 1 summarises the three |
| Validation recommendations | **Confirmed** | Existing standards (AERA/APA/NCME; SIOP) still apply. Choose the reliability estimate from the theoretical sources of error; alpha may be inappropriate for a GBA, and test–retest may be better. Evaluate gamified tests by the standards of the underlying method. Use content, response-process, internal-structure and relations-to-other-variables evidence. The validity of game elements needs separate design and causal evidence. Evaluate fairness and privacy of any ML or cloud scoring. Measure reactions to components separately (pp. 9–11) |
| Venue | **Confirmed** | *IJSA*, 30(1), 1–13, DOI 10.1111/ijsa.12376 (an editorial or review) |

### 5. Saya et al. (2025): career decision confidence in Pakistani youth

| Claim | Status | What the paper says |
|---|---|---|
| N = 1,445 | **Confirmed** | 1,445 of 3,275 respondents had had counselling (p. 3432). The Hamdard paper on the same data reports **1,444** |
| 643 vs 801 | **Corrected** | In the *Psychology in the Schools* paper the split is **645 psychometric testing vs 800 general guidance**, with 821 male and 624 female (p. 3432; Table 2). The **643 / 801** split comes from the **Hamdard Educus** paper (Saya & Aslam, 2025, pp. 57–58), whose own t-test table (p. 60) also uses 645 / 800 |
| Effect sizes | **Corrected** | Table 2 prints "Cohen's d" = 0.646 for the total CDSES and 0.693–0.733 for subscales. Those values equal the **pooled SD**, not d. The actual standardized difference is **d ≈ 1.52** for the total (4.4051 vs 3.4233; pooled SD 0.646) and ≈ 0.84–1.69 for subscales **[computed]**. t = 29.986, p < .001 |
| Venue | **Confirmed** | *Psychology in the Schools*, 62, 3428–3439 (2025), DOI 10.1002/pits.23552. Authors: Saya, Aslam & Habib |
| Caveats to add | **New** | Design: counselling type was self-selected (not randomised) and the design is cross-sectional. The sample is 88% O/A-Level, with only 19 Intermediate and 1 Matric student, and is from Karachi. Psychometric fit: the 24-item Urdu CDSE-SF had **CFI .864 and TLI .844** (p. 3432), below .90, although the authors call it acceptable |

### 6. Song et al. (2022/2024): machine learning's capacity to enhance prediction of career choice

| Claim | Status | What the paper says |
|---|---|---|
| N = 81,267 | **Confirmed** | 84,349 before cleaning, **81,267** after. Adults who took a TIME magazine survey in 2016: 75% employed, 62% female, mean age 38 (p. 302) |
| ML vs RIASEC profile matching | **Confirmed** | Hit rate: occupational membership **.34 vs .28**; aspirations **.36 vs .34**. Profile r: .44 vs .23 and .36 vs .28. Euclidean distance: 4.07 vs 5.18 and 4.25 vs 4.97 (Table 5, p. 307). The ML is an ensemble of 4 algorithms on 16 PGI-Mini items plus 6 scales, trained on n = 300 and repeated 100 times (p. 303) |
| Rare-career under-prediction | **Confirmed** | For occupational membership, ML's hit rate was **.00 for Artistic** (base rate .06; profile method .45) and .00 for Realistic. For Enterprising (base rate .35) it was .79 vs .38. ML's hit rates fell below the base rate for R, I, A and S (Table 6, p. 308; pp. 310–311). The authors recommend ML for high-base-rate categories and profile matching for low-base-rate ones |
| "Song et al. 2022" | **Corrected (citation detail)** | Published online in 2022; the issue is *Personnel Psychology*, **77**, 295–319 (**2024**). DOI 10.1111/peps.12529. Cite as "Song et al., 2024" (online 2022), or keep 2022 consistently and give the DOI |

### 7. Nye, Su, Rounds & Drasgow (2012): interests, performance and fit

| Claim | Status | What the paper says |
|---|---|---|
| Interest–performance correlations | **Confirmed** | Work: baseline ρ = **.20** (corrected). Academic: **.23** (pp. 390–391). The sample is 60 studies, 568 correlations and N = 15,301 (p. 389) |
| Fit (congruence) effects | **Confirmed, with nuance** | Work: congruence **.36** (+.16 over scale scores), and longitudinal values .28–.35. A first-letter match gives .27, adjacent types .23 (pp. 390–391). Academic: congruence .32 in the text; predicted grades .27 and persistence .31. **However**, the congruence increment in academic samples was **not significant** (b = .09, p = .22; p. 399), and multiple-major samples are lower (grades .16; p. 392) |
| Venue | **Confirmed** | *Perspectives on Psychological Science*, 7(4), 384–403. DOI 10.1177/1745691612449021 |

### 8. Career Key Urdu (2014)

| Claim | Status | What the paper says |
|---|---|---|
| Author order | **Corrected** | **Hussain, S., Jones, L. K., Fouad, N., Ismail, I. M., Munaf, S., & Khan, M. A.** (2014). *Pakistan Journal of Psychological Research*, 29(2), 187–201. The first author is Sadiq Hussain, so "Jones et al. 2014" is wrong. Cite as **Hussain et al. (2014)** |
| N = 179 | **Confirmed** | 94 boys and 85 girls, mean age 17.42, Karachi and Lahore. All were bilingual (English and Urdu), 95% middle class. 55 in grades 9–10, 56 in grades 11–12, 68 university students (p. 190) |
| Reliability | **Confirmed** | CKU α .73–.76 overall (.67–.86 across subgroups). CK–CKU correlations .85–.90 (pp. 192–193, 196). There is no test–retest (p. 198) |
| Hexagon fit result | **Corrected (interpretation)** | The circular-order test failed for **both** the Urdu CKU (CI .16; 42 of 72 predictions met) **and the English CK** in the same students (CI .13; 41 of 72). All results were non-significant. US data gave CK .83 and VPI .61 (p. 195). So the misfit is **not caused by the Urdu adaptation**; it concerns RIASEC structure, or this instrument and sample, in Pakistani students |

### 9. like2be

| Claim | Status | What the paper says |
|---|---|---|
| N = 809 | **Confirmed, with nuance** | 809 students were recruited, but **532** had complete pre and post data and were analysed: control 133, treatment 1 220/221, treatment 2 179. Ages 12–17 (M = 13.77), German-speaking Switzerland (p. 7). Citation: Keller, Makarova & Döring (2023), *IJGBL*, 13(1), DOI 10.4018/IJGBL.327788 |
| Cognitive engagement predicted learning, while enjoyment and flow did not | **Not found** | This paper does not measure engagement, enjoyment or flow, and says motivation was not analysed (p. 12). It only cites Keller et al. (2023) for the finding that the game "stimulates cognitive processes" and increases occupational knowledge (p. 2). That source is **Keller, Doering & Makarova (2023), *Education Sciences*, 13(1), 16, DOI 10.3390/educsci13010016**, which is not in the folder. Obtain it before citing the engagement and flow claim |
| What this paper found | **New** | Small effects: knowledge ηp² = .02 (treatment 2 > control only); the number of occupations judged a personal fit, ηp² = .02 (treatment 1 > control). There was no effect on fit-quality indicators or on gender stereotypes, which trended toward *more* stereotyping (pp. 8–12) |

### 10. The opaque files

| File | Status | What it is, and relevant results |
|---|---|---|
| `Hamdard_Guidanceandcounseling.pdf` | **Identified** | **Saya, A., & Aslam, R. (2025)**, "Exploring career guidance in Pakistan's educational landscape: A comparative analysis of different counselling approaches", *Hamdard Educus*, 4(1), 52–66. It reports the **same survey** as Saya et al. (2025): 1,444 counselled, 643 PT vs 801 GGC, M 4.41 vs 3.42, t = 29.99. Useful demographics: 98.6% Karachi, A-Level 61.1%, **64.1% have parental income above PKR 200k a month**. Its regression "impact" analyses use a constant predictor (SD = 0) and are meaningless. Prefer the *Psychology in the Schools* paper |
| `GREDUC_GREduc2019_E-proceedings.pdf` | **Identified** | The proceedings of the **Graduate Research in Education Seminar (GREduc) 2019**, Faculty of Educational Studies, Universiti Putra Malaysia, 13 Dec 2019 (392 pages). The only relevant paper is **Arokianathan, Zainudin & Yusop (2019), "A review on Holland's career theory"**, pp. 194–205. It is a low-quality review of 10 studies with inconsistent PRISMA counts, and it misdescribes Hussain et al. (2014) as comparing the SDS with the CKU. **Do not cite it as evidence** |
| `16440457.pdf` | **Identified** | **Georgiou, K., Gouras, A., & Nikolaou, I. (2019)**, "Gamification in employee selection: The development of a gamified assessment", *IJSA*, DOI 10.1111/ijsa.12240 (27(2), 91–103, **verify**; the PDF is the early-view version). The gamified SJT vs self-report scales gave **β .450–.565** (n = 97 adults, Greece), and loadings were invariant across the two modes (N = 731). This **confirms** the SRS figure "β .45–.57", which needs the n = 97 / adult caveat |

---

## Part B: passages in `Rahyaab SRS and design spec.md` that need correcting

Each entry gives the line number, the current text (quoted), the problem, and suggested replacement text.

### B1. Line 155: literature list
- **Current:** "Song et al. 2022 (ML majority bias); Jones et al. 2014 (Urdu Career Key)"
- **Problems:**
  - The Career Key Urdu paper's first author is Hussain.
  - Song is published in a 2024 volume.
  - The "majority bias" in Song is specifically about base rates.
- **Replace with:** "Song et al. 2022/2024 (ML under-predicts low-base-rate career categories); Hussain et al. 2014 (Career Key Urdu; RIASEC circular order not supported in Pakistani students)"
- **Also consider adding:** Armstrong et al. 2008 (item source), Landers & Sanchez 2022 (terminology and validation), Kim et al. 2016 (ECD), Nye et al. 2012 (congruence baseline) and Gutierrez et al. 2025 (closest narrative RIASEC game).

### B2. Line 97: glossary, "Choice game"
- **Current:** "…It is the measurement instrument for interests, also called gamified or stealth assessment [GD §1]"
- **Problem:** Landers & Sanchez (2022, p. 2, Table 1) treat these as distinct:
  - *gamified* = an existing assessment redesigned with game mechanics;
  - *game-based assessment* = a core gameplay loop from which traits are inferred.
  - *Stealth assessment* (Shute) is ECD-based embedded assessment, a further distinct term.
- **Replace with:** "…It is the measurement instrument for interests. Career Bazaar is a *gamified* assessment (public-domain RIASEC marker items redesigned as cards); Story Town is a *gamefully designed* (storified) measure; neither is a full game-based assessment in the sense of Landers & Sanchez (2022). Design follows evidence-centred design (Kim, Almond & Shute, 2016)."

### B3. Line 162: assumption A-02
- **Current:** "The OpenPsychometrics/Kaggle RIASEC dataset (~145,828 responses, 48 items) is licensed for research use. Its items are public-domain markers that can be reworded into activity cards **(verify item source and licence)**"
- **Problem:** Armstrong et al. (2008) confirm that the *items* are public domain, taken from the US DoL Interest Profiler (p. 289), with 8 per type. The paper says nothing about the dataset, its size or its licence. Keep the "verify" flag for the dataset.
- **Replace with:** "The 48 RIASEC items used by the OpenPsychometrics test are believed to be the public-domain activity markers of Armstrong, Allison & Rounds (2008; 8 per type, drawn from the O*NET Interest Profiler, which the authors describe as public domain). The dataset (~145,828 responses) and its licence are **not** documented in that paper and must be verified on the OpenPsychometrics/Kaggle pages. Armstrong et al. state the scales were built for research, not counselling, without local norms (p. 295)."

### B4. Line 285 (CCP table, row 2): "Accuracy vs fairness (ML favours majority options [R2, Song])"
- **Problem:** Correct in spirit. To be precise, Song's ML hit rate for Artistic jobs was .00 against .45 for profile matching.
- **Replace with:** "Accuracy vs fairness (ML raises overall hit rate but under-predicts low-base-rate categories, e.g., Artistic hit rate .00 vs .45 for profile matching; Song et al. 2022/2024)"

### B5. Line 287 (CCP table, row 4)
- **Current:** "No validated teen game-based interest measure exists. The Urdu RIASEC adaptation failed the hexagon fit (Jones et al. 2014) [R2]."
- **Problems:**
  1. Wrong first author.
  2. The English Career Key failed equally in the same students, so the misfit is not an effect of adaptation.
  3. Gutierrez et al. (2025) do report a game–test RIASEC correlation above .75 in a sample that includes 16–18-year-olds. It is weak evidence, but it exists.
- **Replace with:** "No game-based interest measure has been validated for Pakistani Grade 9–12 students. The only comparable study (Gutierrez et al. 2025, Ecuador, ages 16–20) reports r > .75 with a traditional RIASEC test but without per-scale values or a named instrument. In Pakistani students, Holland's circular order was not supported for either the English or the Urdu Career Key (CI .13 and .16 vs .83 in the US; Hussain et al. 2014)."

### B6. Lines 331 and 379: "Narrative drives satisfaction (β = .40)" / "Narrative quality predicts satisfaction (β = .40)"
- **Problems:**
  - The paper reports a regression coefficient of 0.40, not stated as standardized, for *satisfaction with the narrative* predicting *overall satisfaction*.
  - The predictors are satisfaction subscales of an ad hoc questionnaire.
  - It is not evidence about narrative quality, engagement or validity.
- **Line 331, replace with:** "Narrative was the most-liked aspect (mean 4.5/5) and the strongest predictor of overall satisfaction (coefficient .40; Gutierrez et al. 2025); it also gives a second evidence source"
- **Line 379, replace with:** "Narrative was the highest-rated and most satisfaction-linked element in a RIASEC story game (4.5/5; coefficient .40; Gutierrez et al. 2025). A gamified SJT kept convergent validity (β .45–.57, n = 97 adults; Georgiou et al. 2019)"
- **Line 379 (Georgiou part):** "β .45–.57" is **confirmed** (.450–.565). Add "n = 97 adults" as shown.

### B7. Line 401: "Short forms of 6–12 items reach only about .65–.70 reliability"
- **Context:** This sentence is about ability puzzles (cited to [R2, Shute 2015]), and it is not contradicted for abilities.
- **Problem:** It should not be generalised to interest cards. Armstrong et al. (2008) found α .79–.94 for 8-item RIASEC activity scales (p. 291).
- **Suggestion:** Add "(for interests, 8-item marker scales reach α ≈ .79–.94; Armstrong et al. 2008)" so readers do not apply the .65–.70 figure to the Bazaar.

### B8. Line 435: Career Bazaar item bank
- **Current:** "48 core cards (8 per type) rewritten from the public-domain RIASEC marker items (A-02) … plus 24 reserve cards for CAT exposure control."
- **Suggestion (not an error):** State the source and use the alternate form for the reserve cards.
- **Replace with:** "48 core cards (8 per type) rewritten from the public-domain RIASEC activity markers (Armstrong et al. 2008, Set A); the 24 reserve cards are drawn from the parallel Set B (4 per type), which has comparable reliability (α .79–.94) and circular-order fit."

### B9. Lines 439 and 1440–1447: GRM for 3-category swipes
- **Suggestion (not an error):** Kim et al. (2016, PDF pp. 12–13) dropped the GRM for a 3-category observable because the two category boundaries needed different discriminations.
- **Add to the M1 experiments:** "Compare GRM with GPCM (category-specific discriminations) on the pilot swipes; Skip/Try vs Try/Love boundaries may differ in discrimination (cf. Kim et al. 2016)."

### B10. Lines 1464 and 1746: "because the Urdu sample misfit [R2]" / "RIASEC structure does not hold in Pakistani teens (hexagon misfit [R2])"
- **Line 1464, replace with:** "…reported but not relied on, because Holland's circular order was not supported in Pakistani students for either the English or the Urdu Career Key (Hussain et al. 2014)."
- **Line 1746:** keep it, but cite Hussain et al. 2014. Note that the evidence is one small bilingual urban sample (N = 179) using one instrument.

### B11. Line 1689: "It closes the gap that no adolescent game-based RIASEC convergent-validity coefficient is published [R2]."
- **Problem:** Gutierrez et al. (2025, IEEE TLT) published game–traditional-test correlations above .75 in a sample of 200 that included 100 high-school students aged 16–18.
- **Replace with:** "It addresses the gap that no game-based RIASEC convergent-validity evidence exists for Pakistani Grade 9–12 students. The closest study (Gutierrez et al. 2025; Ecuador, ages 16–20, N = 200) reports r > .75 with an unnamed traditional RIASEC test, but gives no per-scale values, uses LLM-generated (non-fixed) scenarios, and does not test discriminant validity."

### B12. Line 1696: convergent-validity benchmark
- **Current:** "Literature benchmarks between established inventories are .31–.80 [R2]."
- **Suggestion:** Add a primary source for brief scales: "brief 8-item marker scales vs the Strong Interest Inventory correlate .56–.72 (Armstrong et al. 2008)". The hypothesis "r ≥ .50 for at least 4 of 6 scales" is consistent with this.

### B13. Line 1704: "(engagement is not evidence of validity [R2, like2be])"
- **Problem:** like2be (Keller, Makarova & Döring 2023, IJGBL) does not test engagement, or its relation to validity. The "cognitive engagement vs enjoyment/flow" finding is from a different paper (Keller, Doering & Makarova 2023, *Education Sciences* 13(1), 16), which is not in the folder.
- **Replace with:** "(reactions and engagement are evaluated separately from reliability and validity; Landers & Sanchez 2022, pp. 9–11)". Add Keller, Doering & Makarova (2023, *Educ. Sci.*) only after reading it.

### B14. Line 1475 and §14.4 reliability choices (supporting, no change needed)
The SRS already uses split-half, test–retest and IRT marginal reliability. This matches Landers & Sanchez (2022, p. 10): pick the reliability estimate from the theoretical sources of error, and alpha may be inappropriate. Cite them here.

### B15. Lines 956 and 1302 (FR-44 b and US-20): congruence baseline (supporting, add a citation)
Add: "Interest–environment congruence predicts performance and persistence better than interest level alone (work ρ .36 vs .20; academic ≈ .27–.32 vs .23; Nye et al. 2012)." Note that the academic increment was not significant (p. 399) and that multiple-major samples are lower (.16 for grades). Expect modest effects.

### B16. Line 1908 (student survey Q9, "Baseline for CDSE") and any Saya citation in [R1]/[R2]
If the reports cite Saya et al. (2025), use these values:
- N = 1,445, with **645 PT vs 800 GGC**. The **643 / 801** split is from the Hamdard paper.
- M 4.41 vs 3.42, t = 29.99, **d ≈ 1.5 [computed]**, not 0.65. The printed "d" equals the pooled SD.
- The design is correlational and self-selected, and the sample is mostly A/O-Level students in Karachi.
- A 24-item Urdu-adapted CDSE-SF exists (α .965; CFI .864).

---

## Part C: other observations (no SRS text to change)

- **Story Town scoring (line 455).** It uses forced choice (one option per type), which produces ipsative proportions. These cannot show overall interest level and complicate correlations with the Bazaar's normative θ. This point does not come from the papers. Gutierrez et al. used per-item decisions mapped to RIASEC and validated against a normative test.
- **LLM in measurement.** Gutierrez et al. generated scenarios at run time with GPT-4 Turbo. Rahyaab's choice of fixed, balanced nodes (FR-20) and no LLM in production (FR-58) is better for comparability. Cite Landers & Sanchez (2022, p. 11) on evaluating ML or cloud components for fairness and privacy.
- **Gender effects to anticipate.** In Hussain et al. (2014), boys scored higher on R (d .78) and girls on A (d .53). like2be did not reduce stereotyping. This supports the DIF and matched-θ audits.
- **Framing and exploits.** Kim et al. (2016) found that prize framing changed play and that players exploited the mechanics ("stacking"). This supports Rahyaab's "no points for answers" rule and the straight-lining and fast-swipe flags.
