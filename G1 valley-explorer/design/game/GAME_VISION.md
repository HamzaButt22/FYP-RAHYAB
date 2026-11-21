# Valley Explorer — Game Vision

**Project:** RahYaab career guidance system · **Component:** Valley Explorer (mobile adventure)
**Status:** Design proposal v1.0 (19 Nov 2026) — for review and approval. **No implementation is implied by this document.**
**Labels used in this package:** **[E]** published evidence (reference given) · **[H]** design hypothesis that must be validated · **[D]** design decision or assumption · **[A]** needs approval before it can be implemented.

---

## 1. One-sentence vision

> A student arrives in **Rahwali Valley** as a new *Rahyaab* (pathfinder), helps the valley prepare its first Lantern Festival in years, and — through the work they choose, the puzzles they solve and a short journal they keep — leaves with a personal **Path Map** of interests, ways of working and pathways worth exploring.

The name of the product and the role of the player are the same word: *Rahyaab* means "one who finds the way". The game is about finding a way, not being given one.

## 2. Why the game exists

RahYaab needs evidence about three different things, collected in a way that Grade 9–12 students will finish honestly and without boredom:

| Evidence | How Valley Explorer collects it | Status of the method |
|---|---|---|
| **Interests (RIASEC)** | What students *choose to do* and *keep doing* when several kinds of work are offered side by side in the world | Game-based assessment **[H]** — scoring exists and is exploratory; needs validation against a questionnaire |
| **Personality (Big Five)** | 20 published self-report statements (Mini-IPIP), kept word-for-word, answered 2–3 at a time in the Pathfinder's Journal | Self-report questionnaire **[E]** (Donnellan et al., 2006), embedded but not rewritten |
| **Problem-solving evidence** | Four families of puzzles with a single correct answer (planning with numbers, turning shapes, patterns, logic) | Task performance counts **[D]** — no norms; never reported as intelligence |
| *Exploratory behaviour signals* | A small set of documented gameplay behaviours (e.g., tidying tools, examining curiosity spots) | **Research only [H]**; never shown to students or used in advice |

## 3. Player promise

What a student should be able to say afterwards:

1. "I explored a place, met people, and helped get the festival ready."
2. "I got to try lots of different kinds of work and nobody told me which one was right."
3. "The puzzles were fair — no timer, and I could skip."
4. "The journal was quick and nobody judged my answers."
5. "My Path Map made sense, and it gave me ideas, not orders."

## 4. Design pillars

| # | Pillar | What it means in practice | What it rules out |
|---|---|---|---|
| P1 | **A world, not a worksheet** | Every activity happens *somewhere*, for *someone*, for a reason in the story. Movement, objects and characters carry the experience. | Floating question cards; reading screens with a "Next" button as the main interaction |
| P2 | **Choice is the measurement** | Interest is inferred from free choices between equally rewarded options, made *before* the student sees how hard an activity is. | Rewards that differ by activity type; asking "Which career do you like?" |
| P3 | **Interest ≠ ability ≠ personality** | Interest activities cannot be failed; puzzles have right answers; the journal is self-report. Each stream is scored separately. | Giving interest points for doing an activity *well*; reading puzzle scores as personality |
| P4 | **Fair to every player** | No timers, no speed scores, no luck, progress never blocked by a wrong answer, same rewards for every choice, controls that work for non-gamers. | Leaderboards, streaks, loot boxes, penalties |
| P5 | **Short, varied, finishable** | Two chapters of about 25 minutes each; no interaction pattern is repeated in two consecutive scenes. | One 50-minute sitting; the same mini-game eight times |
| P6 | **Honest about evidence** | The results say what was observed and how sure we are. Behaviour signals that are not validated stay in the research data. | "The game measured your personality"; career verdicts |

## 5. Audience

| Factor | Implication for design |
|---|---|
| Grades 9–12 (≈ 14–18 years), Pakistan | Teen-appropriate tone (not childish); story about responsibility and community; culturally familiar setting (valley, bazaar, festival) |
| Mixed gaming experience | On-screen D-pad **and** tap-to-walk; one Action button; a 2-minute tutorial; no reflex challenges |
| Mixed English reading levels | Very short lines (≤ 15 words per bubble), icons for every action, **read-aloud of all text** **[A]**. National surveys show many students read English below grade level (ASER 2025 reported that 55% of private and 53% of government Class 5 students could read at least English sentences) — Grade 9–12 students are older, but the risk is real. |
| Boys and girls, many schools segregated | Avatars for all students (incl. hijab, cap, braid, short hair); NPCs assigned against occupational stereotypes (e.g., a woman mechanic, a man teacher) **[D]** |
| Shared or low-end Android phones | Runs on entry-level devices; works offline; resumes after the app is killed; no account needed inside the game |

