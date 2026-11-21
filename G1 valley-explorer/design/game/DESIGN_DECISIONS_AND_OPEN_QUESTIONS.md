# Design Decisions, Open Questions and Final Design Review

**Version:** 1.0 design proposal · 19 Nov 2026
Every decision below is either **recommended and needing approval [A]** or a **design decision [D]** that can be changed at review. Nothing is implemented until approved.

---

## 1. Decisions requiring approval

| ID | Decision | Options | Recommendation | Consequence if not approved |
|---|---|---|---|---|
| **D-01** | **Play order of the eight levels** | (a) Alternate interest and puzzle stops, as implemented and approved on 15 Nov 2026: Gate → Caravan → Orders → Makers' Hall → Map Room → Pattern Gate → Park → Vault; (b) the order listed in the brief: Gate → Caravan → Makers' Hall → Park → Orders → Map → Pattern → Vault | **(a)** — avoids three interest levels in a row and three puzzle levels in a row (fatigue, boredom); story is written for (a). Document numbers follow the brief's list. | With (b), the story beats for stops 3–7 must be reordered (e.g., the Park would come before the aqueduct is opened) |
| **D-02** | Orientation | Portrait / landscape | **Updated 20 Nov after phone testing:** **landscape by default**, with a Rotate button to switch to portrait (implemented in v0.5). The portrait-only recommendation in `GAME_VISION.md` §6 is superseded. | — |
| **D-03** | Session structure | One 55-min sitting / two chapters | **Two chapters (~25 min each) with a Night camp save** | One sitting risks fatigue and incomplete sessions in school periods |
| **D-04** | In-game Big Five instrument | Mini-IPIP (20, public domain) / BFI-2-XS (15) / BFI-2-S (30) | **Keep Mini-IPIP in-game;** use BFI-2-S or an Urdu BFI as the *criterion* in the validation study | Changing the in-game instrument means new items, keys, pages and backend version |
| **D-05** | Read-aloud | None / device text-to-speech (`expo-speech`) / recorded English voice | **Device TTS first** (no bundle cost; in Expo Go), evaluate on target phones; recorded voice if TTS quality is poor | Without read-aloud, weaker English readers are disadvantaged |
| **D-06** | Tap-to-walk | D-pad only / D-pad + tap-to-walk | **Both** (logged as covariate) | Less experienced players may struggle |
| **D-07** | Remove "dwell" (time) from RIASEC engagement | Keep / remove | **Remove** (time-based, unfair to slow readers/devices) — new RIASEC `model_version`, parity fixture regenerated | Speed indirectly affects interest scores |
| **D-08** | Gameplay research signals | Keep current estimates (O variety, C optional/finish, N retry) / replace with independent signals (O-1, O-2, C-1, C-2, E-1, A-1) and new `RESEARCH_SIGNAL` event | **Replace** — current estimates reuse RIASEC events (circular) | Research comparisons stay inflated by shared data |
| **D-09** | Include E-1 (night-camp seat) and A-1 (ribbon) | Include / drop | **Include as research-only tests**, with gender DIF checks; drop after pilot if weak | Fewer indicators for E and A (none) |
| **D-10** | Unscored practice journal statement on page 1 | Yes / no | **Yes** (teaches the scale) | Students learn the scale on a real item |
| **D-11** | NPC gender assignment (woman mechanic, man teacher, etc.) | Counter-stereotyped / stereotyped / random | **Counter-stereotyped**, reviewed by teachers/counsellors for cultural acceptability | Risk of reinforcing gendered choices |
| **D-12** | Pathways (ICS, FSc, I.Com, FA, DAE…) in the game | Show in the game via adapter extension / link back to RahYaab | **Link back to RahYaab in v1**; adapter extension later | — |
| **D-13** | Puzzle results in pathway ranking | Weight 0 / small weight | **Weight 0 in v1** (no norms, no predictive evidence) | Unvalidated puzzles would influence advice |
| **D-14** | Replaying completed stops | Allowed for assessment / visit only | **Visit only** | Replays would overwrite or duplicate evidence |
| **D-15** | Personality–interest "agreement" sentences on results | Keep as is / reword as "fits with" / remove | **Reword** and never add new field suggestions from personality | Overstates evidence |
| **D-16** | Research consent flag in the adapter | Single consent / separate research consent | **Separate flag** controlling `RESEARCH_SIGNAL` and covariates | Research data collected under general consent |
| **D-17** | Asset budget and optional display font | System font only / add an OFL display font; art ≤ 15 MB | **System font; art ≤ 15 MB** | Larger install on low-end phones |
| **D-18** | Supervisor sign-off on Big Five shown to students | — | **Obtain in writing** (earlier brief required approval for Big Five) | — |

