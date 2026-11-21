# Big Five Assessment Design

**Version:** 1.0 design proposal · 19 Nov 2026
**Scope:** how Valley Explorer collects Big Five personality evidence: (A) the scored self-report questionnaire inside the game, and (B) exploratory gameplay indicators kept for research.
**Standing statement:** *There is currently insufficient empirical evidence to establish any Valley Explorer gameplay behaviour as a valid measure of a Big Five trait in Pakistani adolescents. The game does not claim to measure personality from gameplay.*

---

## 1. Two sources, never mixed

| | **A. Questionnaire (scored)** | **B. Gameplay indicators (research only)** |
|---|---|---|
| What | 20 Mini-IPIP statements, word-for-word, answered on a 5-point scale | Specific behaviours in the game, defined in §4 |
| Shown to the student | Yes — one plain sentence per trait | **Never** |
| Sent to RahYaab for guidance | Yes (`eligible_outputs.bigfive`) — as context, never to rank or filter pathways | **Never** |
| Sent to the research dashboard | Yes | Yes, beside the questionnaire, for comparison |
| Status | Published instrument [E], adapted presentation [H] | Hypotheses [H] with a validation plan |

This separation is already implemented (`core/bigfive/scoring.ts`, `analytics/valley_bigfive.py`) and is preserved.

## 2. The instrument

### 2.1 Current choice: Mini-IPIP (20 items) [E]
- Developed by Donnellan, Oswald, Baird & Lucas (2006) as a 20-item short form of the 50-item IPIP Big Five markers; **four items per trait**. Across five studies the scales had internal consistencies at or well above α = .60, test–retest correlations similar to the parent measure over weeks and months, and a convergent/discriminant/criterion pattern comparable to other Big Five measures.
- Items are **public domain** (International Personality Item Pool), so they can be embedded, displayed and adapted without licence fees.
- Item wording and keying were checked against the IPIP key page on 16 Nov 2026 (`core/bigfive/items.ts`).

### 2.2 Known limitations
| Limitation | Consequence | Response in this design |
|---|---|---|
| 4 items per trait → modest reliability (α ≈ .60–.80) | Individual scores are imprecise; the Phase 1 literature review recommended **not** using the Mini-IPIP as the *criterion* in validation studies | Report bands in words only (higher / in between / lower); never numbers to students; use a longer instrument as the criterion in research (§6) |
| No verified validation with Pakistani adolescents; English wording | Factor structure and item meaning may differ. Laajaj et al. (2019) found that commonly used short personality questions often failed to measure intended traits in low- and middle-income-country surveys | Cognitive interviews; CFA/ESEM in the validation study; read-aloud and glosses; no comparisons to norms |
| Some items are idiomatic for students ("life of the party", "feel blue", "abstract ideas") | Misunderstanding | Existing glosses (shown under the statement; scored text unchanged) — to be checked in cognitive interviews |
| Two items mention parties | Cultural fit | Gloss "A party can also be a family gathering or a wedding" (existing) |

### 2.3 Alternatives considered

| Instrument | Items | Licence | For | Against | Decision |
|---|---|---|---|---|---|
| **Mini-IPIP** (current) | 20 | Public domain | Free, short, already implemented and parity-tested with the backend | Modest reliability | **Keep for v1 in-game** **[D]** |
| BFI-2-XS (Soto & John, 2017) | 15 | Copyright; permission for personal and research use | Shorter, balanced keying, 3 per domain; retains much of the full measure's domain-level reliability | Licence limits commercial use; must not be used for facets | Not chosen |
| BFI-2-S | 30 | Same as above | Better reliability, facets | 50% longer journal (+ ~1.5 min); licence | **Criterion measure in the validation study** **[A]** |
| IPIP-50 | 50 | Public domain | Parent measure of the Mini-IPIP | Far too long for in-game use | Not chosen |
| Urdu BFI-44 / Urdu adolescent personality questionnaire (Phase 1 review) | 44 / 25 | Research use | Local language evidence | Conflicts with "English for all game content"; criterion use only | Candidate criterion (if Urdu is allowed in research sessions) **[A]** |

Changing the in-game instrument later is possible because items, keys and journal pages are data (`items.ts`); it would require a new `BIGFIVE_SCORING_VERSION` and a backend update.

