# Validation and Research Plan

**Version:** 1.0 design proposal · 19 Nov 2026
**Relation to Phase 1:** detailed procedures already exist in Phase 1 (`psychometric_validation_plan.md`, `pilot_study_protocol.md`, `expert_interview_protocol.md`, `student_interview_protocol.md`, `ethics_and_privacy.md`). This plan updates them for the redesigned game and lists the hypotheses each design decision depends on.

---

## 1. What must be shown before any claim

| Claim the project wants to make | Evidence needed | Study |
|---|---|---|
| Students find the game engaging and not test-like | Completion, observed engagement, short reaction measure, interviews | A, C |
| Activities represent their RIASEC types | Expert classification ≥ 80%, I-CVI ≥ .78 | B |
| Game RIASEC scores relate to a RIASEC questionnaire | Convergent > discriminant correlations; top-code overlap | D |
| In-game Mini-IPIP behaves like the Mini-IPIP / relates to a criterion Big Five measure | Reliability, factor structure, convergent correlations, mode-effect check | D |
| Puzzle counts reflect the intended reasoning families | Item statistics; correlations with school marks/standard tasks | C, D |
| Gameplay research signals relate to Big Five traits | MTMM pattern after controls | D (exploratory) |
| Results are fair across gender, school type, device, reading level | DIF / measurement invariance | D |

## 2. Hypotheses register

### Engagement and usability (H-U)
| ID | Hypothesis | Criterion |
|---|---|---|
| H-U1 | ≥ 85% complete Chapter 1 in one class period | Logs |
| H-U2 | ≤ 10% need adult help with controls after the tutorial | Observation |
| H-U3 | ≥ 70% agree "This felt like a game, not a test" | 3-item post-game check (5-point) |
| H-U4 | Work activities of different types have similar median durations (±15%) | Logs |

### RIASEC (H-R)
| ID | Hypothesis | Criterion |
|---|---|---|
| H-R1 | Each game RIASEC scale correlates more with its questionnaire counterpart than with other questionnaire scales | MTMM: convergent r ≥ .30 and > discriminant r for ≥ 4 of 6 scales **[D]** |
| H-R2 | Top-3 overlap between game and questionnaire ≥ 2 letters for ≥ 50% of students | Descriptive |
| H-R3 | Choice position, NPC liking and visual salience explain little variance in choices | Position effects ns or small (odds ratio < 1.3); "favourite character" overlap with top type not above chance |
| H-R4 | Profiles from Caravan, Hall and Park agree (median r ≥ .30) | Existing agreement statistic |
| H-R5 | Test–retest (2–4 weeks) of top type stable for ≥ 60% | Retest subsample |
| H-R6 | Removing dwell does not reduce convergent validity | Compare with/without dwell |

### Big Five (H-B)
| ID | Hypothesis | Criterion |
|---|---|---|
| H-B1 | In-game Mini-IPIP scales correlate with the criterion measure's matching domains (r ≥ .50) more than with non-matching domains | MTMM |
| H-B2 | Journal presentation does not shift scores relative to a plain Mini-IPIP (mode/context effect) | Within-person comparison in a counterbalanced subsample; mean difference d < 0.2 |
| H-B3 | Five-factor structure recoverable with acceptable fit (ESEM/CFA) | CFI ≥ .90 as a minimum for short scales; report honestly if not |
| H-B4 | Glossed items are understood as intended | Cognitive interviews: ≥ 80% correct paraphrase |
| H-B5 | Each research signal (O-1, O-2, C-1, C-2, E-1, A-1) correlates with its target trait more than with other traits after controlling γ, reading support and ability | Partial correlations; signals failing are dropped |

### Ability (H-A)
| ID | Hypothesis | Criterion |
|---|---|---|
| H-A1 | Item difficulties increase in the intended order | p-values; re-order items if not |
| H-A2 | Items discriminate (corrected item–total r ≥ .20) | Classical item analysis |
| H-A3 | Family counts correlate moderately with related school marks (e.g., Mathematics for planning) | r ≥ .20 expected; not a validity proof |
| H-A4 | Control familiarity (γ) does not strongly predict puzzle counts after ability controls | Regression |