## 2. Design decisions made in this package (changeable at review) [D]
- Fictional setting (Rahwali Valley); no disaster or danger themes; no religious/political symbols.
- Neutral (non-maker) hosts for puzzle levels and story (Mehr, Nasreen, Faraz, Saima, Baba Sher).
- Equal-lightness work-type colours; work icon first, maker second on choice signs.
- Randomised bench/site/role order (logged).
- No failure in interest activities; mistakes bounce back.
- Progress never depends on puzzle correctness (story resolves unsolved items).
- Coins: same for every choice and outcome; no coins for journal answers; cosmetics only.
- No name entry; the player is always "Rahyaab".
- Map fragments cannot be rotated by the player (protects the mental-rotation construct).

## 3. Open questions (need information from the project team)

| # | Question | Why it matters | Who |
|---|---|---|---|
| Q1 | Has the supervisor approved showing Big Five results to students (D-18)? | Ethics/approval rule in the original brief | Student + supervisor |
| Q2 | Which phones will students actually use (school lab, own phones, shared)? Minimum Android version/RAM? | Performance budget, art size, TTS availability | Team (pilot schools) |
| Q3 | How long is a class period in the pilot schools, and can two periods be used? | Chapter length | Schools |
| Q4 | Can 5–8 counsellors/teachers review activities and pathway profiles (Study B)? | Content validity, matching weights | Supervisor |
| Q5 | May the *research* criterion questionnaires be in Urdu even though the game is English? | Criterion validity with weaker English readers | Supervisor/ethics |
| Q6 | Will RahYaab collect a one-question gaming-experience item and school marks? | Covariates; academic fit | Host app team |
| Q7 | Who will produce the art and audio (team member, freelancer, open assets)? | Feasibility of the visual plan | Team |
| Q8 | Data retention period and storage location for research data? | Ethics | Supervisor/ethics |
| Q9 | Is a Grade 9–10 vs Grade 11–12 version needed (Decision 1 vs Decision 2 pathways)? | Results page and pathway list | Team |
| Q10 | Should the game offer a short RIASEC questionnaire fallback if game RIASEC fails validation? | Decision rule in the validation plan | Team |

## 4. Known tensions and how this design handles them

| Tension | Handling |
|---|---|
| "Not questionnaire-heavy" vs "include the 20-item Mini-IPIP" | 2–3 items per stop at a rest spot (~40 s), verbatim; total ≈ 5 min of 55 |
| "Assessment through gameplay" vs evidence that rewriting personality items as story weakens measurement (Landers & Collmus, 2022) | Interests and puzzles are gameplay-based; personality uses the questionnaire with game framing only; gameplay personality signals stay research-only |
| "English only" vs weak English reading for many students | Short lines, icons, read-aloud, glosses; Urdu flagged as a future decision |
| Phase 1 advised against Mini-IPIP as a criterion | It is used as the in-game measure, not as the criterion; a longer measure is the criterion in Study D |
| Richer art/audio vs low-end phones | Budgets in `TECHNICAL_ARCHITECTURE.md` §12; device testing in the pilot |
| More activity variety vs fairness of comparison | Same step counts and durations (±15%) enforced by tests and pilot timing |
| Brief's level list order vs implemented alternating order | D-01 |

