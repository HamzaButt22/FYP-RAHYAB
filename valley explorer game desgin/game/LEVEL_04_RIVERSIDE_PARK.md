# Level 04 — Riverside Park Day

| Field | Value |
|---|---|
| Level ID (code) | `park_mission` (existing) |
| Play order | 7 of 8 · Chapter 2 |
| Kind | **Interest (RIASEC)** — declared role + free choice of work site across 9 shifts |
| Location | Riverside Park (`WORLD_AND_STORY_DESIGN.md` §5.8; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §9) |
| Target duration | 7 min |
| Characters | Mayor Saima, the six makers at their sites, Noor (research event), visitors |
| Preserved | Role choice at the start and at each phase break (`ROLE_SELECTED`, `ROLE_CHANGED`), **3 phases × 3 shifts**, any site may be chosen regardless of role, park task IDs and RIASEC weights, role vote weight 0.5 (`riasec_config.json`) |
| Changed | Phases presented as Morning / Afternoon / Evening (display names for the existing Plan / Build / Finish); each site has a different 30–45 s task per phase (3 required + 1 optional); the park fills with visitors and decorations; random site positions; a costly-helping research event |

---

## 1. Level name
**Riverside Park Day** — "Help reopen the park — your way."

## 2. Level objective
- **Player objective:** get Riverside Park ready for the Lantern Festival and keep it running through the day.
- **Assessment objective:** two kinds of interest evidence in one level:
  1. **Declared preference:** the role the student picks (and whether they keep or switch it);
  2. **Behavioural preference:** where they actually go to work in each shift — which may differ from the declared role. Comparing the two is informative for counselling ("you called yourself a Designer but spent most shifts helping visitors").

## 3. Story introduction
The aqueduct water now reaches the park (story link to L07). At the park gate, Mayor Saima with a megaphone: "Rahyaab! The festival starts tonight and the park isn't ready." → "Choose a role for the day. Every role keeps the festival going." → "You can still help at any site — go wherever you're needed." She pins a **festival ribbon** on the player (cosmetic; also used by the research event).

## 4. Environment design
A riverside park with willows, a central fountain (now flowing), paths in a ring, a stage, and six sites:
- **Repair yard** (R, Rabia): benches, lantern stands, tools;
- **Survey hut** (I, Dr Zoya): by the pond, with test kits and a tally board;
- **Design tent** (A, Danish): paints, banners, stage backdrop;
- **Welcome tent** (S, Usman): shade, chairs, water, first-aid box;
- **Sponsors' stall** (E, Sana): table, megaphone, sponsor list;
- **Records desk** (C, Ammar): permit files, lost-and-found book, equipment log.
Each phase visibly changes the park: **Morning** — empty, piles of material; **Afternoon** — visitors arrive, bunting up, music; **Evening** — lanterns lit, golden light.

## 5. Map layout
21 × 13 tiles. Six sites around the fountain; **site-to-slot assignment randomised per student and logged**; path distance from the fountain to each site equal (± 1 tile). Mayor near the gate. Noor appears on the ring path in the afternoon phase, never at a site.

## 6. Character movement
Free walking. Request bubbles (work icon) float above each site so the student can see all options at once. Tap-to-walk works.

## 7. Interactive objects

| Object | Action | Response |
|---|---|---|
| Mayor Saima | Talk | Role sheet (start and phase breaks); otherwise "Go wherever you like." |
| Site ×6 | Work here | Opens the site's task for the current phase |
| Request bubble | — | Shows the site's work icon; same size/animation for all sites |
| Noor (afternoon) | Talk | Research event A-1 (below) |
| Fountain, stage, stalls | Look | Flavour lines |

## 8. NPC interactions
- **Mayor Saima:** role choice. The role sheet lists six roles with icon + one-line description (existing `PARK_ROLES`: Builder, Researcher, Designer, Helper, Leader, Record keeper), in **randomised order per student** (logged) **[D]**. At phase breaks: "Keep your role or switch?" with the current role preselected and "Keep" and "Switch" equally prominent.
- **Makers at sites:** goal line + shared thank-you.
- **Noor (research event A-1):** in the afternoon, Noor stands on the path crying softly: "I lost my festival ribbon…" Options appear: **Give her your ribbon** (your ribbon moves to her hair; your avatar loses it for the rest of the game) or **"I hope you find it"** (she nods). Both continue identically; no reward, no comment from anyone, no mention later. If the student does not talk to her, she is found by her mother at the end of the phase. Research only (`BIG_FIVE_ASSESSMENT_DESIGN.md` §4).

