# Assessment-to-Career Mapping Architecture

**Version:** 1.0 design proposal · 19 Nov 2026
**Purpose:** explain how the evidence collected in Valley Explorer is combined with information from the RahYaab app to suggest **educational pathways to explore** for Pakistani students — without deterministic decisions.
**Builds on:** Phase 1 `pakistan_education_pathways.md` (pathway profiles, eligibility rules checked Nov 2026, explainable matching algorithm v0.1). Eligibility facts in this document are summarised from there and **must be re-verified before each admission season**.

---

## 1. Five things kept separate

| Layer | Question it answers | Source | Collected by the game? | Role in guidance |
|---|---|---|---|---|
| **Interests** (RIASEC) | What kinds of work does the student enjoy choosing? | L02, L03, L04 | Yes | **Primary driver** of which pathways are suggested |
| **Personality** (Big Five questionnaire) | How does the student usually think, feel and act? | Journal (Mini-IPIP) | Yes | **Context only** — "ways of working" notes; **never ranks or filters** |
| **Demonstrated task performance** | Which kinds of puzzles did the student solve today? | L05–L08 | Yes | **Supporting notes** only ("skills to keep practising"); **never a filter**; weight 0 in ranking in v1 **[A]** |
| **Academic eligibility** | Which pathways can the student actually enter? | Current grade, Matric/SSC group, marks, board rules | **No** — host app (student-entered marks + verified rule database) | **Hard filter** with "near miss" and "bridging route" information |
| **Recommendations** | Which pathways are worth exploring, and why? | RahYaab pathway engine | No — computed by the host from the layers above + student goals | Ranked suggestions with explanations |

**Exploratory gameplay behaviour signals are not used at all** in guidance (research only).

## 2. Data flow

```
 Valley Explorer (game)                         RahYaab host app
 ┌──────────────────────────┐                   ┌─────────────────────────────────────┐
 │ RIASEC result            │                   │ Student profile: grade, group, marks│
 │ Big Five questionnaire   │── AssessmentOutput ──►│ Goals & constraints form          │
 │ Ability counts           │   (eligible_outputs)  │ Pathway rule DB (source, checked_on)│
 │ (research data → backend)│                   │                                     │
 └──────────────────────────┘                   │ Pathway engine v0.1 (rule-based)    │
            ▲                                    │  1 eligibility filter               │
            │  PathwaySuggestions (optional)     │  2 interest fit                     │
            └────────────────────────────────────│  3 academic fit                     │
              shown on the game's Path Map       │  4 goal fit → rank + explanations   │
              "Pathways to explore" page **[A]** └─────────────────────────────────────┘
```

Today the game's results show *fields* only (`FIELD_EXAMPLES` in `core/summary.ts`). Showing **Pakistani pathways** inside the game requires the host to pass pathway suggestions back through the adapter (new optional adapter method) **[A]** — or the Path Map ends with a button "See pathways in RahYaab" that returns to the host screen. Both options are in `DESIGN_DECISIONS_AND_OPEN_QUESTIONS.md` D-12.

## 3. Matching algorithm (from Phase 1, v0.1 — summarised)