## 6. Platform and orientation

**Recommendation: portrait, locked [D].** — *Superseded on 20 Nov 2026: after testing on a phone, the project owner found portrait cramped. The game now opens in landscape with a Rotate button (decision D-02).*

| Option | For | Against |
|---|---|---|
| **Portrait (recommended)** | One-handed use is common — in Hoober's observation study, 49% of interactions used a one-handed grip and about 75% of interactions were made with a thumb [E]; keeps the D-pad and Action button in the thumb zone; text lines fit without wrapping awkwardly; matches the RahYaab host app, so no rotation when the game opens; already implemented | Less horizontal view of the world (mitigated by a camera that looks ahead in the walking direction) |
| Landscape | Wider world view; conventional for console-style games | Requires two hands; rotates away from the host app; long English text becomes harder to read; school-lab use often has phones lying flat |

## 7. Experience at a glance

```
Opening ─► Make your traveller ─► Story intro (3 panels)
   │
   ▼  CHAPTER 1 — "The Road to Rahwali"  (~25 min)
   1 Valley Gate        tutorial · meet Mehr & Chakor · open the gate      [context]
   2 Crossroads Caravan travel the valley road, choose the work at each fork [interest]
   3 Workshop Orders    plan the festival orders in the town workshop     [planning puzzles]
   4 Makers' Hall       open day — spend your time at the benches you like  [interest]
   ── Night camp: chapter break, progress saved ──
   ▼  CHAPTER 2 — "Lanterns for the Festival"  (~25 min)
   5 Map Room           rebuild Mehr's torn route map                       [spatial puzzles]
   6 Pattern Gate       reopen the old aqueduct sluice                      [pattern puzzles]
   7 Riverside Park     festival day — pick a role, help where you choose   [interest]
   8 Lantern Vault      open the vault's locks, carry the lanterns out      [logic puzzles]
   ▼
Festival night ─► Your Path Map (results) ─► Pathways to explore (RahYaab)
After every stop: one Pathfinder's Journal page (2–3 statements, ~40 s)
```

The brief lists the levels as 1 Gate, 2 Caravan, 3 Makers' Workshop, 4 Riverside Park, 5 Workshop Orders, 6 Map Room, 7 Pattern Gate, 8 Vault. Document numbering follows that list. **Play order alternates interest and puzzle stops** (as implemented and approved on 15 Nov 2026), so a student never does three similar stops in a row. Keeping this order is decision D-01 in `DESIGN_DECISIONS_AND_OPEN_QUESTIONS.md` **[A]**.

## 8. What success looks like (targets for the pilot)

| Measure | Target | How measured |
|---|---|---|
| Completion of Chapter 1 within one class period | ≥ 85% of students | Session logs |
| Students who say the game felt like a game, not a test | ≥ 70% "agree" | Post-game 3-item check + interviews |
| Journal items answered (not skipped) | ≥ 90% | `BIG5_RESPONSE` events |
| Students reporting confusion about controls after tutorial | ≤ 10% | Observation + 1 question |
| RIASEC: students with enough choices to score (≥ 3 per interest level) | ≥ 95% | Scoring output |
| Device problems (crash, freeze) per session | < 1% | Crash logs |

These targets are **[D]** pilot criteria, not evidence that the assessment is valid; validity is a separate study (`VALIDATION_AND_RESEARCH_PLAN.md`).

## 9. What Valley Explorer is not

- Not a career test that decides a student's future.
- Not an IQ test; puzzle results are counts of puzzles solved today.
- Not a personality test built from gameplay; the personality result comes from the student's own journal answers.
- Not a competitive game: no ranking against classmates.

## References

- ASER Pakistan 2025 results as reported by UKFIET (2026), *Beyond enrolment: Pakistan's real education crisis is learning*.
- Donnellan, M. B., Oswald, F. L., Baird, B. M., & Lucas, R. E. (2006). The Mini-IPIP scales. *Psychological Assessment, 18*(2), 192–203.
- Hoober, S. (2013). How do users really hold mobile devices? *UXmatters*.