## 5. Final design review

| Question | Answer | Evidence in this package |
|---|---|---|
| **Is this genuinely an adventure game?** | **Yes, with a caveat.** There is a walkable world, a quest across eight connected locations, NPCs, collectibles, unlocks, a companion and an ending. The caveat: four of eight stops contain puzzle items with defined answers; they are presented as environmental puzzles, but they remain structured items (necessary for ability evidence). | `WORLD_AND_STORY_DESIGN.md`, level docs |
| **Does every level have actual gameplay?** | **Yes.** Each level has movement plus a level-specific mechanic: repair a latch; choose roads + work moments; plan on a board; allocate candles across six distinct activities; place map fragments; set stones and turn a wheel; manage park shifts; swipe dials and pull levers. | Level docs §11 |
| **Are the eight levels connected through one story?** | **Yes** — the Lantern Festival quest; each stop advances the festival and adds a map piece; the Night camp and the festival-night ending frame the two chapters. Works with play order D-01(a). | `WORLD_AND_STORY_DESIGN.md` §3 |
| **Are Big Five and RIASEC both included?** | **Yes.** RIASEC from three gameplay levels; Big Five from the in-game Mini-IPIP journal. | Assessment docs |
| **Are interests separated from ability?** | **Yes.** Interest activities cannot be failed and performance has weight 0; puzzles have neutral hosts and are scored separately; rewards are identical across outcomes. Residual risk (students choosing activities they feel competent in) is tested in Study D. | `RIASEC_ASSESSMENT_DESIGN.md` §6 |
| **Is the personality assessment scientifically defensible?** | **Partly.** The scored part uses a published public-domain instrument with documented reliability (α at or above .60 in the original studies), unchanged wording, and no gameplay inference. Not yet defensible: validity for Pakistani adolescents in English, and possible context effects of the journal presentation — both are explicit hypotheses (H-B1–H-B4). Gameplay personality signals are clearly research-only. | `BIG_FIVE_ASSESSMENT_DESIGN.md` |
| **Can students complete the journey without getting bored?** | **Probably, but unproven.** Mitigations: two short chapters, variety of mechanics and environments, short dialogue, no repeated identical activities, visible progress. The Caravan (10 choices) and the Park (9 shifts) are the main boredom risks; pilot targets H-U1–H-U4 test this. | `GAME_VISION.md` §8 |
| **Can the game run on ordinary Android devices?** | **Designed to, not yet verified.** Tile-based 2D, memoised rendering, Expo Go-compatible modules, asset budgets. Physical-device testing on entry-level phones has **not yet been done** for the current build either. | `TECHNICAL_ARCHITECTURE.md` §12, §14 |
| **Can the assessment data be collected and validated?** | **Yes.** Existing event contract, offline outbox, backend ingestion and parity tests; additive research-signal event; a staged validation plan with criteria and decision rules. | `TECHNICAL_ARCHITECTURE.md` §8, `VALIDATION_AND_RESEARCH_PLAN.md` |
| **Any contradictions with the RahYaab project?** | Four found and handled or flagged: (1) the Phase 1 pathway framework assumed **questionnaire-based RIASEC**; the game-based RIASEC is unvalidated → decision rule and Q10; (2) Phase 1 said Big Five weight 0 in ranking — kept, which may disappoint the expectation that "more evidence" changes advice; it informs *how* students might like to work, not *which* pathway; (3) English-only content vs reading levels → D-05; (4) level order → D-01. | Sections 1, 3, 4 |

## 6. What the reviewer is asked to approve
1. The game concept, story and world (vision, world, characters, map).
2. The eight level designs.
3. D-01 to D-18 (or alternatives).
4. The assessment designs and the validation plan.
5. The list of technical changes T1–T7 (`TECHNICAL_ARCHITECTURE.md` §15).

After approval, implementation should start with: the scene/activity frameworks → L01 tutorial → one interest level (Makers' Hall) and one puzzle level (Map Room) as vertical slices → device testing → the remaining levels.