1. **Eligibility filter** using the student's current group/marks and the dated rule database: *eligible now* / *eligible if final marks reach X* / *not eligible via this group → show bridging routes* (e.g., Additional Mathematics, DAE, Associate Degree).
2. **Interest fit** *I*: similarity between the student's top-3 RIASEC code and the pathway's provisional RIASEC profile (top letter 3 points, second 2, third 1; normalised 0–1).
3. **Academic fit** *A*: performance in pathway-relevant school subjects + liked/disliked subjects (host data — **not** the game's puzzles).
4. **Goal fit** *G*: share of the student's stated goals the pathway supports (expert-coded).
5. **Score** = 0.45 *I* + 0.35 *A* + 0.20 *G* (**provisional weights — design assumptions**, to be calibrated with counsellors in Study B).
6. Present 1 primary + 2–3 alternatives + 1 "explore something different" option (a different RIASEC emphasis).

**Big Five weight = 0. Ability weight = 0 (v1). Behaviour signals = not used.**

## 4. Pathway profiles (Decision 1: after Matric / Grade 10)

RIASEC emphases are **provisional placeholders** from the Phase 1 document (derived from typical O*NET occupation codes) pending counsellor review.

| Pathway | Typical entry (summary — verify per board/college) | Provisional RIASEC emphasis of typical destinations | Example destinations |
|---|---|---|---|
| **FSc Pre-Medical** | Matric Science (Biology) | I, S (medicine, nursing), I-C (pharmacy), R-I (lab, agriculture) | MBBS/BDS (MDCAT required; reported PMDC minimum 65% in FSc Pre-Medical for MDCAT eligibility), Pharm-D, DPT, nursing, BS biosciences, psychology |
| **FSc Pre-Engineering** | Matric Science (Mathematics) | R-I, I-C, A-I-R (architecture) | BE/BSc Engineering (PEC: minimum 60% HSSC reported), BS CS/SE, physics/maths, architecture |
| **ICS** | Matric Science/Computer (board-specific) | I-C-R, A-I (UI/UX), E-I | BS CS/SE/IT/Data Science; engineering via PEC rules for ICS with Physics (Chemistry remedial) |
| **I.Com** | Any Matric group | C-E, E-C, C-I | B.Com/BBA/BS Accounting & Finance, economics; professional bodies (ICAP, ICMA, ACCA — verify entry rules) |
| **FA (Arts/Humanities)** | Any Matric group | S-A, A-E-S, E-I-S, A | Education, psychology, law (LAT), mass communication, fine arts/design, social sciences |
| **DAE (3 years)** | Traditionally Matric Science (often ≥ 45%; some institutes higher; Punjab reported opening some technologies to Matric Arts — verify) | R-C-I, R-E | Associate engineer/technician; B.Tech/BS Engineering Technology; some BE seats via PEC policy |
| **Other TVET** (NVQF levels 1–5, DIT, short courses) | Varies | R, C, A, S depending on trade | Trade certification, employment, progression to diplomas |

For Grade 11–12 students (Decision 2) the same layers apply to university programmes and HEC-compliant semester-based Associate Degrees (Phase 1 §2.7).

## 5. How each kind of evidence may — and may not — be used

### 5.1 Interests (RIASEC)
- **May:** rank pathways by interest fit; explain "You often chose testing and investigating activities."
- **May not:** exclude a pathway because an interest is low; produce a single "your career is…" statement.

### 5.2 Personality (Big Five questionnaire)
- **May:** add "how you might like to work" notes and study tips, e.g.:
  - higher Conscientiousness → "Study paths with clear steps and structure could suit you";
  - lower Extraversion → "Paths where you can focus, alone or in a small team, may suit you" (and every pathway has such roles);
  - lower "Staying calm" → no pathway note at all; only a supportive line on the results screen ("talking to someone you trust helps").
- **May note fit** where an interest and a trait point in a similar direction (known overlaps: Artistic/Investigative–Openness, Social–Agreeableness, Enterprising–Extraversion; Larson et al., 2002) — worded as "fits with", never as extra evidence for a pathway.
- **May not:**
  - rank, filter or weight pathways (weight 0);
  - say a trait is needed for a pathway ("introverts should not do medicine" — forbidden);
  - use Neuroticism/"Staying calm" for anything except the student's own self-description.

**Examples of inferences the system must never make:**

| Wrong inference | Why it is wrong |
|---|---|
| "High Openness → FA Fine Arts" | Openness is related to Artistic interest but does not define it; eligibility, interests and goals decide |
| "Low Agreeableness → not suitable for nursing" | Personality is not an eligibility criterion; short scales are imprecise; people adapt |
| "High Conscientiousness → Pre-Medical" | Conscientiousness helps in any demanding study path |

### 5.3 Demonstrated task performance (puzzles)
- **May:** say what was observed ("You solved 5 of 6 planning puzzles"); suggest skills to practise; flag in counsellor view as a talking point.
- **May not:** filter pathways, be called "aptitude", "IQ" or "ability level", or be compared with other students (no norms).
- **Why weight 0 in v1:** six items per family, no norms, no evidence that these items predict success in any pathway. Revisit after validation (Study D) **[A]**.

### 5.4 Academic eligibility
- Always from the host's verified rule database with `source_url`, `checked_on`, `next_review_by`.
- Shown with "Check with the college/institution — rules change" on every pathway card.
- Bridging routes always shown when a student is not eligible via their current group.

## 6. Student-facing output (Path Map → Pathways to explore)

| Section | Content | Source |
|---|---|---|
| **What you enjoyed** | Top interests in plain words, one concrete example per interest | RIASEC |
| **How you usually are** | One kind sentence per reported trait | Mini-IPIP |
| **Puzzles you solved** | Counts per family, "without hints" count, no bands | Ability |
| **Ideas to explore** | Example fields per top interest; "fits with" notes | RIASEC (+ Big Five notes) |
| **Pathways to explore** (if connected to host) | Primary + alternatives + "something different", each with: why (interests, subjects, goals), eligibility status with date, next steps | RahYaab engine |
| **Reminders** | Not a test; things change; talk with family/teacher/counsellor | Fixed |

**Example explanation card (format from Phase 1 §4.4, adapted):**
> **ICS → BS Software Engineering** *(one idea to explore)*
> • **Your interests:** you often chose *testing* and *sorting/recording* work — this path involves analysing problems and working with systems.
> • **Your subjects:** you said you enjoy Mathematics; your marks meet typical requirements.
> • **How you like to work:** your journal says you like order — structured study plans may help.
> • **Eligibility:** Matric Science is accepted by most colleges for ICS. *Checked Nov 2026 — confirm with your college.*
> • **Also consider:** FSc Pre-Engineering (keeps engineering and computing open); DAE Computer Information Technology (hands-on, earlier entry to work).
> • **Something different:** FA with Computer Studies and Fine Arts → design and UI careers.
> *This is guidance, not a decision.*

## 7. Protective rules (from Phase 1, kept)
1. Never hide or down-rank a pathway because of gender.
2. Never use Big Five to rank or filter.
3. Always show at least one alternative from a different RIASEC area.
4. Eligibility always with date and source; "check with the institution" always shown.
5. If a stated goal (e.g., "doctor") conflicts with interests, show the goal pathway **and** interest-congruent pathways respectfully, with information about what the goal path involves.
6. Present FA, DAE and TVET neutrally (prestige bias is common in Pakistan).
7. Flat or low-evidence profiles → suggestions labelled "exploratory", with activities to try.

## 8. Limitations of the evidence (to state in the report and viva)
- RIASEC game scores, puzzle counts and the in-game Mini-IPIP have **not been validated** with Pakistani Grade 9–12 students.
- One session; interests and personality change during adolescence (Low et al., 2005).
- Pathway RIASEC profiles are provisional until counsellor review.
- The matching weights are design assumptions.
- English-only content may disadvantage weaker readers despite read-aloud.

## References
- Larson, L. M., Rottinghaus, P. J., & Borgen, F. H. (2002). Meta-analyses of Big Six interests and Big Five personality factors. *Journal of Vocational Behavior, 61*(2), 217–239.
- Low, K. S. D., Yoon, M., Roberts, B. W., & Rounds, J. (2005). *Psychological Bulletin, 131*(5), 713–737.
- Phase 1: `pakistan_education_pathways.md` (sources for PMDC, PEC, HEC, NAVTTC, board rules; checked Nov 2026).
