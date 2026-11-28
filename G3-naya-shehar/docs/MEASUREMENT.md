# Measurement design

Naya Shehar collects **evidence** through ordinary gameplay. This document describes exactly
what is collected, how it is scored, and — importantly — what has **not** been validated.

## 1. Principles

1. **Gameplay first, no questionnaires.** No Likert scales, no "Do you enjoy…?", no self-ratings.
   The only self-report is the optional *Meh / Okay / Loved it* reaction after an activity.
2. **Town rewards never touch scores.** Homes, Happiness, Balance, grant money and building
   progress live in `src/game/progression/town.ts` and are never read by `src/assessment/**`.
   Both sides of a forced choice give identical rewards (tested).
3. **Abilities never touch interests.** `task_result` events are ignored by the interest model (tested).
4. **No hidden measures.** No response times, hesitation, or free text are recorded. The event
   validator rejects timing/free-text fields (`src/assessment/events.ts`).
5. **Practice is never scored.** Week 0 records no assessment events.
6. **Accessible task mode = not measured.** If it is on when a week starts, the session is
   recorded as not measured. If it is switched on mid-week, the *whole* session — including events
   already saved — is excluded. Switching it off never re-measures a session.

## 2. Evidence (event types)

| Event | When | Payload |
|---|---|---|
| `choice_made` | Player picks one of two activities | `presented: [left, right]`, `chosen` |
| `plan_committed` | Weekly planner locked in | `offered` (6 categories), `ranked` (top 3 in order) |
| `reaction` | Optional Meh/Okay/Loved it | `category`, `value` |
| `task_result` | Ability puzzle finished | `family`, `level` presented, `firstAttemptCorrect`, `solved`, `attempts` |

Every event carries an item id, week, session id, `measured` flag and an audit timestamp
(the timestamp is never used in scoring). Events are validated before they are written, and
written in the same SQLite transaction as the game state.

## 3. RIASEC forced choices

- **15 pairs × 2 = 30 presentations.** Pairs are arranged as a round-robin (1-factorisation of K6):
  five rounds of three disjoint pairs, so each round shows every category once.
- **Schedule:** Weeks 1–2 show every pair once (8 + 7). Weeks 3–4 show every pair again with
  **sides swapped** (8 + 7), two weeks after the first showing. Each category appears on the left
  5 times and on the right 5 times; every week shows every category at least twice. All verified in
  `tests/content.test.ts`.
- **Balance of options:** both options are drawn by the same card component, use the same
  vignette style and size, text lengths are within ±35 % (tested), and the partner characters
  include Ayesha and Bilal across all six kinds of work (tested). There is no right/wrong feedback.

## 4. Weekly planner

Six activities, one per category, shown in a per-week shuffled order. The player picks three and
orders them (↑/↓ buttons — the accessible alternative to dragging).

## 5. Interest scoring — INTERIM model (`interim-bt-map-v1`)

`src/assessment/scoring/riasec.ts`

- **Model:** Bradley–Terry paired comparisons (the logistic form of Thurstone's Case V), one utility
  θ per category, prior θ ~ N(0, 1), MAP estimate by Newton's method. Standard errors from the
  inverse negative Hessian.
- **Evidence → comparisons:**
  - forced choice: chosen ≻ other, weight 1.0
  - planner: rank1 ≻ rank2 ≻ rank3 and each ranked ≻ each unranked, weight 0.5 (12 comparisons)
  - reaction: *Loved it* ≻ neutral anchor (θ=0), anchor ≻ *Meh*, weight 0.3; *Okay* adds nothing
- **Confidence labels** per category from the SE: `high` < 0.60 ≤ `medium` < 0.72 ≤ `low`.
  These cut-offs were chosen by simulating this exact 4-week design; after one week SEs are
  ≈ 0.70–0.80, after four weeks ≈ 0.55–0.70. They describe the precision of *this model*, not validity.
- **Consistency:** proportion of the 15 repeated pairs where the same category was chosen both times.
- **Simulation check (tests):** 200 simulated players with random true utilities; the true top
  category lands in the estimated top two in ≥ 85 % of players.

**Intended production model.** A Thurstonian IRT model for forced-choice blocks, with item
parameters (loadings, thresholds) calibrated on real Pakistani student data. That calibration
does not exist yet, so the interim model treats every item as equally informative. Replace
`fitBradleyTerry` once calibrated parameters are available; the event format already supports it.

## 6. Abilities — INTERIM model (`interim-rasch-eap-v1`)

`src/assessment/scoring/abilities.ts`, `src/assessment/abilities/**`

- Six families: SPA (shapes & space), ABS (patterns), NUM (numbers), LOG (clues & logic),
  PLN (planning), VRB (words). **16 puzzles per family, 4 per level, 96 total**, plus 2 practice items.
- **Staircase:** start at level 2; correct first attempt → +1 level, incorrect → −1, bounded 1–4.
  If a level is used up the nearest level is used, and the **actually presented** level is recorded.
  Two puzzles per family per week → 8 per family overall; no puzzle repeats.
- **Scoring:** Rasch model with *nominal* difficulties (L1 −1.5, L2 −0.5, L3 +0.5, L4 +1.5),
  EAP on a grid with a N(0,1) prior, first-attempt outcomes only. Bands: developing / steady / strong.
- **No timers** and no penalty for slow answers. Players may retry up to 3 times (learning), then the
  answer is shown; only the first attempt counts.
- **Answer keys are verified in tests:** SPA distractors are proven not to be rotations of the gap;
  ABS options are distinct; NUM answers are re-derived independently; PLN optimal routes are
  re-computed by brute force; logic puzzles with unique-solution claims are checked by enumeration.

## 7. Career pathways

`src/assessment/recommendations/` — a transparent, versioned rules engine (`2026.11-draft-1`).

- Fit = 0.6 × (weighted, standardised interest θ) + 0.4 × (weighted ability θ).
- Eligibility filters by Matric group (Science-Biology / Science-Computer / Arts / O-Levels / not chosen).
- Output: top 3 eligible pathways + a Plan B (from the other track — academic vs technical — when
  the top 3 share one track), each with plain-language reasons. A reason is only shown when it is
  supported (interest not low-confidence and above average; ability band not "developing" and not
  low-confidence).
- **All eligibility rules are marked `verified: false`** and the app tells students to confirm
  admission rules with their school, BISE board or college. Before real use, a reviewer must attach
  official sources (BISE, IBCC, TEVTA, institutions) in `rules.ts` and flip `verified` to true.

## 8. What this is not

The results are guidance from a game. They are **not** a psychometric diagnosis, have **not** been
validated against an external criterion, and must not be used for selection decisions. The results
screen says so in plain language.
