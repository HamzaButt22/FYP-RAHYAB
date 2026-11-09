> **Superseded.** Kept for history only. See `design/` and `docs/project/` for current documents.

# Your Year: game design document (v1, 31 Oct 2026)

The core of Rahyaab. Visual style: `docs/DESIGN_SYSTEM.md`. Screens: `docs/SCREENS.md`. Research behind each decision: `research_notes/Design round 2/game_design.md`. Measurement science: `docs/SRS.md` §12.

---

## 1. Pitch

**Live one school year as yourself, a week at a time.** You're in Grade 10 in a modern Pakistani city. Every Sunday night you plan your week; your choices play out as short scenes with friends, family and two inner voices, **Dil** (what you'd love) and **Duniya** (what's expected). Some scenes quietly hand you something to do: fit a robot part, split a chai bill, find who took the cricket bat. You're never told you're being measured, and there are no right answers. After four weeks Nuqta, your guide, hands you your **Blueprint**: who you are becoming, and the three streams where you'd thrive.

**Genre:** narrative life-sim with light time-management (calendar plus energy), choice-driven scenes and embedded casual tasks. One game, one world. It's not a set of separate puzzles.

**What it borrows (mechanics only, all original content):**
- the school calendar with friends you make time for (Persona-style);
- a weekly budget of limited actions (Citizen Sleeper);
- bars that are bad at both ends (Reigns);
- mechanics as everyday actions, not puzzles (Florence, Unpacking);
- two personified inner voices (Shouldermen);
- watching an AI learn you (AI Learns To Drive);
- your messy input becomes an object shaped like you, which is the Blueprint card (Stick A Round).

---

## 2. Player experience goals

| Goal | How |
|---|---|
| Feels like a game, not a test | No questions, no timers, no scores, no "correct!" feedback; every choice is an action in a story |
| Feels like *my* life | Pakistani city life, Roman Urdu / English dialogue, real school pressures, family that loves you but worries |
| Gen-Z, not childish | Chat-style dialogue, banter, bold UI, characters with opinions; no cartoon-town tone |
| Stress-free | Fails become story, never game over; pause anywhere; 5-minute weeks |
| Honest | The "Rahyaab knows you" meter reflects the real model, and the Blueprint explains itself |

---

## 3. Core loop (one week, about 5 minutes)

```
Sunday night: PLAN   →  3 SCENES (Mon–Sat)        →  STORY BEAT       →  SUNDAY DIARY
pick 3 of 6 slots       each: setup → Dil/Duniya     fixed main-story    recap, meter moves,
energy budget           choice → maybe a task →      moment for all      a callback, a teaser
                        reaction ("meh/okay/loved")  players             for next week
```

- **Plan (30–60 s):** six activity cards, pick three. Friends' plans show as hints ("Sara is doing the thrift stall"). Picking is itself evidence: what you choose to spend time on reveals interest.
- **Scene (about 60 s each):** a short chat-style exchange, one Dil/Duniya choice, and sometimes one embedded task, then a one-tap reaction: meh / okay / loved it.
- **Story beat (about 60 s):** the same for everyone (exam week, Nani's visit, a family debate about streams), so the story stays coherent.
- **Diary (about 30 s):** "This week you…", the meter moves with a reason ("The robotics club told me a lot about you"), and one callback to an earlier choice.

Autosave after every choice. Each week ends at a natural stopping point.

---

## 4. Structure and pacing

| Part | Content | Time |
|---|---|---|
| Prologue | Meet Nuqta, make your player, first day of term, one practice scene, calibration tap warm-up framed as "get comfy with the controls" | 5 min |
| Week 1 | New term, clubs fair (meet the cast) | 5–6 min |
| Week 2 | First test pressure, a family dinner debate | 5–6 min |
| Week 3 | Science fair or competition week | 5–6 min |
| Week 4 | Results day, the stream conversation at home | 5–6 min |
| Blueprint reveal | 7 Wrapped-style slides, then the plain report | 2–3 min |
| After the Blueprint | Optional Try-a-day sims per stream; the year continues with new weeks (stretch goal) | open |

**Total to the first Blueprint:** about 25–30 minutes over 5–7 sittings. The game nudges a break after each week, with no pressure to continue.

---

## 5. World and cast

**Setting:** an unnamed modern Pakistani city (could be Lahore, Karachi, Islamabad or Multan), with a school, home, a café, a clinic, a market and an online group chat. Mixed-gender activities, and every activity is open to everyone.

| Character | Role | Notes |
|---|---|---|
| **You** | Player avatar | Nickname, avatar builder (shapes, colours, hijab and cap options, no photos) |
| **Nuqta** | Guide (the jade dot) | Narrates the diary and the meter; never judges |
| **Dil** | Inner voice: what you'd love | Warm, curious; argues for different interests across scenes |
| **Duniya** | Inner voice: what's expected | Practical, cautious; also rotates which interest it argues for, so it isn't always "be a doctor" |
| Zain | Classmate, builder | Robotics, fixes things |
| Sara | Best friend, entrepreneur | Thrift stall, side hustles |
| Hira | Debater, writer | School magazine, debate |
| Bilal | Gamer, coder | Code jam |
| Dr. Amna | Family friend, doctor | Clinic volunteering |
| Ammi & Abbu | Parents | Loving, anxious about the future; never villains |
| Nani | Grandmother | Comic relief, wisdom, family pressure softened |

Each character has about 4 portrait expressions (neutral, happy, worried, laughing). That's 8 characters × 4 = 32 portraits.

**Avoid:** romance, religion and sect, politics, self-harm, abuse, and stereotypes ("girls can't code").

---

## 6. Activities (the week planner)

There are 12 activities, two per interest type, but the mapping is hidden from players. Each week shows 6, rotated so every type appears in every week.

| Activity | Mostly R / I / A / S / E / C |
|---|---|
| Robotics club | R |
| Bike repair with cousin | R |
| Science fair project | I |
| Code jam | I |
| School magazine cover | A |
| Music / video edit for a friend | A |
| Clinic volunteering | S |
| Tutoring younger kids | S |
| Thrift stall | E |
| Debate team | E |
| Organise the class trip budget | C |
| Library catalogue helper | C |

Some activities lean towards two types (code jam is I + R, for example); the scoring model handles that through the tags in §9.

**Energy:** 3 picks per week (shown as 3 energy). There are no real-time timers or refills.

---

## 7. Scenes and inner voices

Each activity has **2 scene variants**, giving 24 activity scenes, plus **6 story beats**.

**Scene template:**
1. Setup: 2–4 chat lines with a character.
2. **Dil / Duniya choice:** two options, each pointing to a *different* interest type. The 15 possible pairings of the six types (R-I, R-A … E-C) are each shown at least twice across the 4 weeks, so every type comes up 10+ times.
3. Optional **embedded task** (§8).
4. Consequence line plus a callback hook.
5. Reaction tap: meh / okay / loved it.

**Rules:**
- Neither option is ever framed as better. No glowing options, no paid choices, no "this will matter" warnings, no rewind.
- Dil and Duniya swap which type they argue for, so a "Duniya = medicine" pattern never forms. Which voice the player follows is logged separately as an **autonomy vs. conformity** signal, useful for the parent and counsellor conversation; it's never shown as a score.
- Choices are tagged in the script, for example `#riasec:R #pair:R-A #voice:dil`, so writers never touch scoring code.

---

## 8. Embedded tasks (abilities)

Tasks are **in-world actions**, untimed, with no score shown. "Ask a friend to help" is always available and is logged as missing data, not failure.

| Ability | Task (in story) | Interaction | Difficulty levels |
|---|---|---|---|
| Spatial | Fit the robot bracket / pack the car boot for Nani's trip | Rotate and place pieces | 4 levels: more pieces, mirror images |
| Numerical | Split the chai bill / price the thrift stall | Drag coins, set prices to hit a target | 4: more items, discounts, ratios |
| Logic | Who took the cricket bat? (clue grid) | Tap to rule people out | 4: more people, more clues |
| Planning | Order the iftar cooking steps / plan the class trip route | Drag steps into order, fewest moves | 4: more steps, constraints (this reuses Reroute / Power Grid logic) |
| Memory / sequence | Repeat the band's beat for the school show | Tap the pads in order | Span grows (this reuses Echo / Glyph Sequence logic) |
| Verbal | Calm a group-chat fight | Choose the message that fixes the misunderstanding | 4: subtler tone |

- **Adaptive:** the next task's level depends on the previous result; the model picks the most informative level.
- **First attempt is scored.** Replays are allowed for fun but aren't scored.
- About 12–15 tasks over 4 weeks (2–4 per week). Each ability is sampled 2–3 times, and reliability is checked in the pilot.
- No reaction-time scoring. Timings are logged for research only, with device calibration.

---

## 9. Measurement model (what the game records)

| Evidence | Source | Feeds |
|---|---|---|
| Activity picks | Week planner | Interest (revealed preference) |
| Dil/Duniya choice per pair | Scenes | Interest (forced choice, balanced pairs) |
| Reaction tap | After each scene | Interest intensity (absolute anchor) |
| Task results (first attempt, level reached) | Embedded tasks | Abilities |
| Voice followed | Scenes | Autonomy vs. conformity (context only) |
| Optional marks and board | Profile | Eligibility rules |

The model and its experiments are in SRS §12 (M1: adaptive interest estimation; M2: ability estimation with latency calibration; M3: stream recommender). **Scene picking is adaptive:** each week the game prefers scenes for under-sampled types and for pairs it's still unsure about.

---

## 10. "Rahyaab knows you" meter (honest ML progress)

- It's the model's real certainty, 0–100%. It can go **down** ("That surprised me. Tell me more next week.").
- The diary names the activity that moved it ("The robotics club told me a lot"), never the interest letter.
- Visual: a ring on Home. In the diary, an interest shape that starts blurry and sharpens week by week. That's the "watching the AI learn" moment.
- The Blueprint unlocks when certainty passes a threshold *or* after week 4, whichever is later. If certainty is still low, it says so honestly.

---

## 11. Blueprint reveal (results as a story)

Seven full-screen slides, tap to advance, each in a different layout:
1. "You played 4 weeks." (minutes, scenes, choices)
2. Your archetype ("The Builder") with three trait chips
3. "The moments that shaped this": 3 callbacks to remembered scenes
4. Your top 3 streams with words and segment bars, not percentages
5. "In 10 versions of you, 6 fit Pre-Engineering best" (uncertainty as frequency)
6. Plan B and what each stream opens (degrees, entry tests)
7. A shareable card (no name or personal data) plus **Send to family**

Then a plain scrollable report for parents and teachers. The archetype and streams are **a starting point to talk with family and teachers**, never a verdict.

---

## 12. Feedback, juice and audio

- Haptics: a light tick on selection, medium on lock-in, a success pattern on unlocks.
- Motion: spring press on every button (the chunky lip squashes), cards slide in, the meter animates.
- Sound: off by default; soft UI clicks, a short sting on the Blueprint reveal.
- Feedback words are always neutral ("Clicked in!", "Done"), never "correct" or "wrong".

---

## 13. Ethics and retention without dark patterns

- No streaks, ads, loot boxes, paid choices, leaderboards, real-time energy or countdown timers.
- Notifications are opt-in only, at most one a week, timed to decision points (Matric results, admissions).
- "Take a break" is suggested after each week; no penalty for leaving.
- Consent before any gameplay data is saved; the parent sees results, never individual choices.

---

## 14. Content scope (3-person team)

| Item | Amount |
|---|---|
| Weeks | Prologue + 4 (6–8 is a stretch goal) |
| Activities | 12 (2 per interest type) |
| Activity scenes | 24 (2 per activity) |
| Story beats | 6 |
| Dil/Duniya choices | About 32 (covers 15 pairs × 2) |
| Task templates | 6 × 4 difficulty levels |
| Characters | 8 + Nuqta, 4 expressions each |
| Dialogue | About 1,100–1,300 lines (12–18k words), Roman Urdu / English; full English version is a stretch goal |
| Playtests | 2 rounds with 10–15 teens; in-game feedback button attaches the save file |

**Writing order:** prologue and Week 1 first (vertical slice), then Weeks 2–4. Every scene goes through a "cringe check" by 2–3 real teens.

---

## 15. Tools and implementation

- **Script:** **Ink** (inkle), with **inkjs** in React Native. Writers use the free Inky editor, and scripts compile to JSON in CI. Tags carry measurement metadata. External functions launch tasks and update the meter. The story state is saved as JSON on the phone after every choice.
- **CI check:** a script verifies interest-pair coverage and tag validity on every pull request.
- **Tasks:** React Native components (Skia, Reanimated, Gesture Handler), each emitting telemetry events in the `session_log` schema; the Python engine scores them on the server.
- **Art:** vector characters and backgrounds built from rounded shapes (the Nuqta style). Optional CC0 3D icon packs for objects (licences in `research_notes/Design round 2/app_ui_patterns.md`).

---

## 16. Open questions to settle with the supervisor

1. Is a one-tap "loved it" reaction acceptable under the game-only rule? (It's a reaction, not a question.)
2. Roman Urdu as the main dialogue language with an English toggle; parent reports in English or Urdu script?
3. Is 4 weeks enough for a stable Blueprint? The pilot will show whether certainty plateaus.