### Fairness (H-F)
| ID | Hypothesis | Criterion |
|---|---|---|
| H-F1 | No large DIF by gender for journal items and puzzle items | Mantel–Haenszel / ordinal logistic DIF; flag moderate+ |
| H-F2 | Device tier and read-aloud use do not change RIASEC or Big Five scores beyond small effects | Regression |
| H-F3 | Students in government and private schools experience similar usability | H-U measures by school type |

## 3. Studies

| Study | Design | Sample (target) | Main outputs |
|---|---|---|---|
| **A — Think-aloud walkthroughs** | Students play the first chapter thinking aloud; then cognitive interviews on journal items | 8–12 students (Grades 9–12; boys/girls; government/private) | Usability fixes; item comprehension (H-B4); activity–type perceptions |
| **B — Expert review** | Counsellors/teachers classify activities (RIASEC), rate typicality, review NPC neutrality, review pathway profiles and wording | 5–8 experts | I-CVI, kept/redesigned activities; counsellor-calibrated matching weights |
| **C — Pilot** | Full game in school sessions (two periods) | 60–100 students | Completion, timings (H-U), item statistics (H-A1/2), variance checks, technical issues on real phones |
| **D — Validation** | Game + criterion questionnaires (RIASEC: O*NET Interest Profiler Short Form or Urdu Career Key; Big Five: BFI-2-S or Urdu BFI) + plain Mini-IPIP (counterbalanced subsample) + school marks; retest subsample at 2–4 weeks | ≥ 200 students (CFA/ESEM and DIF need this size; ~85 would detect r = .30 with 80% power at α = .05, ~200 for r = .20) | H-R, H-B, H-A, H-F results |
| **E — Usefulness** (later) | Counsellor sessions using the Path Map vs usual guidance | Small qualitative + survey | Perceived usefulness, misinterpretation risks |

Criterion instruments: the RIASEC criterion must be administered **after** the game (or on a different day) to avoid students copying their questionnaire answers into game choices; order effects checked in a counterbalanced subsample.

