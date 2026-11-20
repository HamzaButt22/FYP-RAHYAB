# Valley Explorer — Complete Game Design Package (v1.0)

**Project:** RahYaab career guidance system for Pakistani students (Grades 9–12)
**Component:** Valley Explorer — a 2D mobile adventure (React Native / Expo, Android, portrait)
**Date:** 19 November 2026 · **Status:** design proposal for review. **No source code was written or changed in this phase.**

---

## Purpose of this package
This folder contains the complete design for turning the current Valley Explorer build into a proper 2D adventure game in which students explore **Rahwali Valley**, help prepare the **Lantern Festival**, and — through the work they choose, the puzzles they solve and a short journal they keep — receive a **Path Map** of interests, ways of working and pathways to explore.

It also contains an audit of the existing implementation, the assessment designs for **RIASEC** and **Big Five**, the career-mapping architecture, UI, art and technical designs, a validation plan and a list of decisions needing approval.

## Labels used throughout
| Label | Meaning |
|---|---|
| **[E]** | Published evidence (reference given) |
| **[H]** | Design hypothesis that must be validated |
| **[D]** | Design decision or assumption (changeable at review) |
| **[A]** | Needs approval before implementation |

## Recommended reading order

| # | Document | What it covers | Read if you are… |
|---|---|---|---|
| 1 | `GAME_VISION.md` | Vision, pillars, audience, orientation (portrait), journey at a glance, success targets | Everyone — start here |
| 2 | `GAME_DESIGN_DOCUMENT.md` | **Audit of the existing build** (works / incomplete / poorly designed / redesign / preserve / remove), core loop, structure, rewards, what is measured where | Everyone |
| 3 | `DESIGN_DECISIONS_AND_OPEN_QUESTIONS.md` | Decisions needing approval (D-01–D-18), open questions, tensions, **final design review** | Supervisor / reviewer |
| 4 | `WORLD_AND_STORY_DESIGN.md` | World background, story arc, chapters, dialogue tone, every location | Designers, writers |
| 5 | `CHARACTER_AND_NPC_DESIGN.md` | Player character, Chakor, neutral guides, six makers (assessment-neutral rules) | Designers, artists |
| 6 | `WORLD_MAP_AND_LEVEL_LAYOUTS.md` | Hub map, scene layouts, layout rules | Designers, developers |
| 7 | `GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` | Controls, interaction primitives, feedback, **catalogue of all work activities**, puzzle interactions | Designers, developers |
| 8 | `LEVEL_01_VALLEY_GATE.md` … `LEVEL_08_VAULT_LOCKS.md` | Each level in 18 sections (objective → what can/cannot be concluded) | Everyone working on a level |
| 9 | `RIASEC_ASSESSMENT_DESIGN.md` | Interest measurement, activity-to-type map, scoring logic, interest-vs-ability, threats | Research, developers |
| 10 | `BIG_FIVE_ASSESSMENT_DESIGN.md` | Questionnaire integration (journal), instrument choice, research-only gameplay indicators with evidence and validation | Research, supervisor |
| 11 | `ASSESSMENT_TO_CAREER_MAPPING.md` | How interests, personality, puzzles and eligibility combine into pathway suggestions (ICS, FSc, I.Com, FA, DAE, TVET) | Research, RahYaab team |
| 12 | `UI_UX_DESIGN_SPECIFICATION.md` | Every screen (S01–S23), flows, text and accessibility rules | Designers, developers |
| 13 | `VISUAL_ART_DIRECTION.md` | Art direction, palettes (incl. equal-lightness work colours), typography, characters, HUD, animations | Artists |
| 14 | `TECHNICAL_ARCHITECTURE.md` | Architecture (no code), state, movement, mini-game specs, events, persistence, sync, audio, performance, approvals T1–T7 | Developers |
| 15 | `VALIDATION_AND_RESEARCH_PLAN.md` | Hypotheses, studies A–E, decision rules, consolidated references | Research, supervisor |

Level documents follow the numbering in the brief (01 Gate, 02 Caravan, 03 Makers' Workshop, 04 Riverside Park, 05 Workshop Orders, 06 Map Room, 07 Pattern Gate, 08 Vault). The **recommended play order** alternates interest and puzzle stops (1 → 2 → 5 → 3 → 6 → 7 → 4 → 8); see decision D-01.

## Mockups
`mockups/` contains four original concept mockups (SVG + PNG): the hub world, a Makers' Hall activity, a journal page and the Path Map, plus `00_current_build_baseline.png` showing the current build for comparison. They illustrate direction only; they are not final art.

## Key points for reviewers
- **Assessment through play where the evidence supports it:** RIASEC interests come from choices in three gameplay levels; problem-solving from four environmental puzzle levels.
- **Big Five stays on a published instrument:** the 20 Mini-IPIP statements, word-for-word, 2–3 at a time in the Pathfinder's Journal. Gameplay is **not** used to score personality; a small set of gameplay behaviours is logged for research only.
- **Fairness built in:** no timers, no speed scoring, no gambling, identical rewards for every choice and outcome, progress never blocked by a wrong answer, counter-stereotyped characters, read-aloud.
- **Honest limits:** no score in the game is yet validated for Pakistani Grade 9–12 students; the validation plan says how to test each one and what to do if it fails.

## Relation to earlier work
- Phase 1 research package (`RahYaab_research_docs_v0.1`) — literature review, indicator matrix, pathway framework, validation and ethics protocols. This design reuses its evidence and rules and notes where it changes them.
- Current implementation (`src/valley`, `docs/`, `COMPLETION_REPORT.md`) — audited in `GAME_DESIGN_DOCUMENT.md` Part A.

## Integrity checks performed for this package
- No files outside `design/game/` were created, modified or deleted (verified by checksum comparison of the React Native project and the Python backend before and after writing).
- All item IDs, task IDs, event names, scoring parameters and constants quoted from the code were read from the source files on 19 Nov 2026.
- New literature cited in this package was checked online on 16–19 Nov 2026; older Phase 1 references keep their verification status.