## 3. Integrating the questionnaire into the adventure

### 3.1 Options evaluated

| Method | How it would work | Evidence | Verdict |
|---|---|---|---|
| **Short journal entries between missions** | After each stop, a rest moment: 2–3 verbatim statements in the Pathfinder's Journal | Gamified assessments that keep the original items but add story/immersion behaved similarly to the original questionnaire in reliability and scores in a 2024 study with 98 university students, although Conscientiousness scores were substantially higher in the gamified version (Ramos-Villagrasa et al., 2024) [E, adult]. Adding illustrations to a narrative personality game did not change measurement but reactions to the game were more positive than to a traditional inventory (Harman & Brown, 2022) [E, adult] | **Chosen.** Items unchanged; presentation varied only by setting |
| Conversations with NPCs (NPC asks the statement) | Mehr says "Do you get chores done right away?" | Changing the speaker and grammatical form changes the item | **Partly used:** Mehr *introduces* the page and the statement is **read aloud** in the student's own voice frame ("I …"); the NPC never rephrases it |
| Rewriting items as story scenarios ("storification") | "You arrive at the market and…" with behavioural options | When two Likert personality measures were converted into a story, latent convergence with the originals was moderate (Conscientiousness β = .45, Openness β = .72) but item-level convergence was generally poor (mean r = .17), and the storified measures predicted performance more poorly (Landers & Collmus, 2022) [E] | **Rejected for scoring.** Would turn a validated measure into an unvalidated one |
| Situational activities (situational judgement tasks) | Choose what to do in a social dilemma | Construct-based SJTs *can* measure personality traits with acceptable construct validity in adult samples (Mussel, Gatzka & Hewig, 2018; Oostrom, de Vries & de Wit, 2019, retest .55–.74) [E, adult] — but they require their own development and validation | **Future research option** only; not in v1 |
| Optional story interactions | Behaviour in side events | No validation | Research indicators (§4) |

### 3.2 Pathfinder's Journal — specification