## 4. Data and analysis notes
- Use only **first responses** for ability items; skipped = attempted-not-correct (existing rule).
- Exclude research signals from all student-facing scores (verified by a test, `TECHNICAL_ARCHITECTURE.md` §8.3).
- Report reliability as α and ω where possible; for 4-item scales expect modest values and say so.
- Pre-register hypotheses and decision criteria (OSF or the university's registry) before Study D **[D]**.
- Covariates: control familiarity (γ), tap-to-walk use, read-aloud use, text size, device tier (RAM/screen), school type, grade, gender.

## 5. Decision rules after validation

| Result | Action |
|---|---|
| Game RIASEC passes H-R1 for ≥ 4 scales | Keep as primary interest input (still labelled exploratory until replicated) |
| Game RIASEC fails | Use the RIASEC questionnaire as primary in RahYaab; the game becomes an exploration activity whose results are discussed, not scored |
| In-game Mini-IPIP shows a mode effect (H-B2 fails) | Present the journal in plain form or adjust instructions; re-test |
| Research signal fails H-B5 | Remove from logging |
| Puzzle items fail H-A2 | Replace items; keep counts unreported until fixed |

## 6. Ethics and privacy (summary of what changes)
- Consent/assent handled by the host (existing). New: separate **research consent** flag for research signals and covariates **[A]**.
- No names, no free text, no audio/voice recording, no location, no photos.
- Data minimisation: research signals store counts/booleans/timings only.
- Retention and deletion as in Phase 1 `ethics_and_privacy.md`; local purge includes all new prefs.
- Results are framed for discussion with family/teachers/counsellors; no automated decisions.

## 7. Timeline (indicative)

| Weeks | Activity |
|---|---|
| 1–2 | Design approval; Study B expert review (activities, wording, NPC neutrality) |
| 3–8 | Implementation (after approval) |
| 9 | Study A walkthroughs; fixes |
| 10–11 | Study C pilot on school phones; item re-ordering |
| 12–16 | Study D validation + retest |
| 17–18 | Analysis, report |

## 8. Consolidated references
(Full bibliographic entries for Phase 1 sources are in `research_references.bib`; entries below were rechecked online on 16–19 Nov 2026 unless marked.)

- Barends, A. J., de Vries, R. E., & van Vugt, M. (2022). *Assessment, 29*(4), 630–650. doi:10.1177/1073191120985612
- Castelló, A., & Cladellas, R. (2021). Assessment of implicit interests through an unobtrusive computer task. *IJERPH, 18*(23), 12366.
- Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). *Psychological Assessment, 18*(2), 192–203. doi:10.1037/1040-3590.18.2.192
- Fadillah, Hidayat, R., & Santoso, A. (2025). Convergent validity of game-based assessment: A meta-analysis. *International Journal of Serious Games, 12*(4). doi:10.17083/etxn7795
- Faize, F. A., & Husain, W. (2024). *e-mentor, 4*(106), 13–21. (Phase 1, verified)
- Harman, J. L., & Brown, K. D. (2022). *International Journal of Selection and Assessment, 30*(1), 157–166.
- Holland, J. L. (1997). *Making vocational choices* (3rd ed.). PAR. (Phase 1, confirm)
- Hoober, S. (2013). How do users really hold mobile devices? *UXmatters*.
- Laajaj, R., et al. (2019). *Science Advances, 5*(7), eaaw5226. doi:10.1126/sciadv.aaw5226
- Landers, R. N., & Collmus, A. B. (2022). Gamifying a personality measure by converting it into a story. *International Journal of Selection and Assessment, 30*(1), 145–156.
- Larson, L. M., Rottinghaus, P. J., & Borgen, F. H. (2002). *Journal of Vocational Behavior, 61*(2), 217–239. (Phase 1, confirm)
- Low, K. S. D., Yoon, M., Roberts, B. W., & Rounds, J. (2005). *Psychological Bulletin, 131*(5), 713–737. (Phase 1, confirm)
- Lynn, M. R. (1986). *Nursing Research, 35*(6), 382–385. (Phase 1)
- Mussel, P., Gatzka, T., & Hewig, J. (2018). *European Journal of Psychological Assessment, 34*(5), 328–335. doi:10.1027/1015-5759/a000346
- Nye, C. D., Su, R., Rounds, J., & Drasgow, F. (2012). *Perspectives on Psychological Science, 7*(4), 384–403. (Phase 1, confirm)
- Oostrom, J. K., de Vries, R. E., & de Wit, M. (2019). *Human Performance, 32*(1), 1–29. doi:10.1080/08959285.2018.1539856
- Polit, D. F., & Beck, C. T. (2006). *Research in Nursing & Health, 29*(5), 489–497. (Phase 1)
- Ramos-Villagrasa, P. J., Fernández-del-Río, E., Hermoso, R., & Cebrián, J. (2024). *PLoS ONE, 19*(5), e0302429. doi:10.1371/journal.pone.0302429
- Rounds, J., & Tracey, T. J. (1996). *Journal of Counseling Psychology, 43*(3), 310–329. (Phase 1, confirm)
- Soto, C. J., & John, O. P. (2017). BFI-2-S and BFI-2-XS. *Journal of Research in Personality, 68*, 69–81. doi:10.1016/j.jrp.2017.02.004
- Su, R., Rounds, J., & Armstrong, P. I. (2009). *Psychological Bulletin, 135*(6), 859–884. (Phase 1, confirm)
- Ventura, M., & Shute, V. (2013). *Computers in Human Behavior, 29*(6), 2568–2572. doi:10.1016/j.chb.2013.06.033
- ASER Pakistan 2025 learning results as reported by UKFIET (2026).
- Business Recorder (20 Oct 2025): Pakistan smartphone market shares (Transsion 44% in Q2 2025).
- Expo SDK 58 documentation: `expo-speech`, `expo-audio` (checked 19 Nov 2026).
