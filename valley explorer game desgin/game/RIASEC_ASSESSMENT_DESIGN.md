# RIASEC Interest Assessment Design

**Version:** 1.0 design proposal · 19 Nov 2026
**Scope:** how the three interest levels (L02 Caravan, L03 Makers' Hall, L04 Riverside Park) produce a RIASEC interest profile, how each activity maps to a type, how the score is computed, and how interest is kept separate from ability.
**Status:** game-based interest measurement **[H]** — exploratory, rule-based, not validated (`is_validated: false`, existing).

---

## 1. Principles

1. **Never ask which career the student likes.** Interest is inferred from **what students choose to do** and **how they engage** when several kinds of work are available with equal rewards.
2. **Choice before experience.** Options are chosen from signposts/benches/sites *before* the student sees the activity's details, so the choice expresses attraction to the kind of work, not the ease of a particular screen.
3. **Equal offers.** Every type is offered equally often (Caravan: balanced design; Hall and Park: all six always available) and in balanced/randomised positions.
4. **Interest ≠ ability.** Activities cannot be failed; completion and performance are recorded but carry **weight 0** in the interest score (existing `component_weights`).
5. **Three contexts, one profile.** A travelling choice (Caravan), a free-allocation workshop (Makers' Hall) and a community event with a declared role (Park) are combined; agreement between them is reported.

## 2. Theoretical and empirical basis

| Point | Source | Label |
|---|---|---|
| Six interest types arranged around a hexagon; people seek environments congruent with their type | Holland (1997) | [E] theory |
| Interests (especially person–environment congruence) relate to performance and persistence | Nye, Su, Rounds & Drasgow (2012) | [E] |
| Interests are fairly stable by late adolescence but still developing at 12–17 → re-assessment needed | Low, Yoon, Roberts & Rounds (2005) | [E] |
| Large average sex differences on Realistic and Social interests | Su, Rounds & Armstrong (2009) | [E] — fairness implication: never turn group differences into gendered advice |
| The hexagon fits less well outside the US; an Urdu Career Key study found sound scales but not the expected hexagon | Rounds & Tracey (1996); Career Key Urdu (Phase 1 review) | [E] → use **scale scores only**; no hexagon-based indices (consistency, differentiation by angle) |
| Pakistani graduates often study disciplines incongruent with their RIASEC profile (O*NET Interest Profiler, n = 1,503) | Faize & Husain (2024) | [E] local relevance |
| Inferring interests from behaviour in a game | Some industry products and theses exist (e.g., a validation thesis of a RIASEC GBA; an unobtrusive computer task for "implicit interests" found implicit and explicit interests are not the same) | **Weak evidence [H]** — RahYaab's game measure must be validated against a questionnaire |

## 3. What each type means in the game

Operational definitions follow Holland's work-activity descriptions (as used in O*NET Interest Profiler descriptors):

| Type | Core of the work | In-game signature mechanic | Not to be confused with |
|---|---|---|---|
| **R** Realistic | Working with things, tools, machines, materials; making things work | Assemble & fix | Strength or "boys' work" (NPC is a woman) |
| **I** Investigative | Observing, testing, finding out why | Observe & test, record | Getting answers right (no right answer in interest activities) |
| **A** Artistic | Creating, designing, expressing; open-ended results | Compose & decorate, any result accepted | Drawing skill (no judging of results) |
| **S** Social | Helping, teaching, caring for people directly | Listen & care | Being "nice" (personality); the NPC is a man |
| **E** Enterprising | Persuading, organising people, leading, selling | Pitch & organise people | Extraversion (personality); any pitch works |
| **C** Conventional | Organising data, records, things in clear systems | Sort & record | Neatness (personality) or accuracy (errors bounce back) |

## 4. Activity-to-RIASEC map

Every activity loads on **one** type with weight 1.0 (existing config: pure tasks). Variants share their parent task ID so scoring is unchanged. **[D]** Mixed-type activities were rejected because they make choices ambiguous.

### 4.1 Crossroads Caravan (task IDs existing)
| Task ID | Type | Variant A | Variant B | Why it represents the type |
|---|---|---|---|---|
| `wheel_workshop` | R | W-R1 cart wheel | W-R2 field gate | Fixing a physical object with tools |
| `lantern_riddle` | I | W-I1 water test | W-I2 bee mystery | Observing and testing to find a cause |
| `mural_wall` | A | W-A1 caravan banner | W-A2 stall sign | Designing something with free choices |
| `fireside_circle` | S | W-S1 exhausted traveller | W-S2 kite knot for a child | Directly helping/teaching a person |
| `market_square` | E | W-E1 recruit a porter | W-E2 persuade the ferryman | Persuading someone to join/agree |
| `ledger_tower` | C | W-C1 sort cargo | W-C2 check the ledger | Ordering items and records |

*Note:* task IDs keep their historical names (e.g., `lantern_riddle` now hosts the water test) to preserve parity with the Python scorer and existing data; display names change. **[D]**

### 4.2 Makers' Hall
| Task ID | Type | Activity | Revisit variants |
|---|---|---|---|
| `repair_pump` | R | Water pump | Older pump; cart axle |
| `plant_lab` | I | Garden lab (light vs shade) | Water variable; soil test |
| `poster_studio` | A | Poster studio | Stage backdrop; festival flag |
| `teach_timetable` | S | Study buddy | Second student's worry; peer reading |
| `open_day_stall` | E | Open-day stall | Second sponsor; recruit volunteers |
| `sort_records` | C | Records office | Second box; equipment log |

### 4.3 Riverside Park
| Task ID | Type | Morning / Afternoon / Evening tasks (`GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5.3) |
|---|---|---|
| `park_repair` | R | Wobbly bench / lantern stand / stage frame |
| `park_survey` | I | Pond water test / visitor counts compared / which lanterns burned longest |
| `park_design` | A | Signposts / stage backdrop / thank-you card |
| `park_volunteers` | S | Welcome elderly visitors / comfort a lost child / serve volunteers tea |
| `park_sponsors` | E | Borrow chairs / announce the next event / invite sponsors back |
| `park_permits` | C | File permits / lost-and-found list / equipment log |

Roles (existing): Builder → R, Researcher → I, Designer → A, Helper → S, Leader → E, Record keeper → C.

### 4.4 Content-validity check (required before implementation)
An expert panel (≥ 5 Pakistani counsellors/teachers, Study B) rates each activity: "Which type does this activity represent?" (forced choice among six) and "How typical is it of that type?" (1–4). Keep an activity only if ≥ 80% assign the intended type and I-CVI ≥ .78 (Lynn, 1986; Polit & Beck, 2006). Activities failing are redesigned.

## 5. Scoring logic (existing, with one proposed change)

For each interest level separately:

1. **Selections** — for each type *c*: number of times chosen (capped per task: Caravan 5, Hall 3, Park 3), plus **0.5** for each role vote in the Park.
2. **Preference** — selections ÷ number of times type *c* was offered (normalise by opportunity), turned into a share across the six types; share capped at 0.40 and rescaled 0–1 (so one dominant type cannot exceed full marks and others are not pushed to zero by a single extreme).
3. **Engagement** — for every chosen activity, a 0–1 mix of: *optional steps done* (0.35), *bonus round taken* (0.20), *finished rather than left* (0.15), *dwell (time ÷ expected)* (0.10), *revisits* (0.20); averaged per type, weighted by selections.
4. **Level score** per type = 100 × (0.6 × preference + 0.4 × engagement). *Completion* and *performance* are computed and shown in research outputs but weight 0.
5. A level is used only if it had ≥ 3 free selections.

Across levels: the three level scores are averaged (equal weights 0.5 each); **top 3** types form the Holland code; **flat profile** if the spread between highest and lowest is < 15 points (reported to students as "you liked many kinds of work equally"); **agreement** between levels = correlation of level profiles (reported to counsellors).

### Proposed change: remove "dwell" **[A]** (decision D-07)
"Dwell" rewards spending longer than expected in an activity. Slower readers, slower phones and students who need more time look *more interested*, which conflicts with the no-speed rule and fairness pillar. Proposal: set dwell weight to 0 and renormalise (optional 0.39, bonus 0.22, persist 0.17, revisit 0.22). Because the Python scorer must stay identical (parity test), the change is made in `riasec_config.json` (both sides read the same config) with a new `model_version`, and the parity fixture regenerated.

### Worked example (Makers' Hall)
A student does: Garden lab (I) ×2 with all optional steps and one bonus; Poster studio (A) ×1, no optional steps; Records office (C) ×1, left halfway.
- Selections: I = 2, A = 1, C = 1 (each offered once → raw shares 0.50, 0.25, 0.25) → preference (cap 0.40): I = 1.0, A = 0.625, C = 0.625, others 0.
- Engagement (proposed weights without dwell): I = 0.39×1 + 0.22×1 + 0.17×1 + 0.22×0.5 ≈ 0.89; A = 0.17 (finished only); C = 0 (left, no extras).
- Level scores = 100 × (0.6 × preference + 0.4 × engagement): I ≈ 96, A ≈ 44, C ≈ 38, R/S/E = 0.
The student's Makers' Hall profile is led by Investigative; it is then averaged with the Caravan and Park profiles.

## 6. Keeping interest separate from ability

| Risk | Safeguard |
|---|---|
| Students choose what they are good at, not what they like | Activities are designed to be easy for everyone; no activity can be failed; choices are made before activity details are seen |
| Engagement reflects skill (skilled students finish and do extras) | Required steps are trivial; optional steps are equally easy; completion/performance weight 0; performance logged for checks (correlation of engagement with puzzle results should be low) |
| Puzzle success leaks into interest (e.g., good at Workshop Orders → likes R/C) | Puzzles are separate levels with neutral hosts (Nasreen, Mehr, plaque, Baba Sher), not makers |
| Interest leaks into ability | Ability items have right answers; rewards and story are identical for all outcomes |

## 7. Threats to validity and mitigations

| Threat | Mechanism | Mitigation | Check (pilot/validation) |
|---|---|---|---|
| **Liking an NPC** | Students follow a likeable maker | Neutral, equally warm makers; equal exposure; work-first signposts; counter-stereotyped gender | Ask "favourite character" in pilot; check overlap with top type |
| **Position / proximity** | Left road, nearest bench | Balanced/randomised positions, logged | Position effects in logistic models |
| **Visual salience** | Brightest signpost wins | Same size, contrast and animation for all options; colours from one palette with equal luminance (`VISUAL_ART_DIRECTION.md`) | Expert review; heatmap of first choices |
| **Variety seeking** | "I'll try something new each time" | Variety is legitimate exploration; revisits and engagement weigh in; agreement across levels reported | Compare Caravan (forced) with Hall (free) |
| **Satisficing / speed** | Choosing whatever seems quickest | Equal durations ± 15%; durations shown nowhere | Pilot timing per type |
| **Gender stereotypes** | Girls avoid "R", boys avoid "S" | Counter-stereotyped NPCs; neutral wording; results never gendered | DIF by gender in validation |
| **Social desirability** | Role choice to look good (e.g., Leader) | Role vote weight 0.5 only; behaviour counts more | Declared vs behavioural agreement |
| **Fatigue** | Later choices careless | Two chapters; variants; short work moments | Choice entropy by fork number |
| **Reading load** | Weak readers avoid text-heavy activities | Icons for every step; read-aloud; equal text per activity | Use of read-aloud vs choices |
| **Prior school identity** | Science-group students choose I | Not a threat — part of real interest — but note in interpretation | Compare with academic group (host data) |

## 8. Outputs

| Output | Audience |
|---|---|
| Top interests (up to 3 types above `MIN_TOP_SCORE = 25`) in plain words + one example of what they chose | Student |
| Flat-profile message where applicable | Student |
| Scores 0–100 per type, Holland code, level scores, components, agreement, caveats, `is_validated: false` | RahYaab, counsellor, research dashboard |

## 9. Validation (summary)
See `VALIDATION_AND_RESEARCH_PLAN.md` Study D: convergent validity with the **O*NET Interest Profiler Short Form** (60 items; O*NET tools licensed for use with attribution — verify current terms) and/or the Urdu Career Key; test–retest at 2–4 weeks; level agreement; DIF by gender, school type and device tier; acceptability.

## References
- Faize, F. A., & Husain, W. (2024). Education without aptitude: Mismatched vocational personalities for professional placements. *e-mentor, 4*(106), 13–21.
- Holland, J. L. (1997). *Making vocational choices* (3rd ed.). PAR.
- Low, K. S. D., Yoon, M., Roberts, B. W., & Rounds, J. (2005). The stability of vocational interests from early adolescence to middle adulthood. *Psychological Bulletin, 131*(5), 713–737.
- Lynn, M. R. (1986). Determination and quantification of content validity. *Nursing Research, 35*(6), 382–385.
- Nye, C. D., Su, R., Rounds, J., & Drasgow, F. (2012). Vocational interests and performance. *Perspectives on Psychological Science, 7*(4), 384–403.
- Polit, D. F., & Beck, C. T. (2006). The content validity index. *Research in Nursing & Health, 29*(5), 489–497.
- Rounds, J., & Tracey, T. J. (1996). Cross-cultural structural equivalence of RIASEC models and measures. *Journal of Counseling Psychology, 43*(3), 310–329.
- Su, R., Rounds, J., & Armstrong, P. I. (2009). Men and things, women and people. *Psychological Bulletin, 135*(6), 859–884.
- Castelló, A., & Cladellas, R. (2021). Assessment of implicit interests through an unobtrusive computer task. *IJERPH, 18*(23), 12366.
- Phase 1 bibliography (`research_references.bib`) for full entries and verification status.