| Element | Specification |
|---|---|
| When | Immediately after each stop (8 pages), at a **rest spot** that appears in the world (bench by the gate, wagon steps, workshop porch, Night camp fire, Map House window seat, aqueduct wall, park bench, Fort courtyard). The student walks to it and taps **Sit** — the page is never sprung on them mid-action. **[D]** |
| Opening line | Mehr (read aloud): "Let's write in your journal. How much is each sentence like you? There are no right answers." First page adds: "Nothing here is marked. Answer about how you usually are." |
| Statement presentation | One statement at a time, large type, the exact Mini-IPIP wording with "I" added (existing). Gloss under the statement where defined. **Read-aloud** plays automatically if enabled **[A]**. |
| Response scale | Five buttons, top to bottom: *Not like me at all · Not much like me · In between · A bit like me · Very much like me* — with growing-dot icons (no faces, no colours that imply good/bad) — existing |
| Skip | "Skip this sentence" always available (existing); skipped items are stored as `answer: null` |
| Practice statement | First page only: one *unscored* example ("I like apricots.") to learn the scale **[A]** |
| Feedback | After the page: ink-stamp "Journal page saved"; no evaluation; **no coins** (existing) |
| Visual frame | The journal is drawn as the satchel notebook (paper texture, the stop's stamp on the page corner) — part of the world, not a form |
| Consistency rules | Identical layout, scale wording, button order and read-aloud voice on all pages (presentation constancy is required for comparability across items) |
| Duration | ≈ 10–15 s per statement → ≈ 40 s per page; ≈ 5 min total |
| Resume | An interrupted page comes back with the unanswered statements only (existing `pendingJournalPage`) |

### 3.3 Item-to-page assignment (existing, kept)

| Page (after stop) | Items | Traits on the page |
|---|---|---|
| 1 Valley Gate | mi05 (O+), mi02 (A+) | O, A |
| 2 Crossroads Caravan | mi03 (C+), mi01 (E+), mi09 (N−) | C, E, N |
| 3 Workshop Orders | mi07 (A−), mi13 (C+) | A, C |
| 4 Makers' Hall (Night camp) | mi11 (E+), mi20 (O−), mi14 (N+) | E, O, N |
| 5 Map Room | mi08 (C−), mi12 (A+) | C, A |
| 6 Pattern Gate | mi06 (E−), mi15 (O−), mi19 (N−) | E, O, N |
| 7 Riverside Park | mi17 (A−), mi04 (N+), mi18 (C−) | A, N, C |
| 8 Lantern Vault | mi10 (O−), mi16 (E−) | O, E |

Every trait's four items are spread over at least three stops (tested). The order is **fixed for all students** so context effects are the same for everyone; possible context effects (e.g., an Agreeableness item right after a helping-heavy level) are examined in the validation study (H-B2).

## 4. Gameplay indicators (research only)

**Rules for every indicator [D]:**
1. It must not reuse RIASEC scoring events (prevents circular agreement between interests and personality — the existing O "variety" and C "optional steps/finishing" estimates violate this and are proposed for retirement, decision D-08).
2. It must happen in a context with **no reward difference and no instruction**.
3. It is never shown to students, never used in guidance, and never combined with the questionnaire score.
4. Each is validated separately (§6) and dropped if it fails.

### 4.1 Indicator specifications

#### O-1 — Curiosity spots (Openness: curiosity / experience seeking)
| Field | Content |
|---|---|
| Behaviour | Walking 2–4 tiles off the main path to **Look** at an unrewarded curiosity object (6 in the hub and scenes: milestone, sundial, bird's nest, carved stone, otters, star chart); proportion examined of those passed within view |
| Why it might relate | Openness includes interest in new experiences and ideas; voluntarily seeking unrewarded information is a behavioural expression of curiosity |
| Alternative explanations | Completionism / gaming habit ("touch everything"); boredom; expectation of a hidden reward; reading confidence (each spot shows a sentence); time available in the session |
| Research evidence | Analogy only: behavioural tasks where children choose to explore unknown options or ask questions have shown consistent choices and relations to teacher-rated curiosity or knowledge (e.g., the "Questions Worlds" tablet game, 2020, in which question specificity predicted teacher-rated curiosity; the "Animal Game" novelty-choice task, 2026 working paper) — younger samples, not Big Five Openness |
| Validation | Correlation with Mini-IPIP O and the criterion O scale > correlation with other traits (MTMM); partial r controlling control-familiarity (γ), feather collection (completionism proxy) and read-aloud use; retest stability |
| Suitability | **Research only** |

#### O-2 — Reading signboards before they are needed (Openness)
| Field | Content |
|---|---|
| Behaviour | Number of the 6 district signboards read in L01 (existing `EXPLORATION`) |
| Why | Information seeking about the world before it is required |
| Alternatives | Mehr's suggestion to read them (compliance); reading confidence; completionism |
| Evidence | None direct; existing exploratory indicator |
| Validation | As O-1; expected to be weaker because of the instruction |
| Suitability | **Research only** (existing) |

#### C-1 — Tidying tools (Conscientiousness: orderliness)
| Field | Content |
|---|---|
| Behaviour | After each Makers' Hall activity, the number of used tools (0–3) returned to their rack outline; proportion across activities |
| Why | Orderliness aspect of Conscientiousness; directly parallels Mini-IPIP item mi08 "I often forget to put things back in their proper place" (reverse-keyed) |
| Alternatives | Gaming habit of interacting with every highlighted object; wishing to please an observer; noticing vs not noticing the outline (visual attention); Conventional interest (sorting is C-type work) |
| Evidence | No direct study; content analogy to the questionnaire item; the Phase 1 indicator matrix lists a similar "tidy inventory" indicator (C4) as a hypothesis |
| Validation | MTMM with C scales; partial r controlling γ and RIASEC C score (must stay > 0 after control); exclude mi08 when correlating with the Mini-IPIP to avoid item–behaviour content overlap inflating results |
| Suitability | **Research only** |

#### C-2 — Persistence on unsolved puzzles (Conscientiousness: industriousness/persistence)
| Field | Content |
|---|---|
| Behaviour | Time and number of changes (cards, fragments, stones, dial turns) on a scored puzzle before using a hint or skipping, for items not solved |
| Why | Persistence is part of industriousness |
| Alternatives | Lower ability (needs more time); slower reading; slow device; not noticing skip/hint; stubbornness; enjoyment of puzzles |
| Evidence | **Closest precedent:** Ventura & Shute (2013) — time spent on unsolved problems in a physics game related to an external persistence task and predicted learning after controlling for gender, game experience, pretest and enjoyment [E, narrow construct, US students] |
| Validation | Replicate their controls: ability (items solved), reading support use, device tier, enjoyment; correlation with C scales and with an external persistence task if feasible |
| Suitability | **Research only.** Time-based, therefore never reported to students (fairness rule) |

#### E-1 — Night camp seat (Extraversion: sociability)
| Field | Content |
|---|---|
| Behaviour | Choosing to sit at the big fire with travellers (music, stories) vs the small fire with Mehr (quiet, stars); equal outcomes; one observation |
| Why | Preference for lively social settings is the core of sociability (cf. mi11 "I talk to a lot of different people at parties") |
| Alternatives | Liking Mehr; curiosity about the music; visual attractiveness; cultural/gender norms about joining strangers; tiredness |
| Evidence | None direct; one binary observation has very low reliability |
| Validation | Point-biserial correlation with E scales; **mandatory gender DIF check**; drop if not convergent |
| Suitability | **Research only;** likely to be dropped — included to test, not to use |

#### A-1 — Giving away the festival ribbon (Agreeableness: compassion)
| Field | Content |
|---|---|
| Behaviour | Whether the student gives their cosmetic festival ribbon to Noor (L04), a costly prosocial act outside any RIASEC option |
| Why | Costly helping is a behavioural expression of compassion/altruism |
| Alternatives | Not valuing cosmetics (low cost); social desirability (being watched by researchers); Social interest; cultural norms of generosity; missing the event |
| Evidence | Analogy: in-game moral choices with a cost showed convergent validity for **Honesty–Humility** (a HEXACO trait, not Big Five Agreeableness) in Dutch graduate samples (Barends, de Vries & van Vugt, 2022) [E, analogy] |
| Validation | Correlation with A scales vs others; control social desirability (if a short scale is used in the study) and RIASEC S |
| Suitability | **Research only;** single observation |

#### Neuroticism — no gameplay indicator **[D]**
No defensible, non-stigmatising gameplay behaviour was found. Rejected candidates: rapid tapping after a wrong answer (device lag, playful tapping), mood emojis after setbacks (state, not trait), "retrying after a wrong practice answer" (existing exploratory estimate — more plausibly persistence/C; proposed for retirement, D-08). Emotional stability is reported only from the questionnaire, as "Staying calm".

### 4.2 Event design
All indicators use one additive event type, `RESEARCH_SIGNAL {signal_id, …}` **[A]**, so that research signals are clearly separated from assessment events in storage, analysis and code review (`TECHNICAL_ARCHITECTURE.md` §8).

## 5. Scoring and reporting (questionnaire)

Unchanged from the current implementation:
- reverse-keyed items scored 6 − answer; trait mean of answered items; reported if ≥ 3 of 4 answered; 0–100 rescaling for research; bands *higher* (mean ≥ 3.5), *in between*, *lower* (mean ≤ 2.5) for wording only;
- student wording: every end of every trait described as a strength or neutral; Neuroticism shown reversed as **"Staying calm"**; no numbers, no labels ("introvert"), no percentiles;
- RahYaab receives questionnaire scores and bands with instrument and version.

**Proposed adjustment [A]:** the current "agreement" sentences ("Two kinds of evidence point the same way…") link an interest with a trait using known overlaps (Larson, Rottinghaus & Borgen, 2002: Artistic–Openness, Investigative–Openness, Social–Agreeableness/Extraversion, Enterprising–Extraversion). Keep them, but (1) phrase as "fits with" not "evidence", and (2) never add a field suggestion that the interest alone did not already support. See `ASSESSMENT_TO_CAREER_MAPPING.md` §5.

## 6. Validation summary
Full plan in `VALIDATION_AND_RESEARCH_PLAN.md`. Key questions:
- **H-B1:** Does the in-game Mini-IPIP (journal) correlate with a criterion Big Five measure (BFI-2-S or Urdu BFI) at levels similar to published Mini-IPIP convergence? Is the five-factor structure recovered (CFA/ESEM)?
- **H-B2:** Do in-game journal scores differ from the same items given as a plain questionnaire (mode/context effect)? (Ramos-Villagrasa et al. found a Conscientiousness shift in their gamified version.)
- **H-B3:** Do any gameplay indicators show convergent > discriminant correlations after controlling covariates? Indicators failing this are removed.

## 7. What can and cannot be claimed

| Claim | Allowed |
|---|---|
| "Valley Explorer includes a short published Big Five questionnaire, presented as a journal." | Yes |
| "Your journal answers suggest you usually stay calm." | Yes (as the student's self-description) |
| "The game measures your personality from how you play." | **No** |
| "Valley Explorer's personality results are validated for Pakistani students." | **No** (not yet) |
| "Gameplay behaviours are being studied as possible indicators." | Yes |

## References
- Barends, A. J., de Vries, R. E., & van Vugt, M. (2022). Construct and predictive validity of an assessment game to measure Honesty–Humility. *Assessment, 29*(4), 630–650. doi:10.1177/1073191120985612
- Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP scales: Tiny-yet-effective measures of the Big Five factors of personality. *Psychological Assessment, 18*(2), 192–203. doi:10.1037/1040-3590.18.2.192
- Harman, J. L., & Brown, K. D. (2022). Illustrating a narrative: A test of game elements in game-like personality assessment. *International Journal of Selection and Assessment, 30*(1), 157–166. doi:10.1111/ijsa.12374
- Laajaj, R., et al. (2019). Challenges to capture the big five personality traits in non-WEIRD populations. *Science Advances, 5*(7), eaaw5226. doi:10.1126/sciadv.aaw5226
- Landers, R. N., & Collmus, A. B. (2022). Gamifying a personality measure by converting it into a story: Convergence, incremental prediction, faking, and reactions. *International Journal of Selection and Assessment, 30*(1), 145–156.
- Larson, L. M., Rottinghaus, P. J., & Borgen, F. H. (2002). Meta-analyses of Big Six interests and Big Five personality factors. *Journal of Vocational Behavior, 61*(2), 217–239.
- Mussel, P., Gatzka, T., & Hewig, J. (2018). Situational judgment tests as an alternative measure for personality assessment. *European Journal of Psychological Assessment, 34*(5), 328–335. doi:10.1027/1015-5759/a000346
- Oostrom, J. K., de Vries, R. E., & de Wit, M. (2019). Development and validation of a HEXACO situational judgment test. *Human Performance, 32*(1), 1–29. doi:10.1080/08959285.2018.1539856
- Ramos-Villagrasa, P. J., Fernández-del-Río, E., Hermoso, R., & Cebrián, J. (2024). Are serious games an alternative to traditional personality questionnaires? Initial analysis of a gamified assessment. *PLoS ONE, 19*(5), e0302429. doi:10.1371/journal.pone.0302429
- Soto, C. J., & John, O. P. (2017). Short and extra-short forms of the Big Five Inventory–2: The BFI-2-S and BFI-2-XS. *Journal of Research in Personality, 68*, 69–81. doi:10.1016/j.jrp.2017.02.004 (BFI-2 items © 2015 John & Soto; permission for personal and research use)
- Ventura, M., & Shute, V. (2013). The validity of a game-based assessment of persistence. *Computers in Human Behavior, 29*(6), 2568–2572. doi:10.1016/j.chb.2013.06.033
- Curiosity task analogies: "Questions Worlds" digital curiosity assessment, *International Journal of Information and Education Technology, 10*(8), 614–621 (2020); "The Animal Game" (Becker Friedman Institute working paper 2026-112). Both with younger children; cited as analogies only.

- Fadillah, Hidayat, R., & Santoso, A. (2025). Convergent validity of game-based assessment: A meta-analysis. *International Journal of Serious Games, 12*(4). doi:10.17083/etxn7795 — a meta-analysis of GBA–self-report convergence that also highlights circular validation as a concern.

*Mussel (2018), Oostrom (2019), Soto & John (2017), Landers & Collmus (2022) and Ramos-Villagrasa (2024) were checked online on 19 Nov 2026. Other entries follow the Phase 1 bibliography; items marked `confirm-before-submission` there must still be checked against the publisher.*
