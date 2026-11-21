# Assessment mapping and scoring (v: riasec-0.3-prototype, ability-0.1-prototype)

**Nothing here is a validated measure.** All weights and thresholds are design assumptions. Raw events are stored unchanged; every derived result records the scoring version, so results can be recomputed later.

## 1. Final 8-level structure (from the original 10 levels)

| # | Level | Category | Construct (operational) | Origin | Decision |
|---|---|---|---|---|---|
| 1 | The Valley Gate | **C. Context** (unscored) | — teaches tapping; optional exploration logged as context | L1 Whispering Valley (Big Five Openness) | Modified: Big Five scoring removed |
| 2 | Crossroads Caravan | **A. RIASEC** | Preference among 3 forced-choice roads (BIBD: each type offered 5×, each pair 2×) + engagement in the chosen job | L10 | Retained; touch UI |
| 3 | Workshop Orders | **B. Ability – planning & numerical** | Choose orders under resource limits that reach the maximum value | L2 Workshop (Big Five C) | Redesigned; original puzzle kept as item `wo5` |
| 4 | The Makers' Workshop | **A. RIASEC** | Which unlabelled benches the student spends 10 time blocks on; optional steps, bonus rounds, revisits | L7 | Retained, simplified (14→10 blocks) |
| 5 | The Map Room | **B. Ability – spatial** | Pick the rotation (not a reflection) of a map piece | New; replaces L4's role | New |
| 6 | The Pattern Gate | **B. Ability – abstract** | Infer the next panel of a rule-based shape sequence | New | New |
| 7 | Riverside Park Day | **A. RIASEC** | Role choice + 9 site choices over 3 phases | L8 Integrated Career Mission | Simplified (budget/requirement systems removed) |
| 8 | The Vault Locks | **B. Ability – logical** | Deduce a unique 3-number code from feedback clues (no timer) | L4 Crumbling Vault (Big Five N) | Redesigned; time pressure, gambles and failure removed |
| — | Reflection | **C. Context** | Favourite activity type, how it felt | New | Never scored |

**Excluded from the student assessment:** L3 Harbor Village (Big Five E/A; helping ≠ Social interest), L5 Strategic Expedition and L6 Flood Response (Big Five; no correct answers; long reading). L9 Courtyard Garden (Big Five). The Python code remains in the original project, unchanged. **Verbal reasoning is not included:** it needs Urdu/English items written and checked by people, not translated automatically.

## 2. RIASEC interest profile
Ported **line by line** from `analytics/riasec_scoring.py`. Parity is tested exactly (to 6 decimal places, including the Holland code) against outputs produced by the Python code itself on 40 generated cases (`tools/make_riasec_parity_fixture.py`).

- Units per activity: selections (capped: caravan 5, workshop/park 3), rounds (completed/abandoned), optional steps, bonus, revisits, dwell ratio.
- **Preference** = share of voluntary choices per category, normalised by opportunity and capped at 0.4 (0–1).
- **Engagement** = weighted mean of optional (0.35), bonus (0.20), persist (0.15), dwell (0.10, capped ratio; speed is never used) and revisit (0.20).
- Level score = 100 × (0.6·preference + 0.4·engagement). Completion and performance are computed but have **weight 0**, so skill is never read as interest.
- A level counts only with ≥ 3 voluntary choices. Levels are combined with equal weights. Agreement between levels = mean pairwise Pearson r. A profile is "flat" when range < 15.
- Park roles add 0.5 of a selection to the role's category.
- **Display rule (new, provisional):** only areas scoring ≥ 25 are shown to the student as top interests (`MIN_TOP_SCORE`). The Python scorer always fills a 3-letter code, even with categories scoring 0. The full code is still passed to RahYaab as `holland_code`, and `shown_top` records what the student saw.
- Robustness: choices are de-duplicated by `opportunity_id`; activity ends are keyed by (task, round).

## 3. Ability evidence
- Each family: 1 practice item (never counted, can be retried) + 6 scored items with a provisional difficulty order.
- Only the **first** response counts. One hint per item (recorded). Skip is always allowed.
- Reported: attempted, first-try correct, correct without hint, skipped. **No bands, percentiles or combined "ability" number**, because no norms exist.
- At least 4 **attempted** (not skipped) items are needed, otherwise the result is "insufficient evidence".
- Response time is stored but not scored (slow phones, reading speed).
- Item correctness is proven by tests: every lock has exactly one solution and every clue is necessary; every map pattern has 8 distinct transforms and exactly one rotation option; every pattern key matches an independently written rule; every orders item has a unique optimum, and a greedy "biggest first" choice fails on 4 of 6.

## 4. Normalisation and missing data
- Interest: within-student shares (ipsative), so no norms are needed. Missing levels are dropped and the level weights renormalised.
- Ability: raw counts only.
- Not played → `not_played`. Too little evidence → `insufficient_evidence` / caveat text. Nothing is imputed.

## 3a. Big Five personality (Mini-IPIP journal)
See `docs/BIG_FIVE.md`: 20 public-domain items asked 2–3 at a time after each stop; reverse keying; mean rescaled to 0–100; ≥ 3 of 4 items per trait; exploratory gameplay estimates for O, C and N kept for research only. Journal answers earn no coins.

## 4a. Game rewards are not scores
Coins (`game/rewards.ts`): 20 per finished stop, 3 per finished activity (same for all six activity kinds), 2 per puzzle tried (right or wrong, practice excluded). Optional extras, bonus rounds and correctness earn nothing, so rewards cannot pull choices toward an interest area or penalise wrong answers. Rewards are never used in scoring.

## 5. Reliability limitations
Ten forks and a few short sessions give few observations per category. Choices can reflect mood, curiosity or the other options on offer. Six items per ability family is far too few for individual-level reliability. Hint and skip behaviour changes what is measured. Item difficulty has not been piloted.

## 6. Validation still required
Content review of the item→construct mapping by experts; cognitive interviews (Urdu and English); a pilot measuring item p-values and point-biserial correlations; test–retest; convergence of the game RIASEC profile with a licensed questionnaire (O*NET Interest Profiler, Urdu adaptation); convergence of ability families with established reasoning tests; differential item functioning by gender, language and device. See the earlier research package (`psychometric_validation_plan.md`).