## 9. Main mission
**Get the park ready and keep it running:** choose a role, then work 9 shifts (3 per phase).

## 10. Optional missions
- Optional ★ step in each site task.
- Talk to Noor (research event — not presented as a mission).
- Look at the fountain, stage, stalls.

## 11. Exact gameplay mechanics
1. Arrival → Mayor's briefing → **role sheet** → pick a role (`ROLE_SELECTED`).
2. **Morning phase** (3 shifts): walk to any site → **Work here** → site task (30–45 s, 3 required + 1 optional) → Finish → shift counter advances (existing `FINISH_JOB`).
3. **Phase break:** Mayor: "Morning done — the park looks better already!" → keep/switch role (`ROLE_CHANGED` if switched) → park visibly changes.
4. **Afternoon phase** (3 shifts; Noor appears).
5. Phase break → **Evening phase** (3 shifts).
6. Lanterns light up across the park → map piece 7 → journal page.

Site tasks per phase are listed in `GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5.3 (18 tasks: e.g., R morning "fix a wobbly bench", I afternoon "count visitors at two gates and compare", C evening "count and log returned equipment").

## 12. Player decisions

| Decision | Evidence |
|---|---|
| Role at start | Declared preference (role vote, weight 0.5 in RIASEC preference — existing) |
| Keep or switch role at each phase break | Stability of declared preference |
| Site chosen for each of 9 shifts | Behavioural preference |
| Optional step in each task | Engagement |
| Leave a task | Engagement (persist) |
| Give the ribbon to Noor | Research only (A-1) |

## 13. Challenge and difficulty progression
No ability challenge. Variety comes from the phase-specific tasks (each site offers three different tasks over the day) and the changing park.

## 14. Rewards
3 coins per finished shift (any site), 20 coins for the level, map piece 7, stamp 7, the festival ribbon (cosmetic; can be given away).

## 15. Completion conditions
All 9 shifts finished or left (existing behaviour, verified in `parkMission`: leaving a task still uses up that shift, so the day always ends after 9 shifts), then the evening wrap-up.

## 16. Failure and retry behaviour
No failure. Leaving a task returns to the park. App kill → resume at the same phase/shift (existing).

## 17. Assessment signals collected

| Event | Data | Use |
|---|---|---|
| `ROLE_SELECTED`, `ROLE_CHANGED` (existing) | role, previous role | RIASEC preference (role vote) |
| `ACTIVITY_START / STEP / END` (existing) | task_id, phase/shift, steps, outcome | RIASEC preference + engagement |
| additive fields **[A]** | `site_slot`, `role_order` (sheet order shown), `phase_task_variant` | Position/order-bias checks |
| `RESEARCH_SIGNAL {signal_id: "ribbon_given", given: true/false/not_met}` **[A]** | Noor event | Research only: Agreeableness indicator A-1 |
| `BIG5_RESPONSE` | Journal: mi17, mi04, mi18 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** which role the student says suits them, whether that stays stable, and where they actually choose to work — and whether declared and behavioural preferences agree (useful talking point for a counsellor).
- **Cannot:** that the student would enjoy the real occupation; ability at the work; or anything about kindness from the ribbon choice for an individual student. The ribbon choice could reflect agreeableness, but also not caring about cosmetics, wanting to look good, Social interest, or cultural norms about giving. It is one observation and stays research-only.

## Journal page after this stop
**mi17** "I am not interested in other people's problems." · **mi04** "I have frequent mood swings." · **mi18** "I make a mess of things."

> Placement note: mi17 is an Agreeableness item asked right after a level with helping activities. Context effects are possible (helping just happened). The item order across the journey is kept fixed so everyone has the same context; the effect is checked in the validation study by comparing with a standalone Mini-IPIP administration (`VALIDATION_AND_RESEARCH_PLAN.md` H-B2).

## Changes from the current build
| Current | Proposed | Why |
|---|---|---|
| Site tasks = 1 required step | 3 required + 1 optional, different per phase | Meaningful work, engagement evidence, variety |
| Static park | Park changes per phase | Visible progress, adventure feel |
| Role list in fixed order | Randomised order (logged) | Remove order bias |
| — | Noor ribbon event | Independent A research signal (outside RIASEC options) |
