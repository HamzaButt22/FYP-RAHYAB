# Gameplay and Interaction Specification

**Version:** 1.0 design proposal · 19 Nov 2026
Defines the controls, the interaction "vocabulary", feedback rules and the full catalogue of work activities used by the interest levels. Level documents refer to sections here (e.g., "W-R2").

---

## 1. Controls

| Control | Behaviour | Notes |
|---|---|---|
| **D-pad** (bottom-left; mirrored in left-handed mode) | Tap = 1 step; hold = keep walking (repeat ≈ 175 ms, existing). Bumping into a wall turns the character to face it. | Existing (56 dp arrows); propose 64 dp after device testing. |
| **Tap-to-walk** (new) **[A]** | Tap any reachable tile in the world → the character walks there by the shortest path (the engine already computes reachability). A small footprint marker shows the destination. | Helps students who are not used to D-pads. In forced-choice scenes the road ends require walking *onto* them, so tap-to-walk is still a deliberate choice. Usage is logged as a covariate (γ). |
| **Action button** (bottom-right, orange circle ≈ 116 dp, dark text — existing) | Label changes to the faced object's verb: *Talk, Pick up, Place, Read, Enter, Work here, Look, Sit*. Disabled and labelled "Action" when nothing is in reach. | Existing; keep. |
| **Back / Pause** (top-left) | Opens the pause sheet: Continue · Map · Settings · Back to the valley (progress saved). | |
| **Hint feather** (inside puzzles and mini-games) | Chakor gives one hint. | Hints are logged (existing `HINT_USED`). |
| **Settings** | Text size (100/125/150%), read-aloud on/off, sound/music, haptics, reduced motion, left-handed layout, high-contrast outlines. | `UI_UX_DESIGN_SPECIFICATION.md` §S18 |

## 2. Interaction primitives

Every activity in the game is built from these primitives. Each has a tap-only fallback so no interaction needs precise dragging. **[D]**

| ID | Primitive | Input | Fallback | Feedback |
|---|---|---|---|---|
| P-WALK | Walk / choose by walking | D-pad or tap-to-walk | — | Footsteps, dust |
| P-TALK | Talk | Action button | — | Speech bubble + portrait + read-aloud |
| P-PICK | Pick up (carry 1 item) | Action button on object | — | Item floats above head; shown in HUD carry slot |
| P-PLACE | Place carried item | Action on glowing slot | — | Snap + click; slot stops glowing |
| P-DRAG | Drag item to target | Finger drag | Tap item, then tap target (existing) | Item follows finger; target glows when hovered; snap |
| P-TAP | Tap N times | Taps | — | Pips fill (existing) |
| P-HOLD | Press and hold (≈ 0.9 s) | Long press | Two taps if "reduced motor demand" setting is on **[A]** | Ring fills around finger (existing) |
| P-SWIPE | Turn a dial | Vertical swipe | Up/down arrows (existing) | Click per number |
| P-PAINT | Choose colour, tap area | Tap swatch, tap area | — | Fill animation |
| P-SORT | Put items into bins | Drag | Tap item, tap bin | Item slides into bin; bin count updates |
| P-CONNECT | Join two points | Tap A then tap B | — | Line/rope draws between them |
| P-ORDER | Arrange cards in order | Drag into slots | Tap card, tap slot | Slot numbers |
| P-TOGGLE | Switch a setting on an object | Tap | — | Visible state change (lamp on/off, tap open/closed) |

**Fairness rule:** in interest activities, each work type uses a *different mix* of primitives (so they feel different), but the **number of required interactions is equal** (±1) across types at each level, and pilot timing must show expected durations within ±15% of each other. Durations that drift are corrected by adding/removing a step. **[D]**

## 3. Feedback channels

| Event | Visual | Sound | Haptic |
|---|---|---|---|
| Step | Footstep dust | Soft step (by surface) | — |
| Blocked | Character turns, small bump | Muted thud | Light tick |
| Item picked / placed | Sparkle, snap | Pop / click | Light |
| Required step done | Green tick + "Nice!" | Chime | Light |
| Optional step done | Gold star burst + "Extra!" | Brighter chime | Light |
| Activity finished | Maker thanks; item appears on display wall | Short jingle (same for all types) | Medium |
| Puzzle correct | Environmental payoff (water flows, door opens, route draws) | Success sting | Medium |
| Puzzle not correct | Neutral "Not this one" panel with the rule; the story resolves it | Soft neutral tone (not a buzzer) | None |
| Stop complete | Stamp thumps into journal; map piece flies to map | Fanfare (4 s) | Medium |
| Journal answer | Ink dot fills | Pencil scratch | None |

Rules: **the same reward sounds and animations for every work type**; no negative sounds for wrong answers; reduced-motion setting replaces bursts with fades.

## 4. Mini-game architecture (concept, no code)

Each activity is **data**, not a separate screen implementation: a spec lists the backdrop, the targets, an ordered list of required steps and a list of optional steps, each step naming a primitive (P-…) and its parameters. One generic **Activity Stage** renders any spec (this generalises the existing `MiniGameStage` + `kinds.ts`). Benefits: balancing is a data change; every activity automatically produces the same events (`ACTIVITY_START`, `ACTIVITY_STEP`, `ACTIVITY_END`); new activities can be reviewed by experts as tables. See `TECHNICAL_ARCHITECTURE.md` §6.

Common activity layout (portrait):

```
 ┌──────────────────────────────┐
 │ HUD: work icon · title · ⏻   │
 │ Maker portrait + 1 line goal │
 ├──────────────────────────────┤
 │                              │
 │        WORK SCENE            │   targets glow when they are the current step
 │                              │
 ├──────────────────────────────┤
 │ STEP 2 OF 4  ● ● ○ ○         │   step pips; extras shown as ★ chips
 │ [items tray / colour swatches]│
 ├──────────────────────────────┤
 │ [Leave]           [Finish ✓] │   Finish enabled when required steps done
 └──────────────────────────────┘
```

## 5. Work activity catalogue (interest levels)

Each RIASEC type has its own *signature mechanic* so that choosing it means experiencing that kind of work:

| Type | Signature mechanic | Feels like |
|---|---|---|
| R | **Assemble & fix**: P-DRAG parts into snap slots, P-HOLD to tighten/test | Making a physical thing work |
| I | **Observe & test**: P-TOGGLE a variable, observe a result, record in notebook | Finding out why |
| A | **Compose & decorate**: P-PAINT and free placement of stamps; any result is accepted | Making something look/feel a certain way |
| S | **Listen & care**: P-HOLD to listen, then give what the person asked for (icon-matched) | Helping a person directly |
| E | **Persuade & organise people**: pick pitch cards (any accepted), P-CONNECT people to roles, handshake | Getting people on board |
| C | **Sort & record**: P-SORT items by clear labels, tick a ledger | Putting things in order |

**No failure in interest activities.** Mistakes (e.g., a part dropped on the wrong slot, a form in the wrong drawer) bounce back with a hint; they are logged as performance (weight 0 in RIASEC) and never stop the activity. **[D]**

### 5.1 Caravan work moments (L02) — 30–40 s, 4 required + 1 optional each
Two variants per type alternate across the five times a type is offered (variant A on odd offers, B on even), so no student does the same moment twice in a row.

| ID | Type | Story | Required (4) | Optional (1) |
|---|---|---|---|---|
| W-R1 | R | A cart wheel has lost spokes | Drag 3 spokes into the hub slots; hold to hammer the rim | Drag oil onto the axle |
| W-R2 | R | A field gate has fallen off its hinge | Drag hinge pin; drag 2 planks into place; hold to test the swing | Tap ×2 to tighten the latch |
| W-I1 | I | Is the stream water clean enough for the animals? | Drag the test strip into 3 cups (result colour appears); tap notebook to record | Test a fourth cup from a pipe |
| W-I2 | I | Why are the bees only on one tree? | Tap magnifier on 3 blossoms (observations appear); tap notebook | Check the hive entrance |
| W-A1 | A | The caravan banner is faded | Paint 3 panels (any colours); tap "hang" | Add a border pattern |
| W-A2 | A | A fruit stall needs a sign | Drag 3 stamp shapes onto the board; paint background | Choose a lettering style |
| W-S1 | S | A traveller looks exhausted | Hold to listen; give water (drag); give shawl (drag); tap to help them sit | Share your route map |
| W-S2 | S | A child can't tie their kite | Hold to listen; show the knot (hold); hand string (drag); tap to cheer | Help a second child |
| W-E1 | E | The caravan needs a porter for the hill | Tap to greet; choose 1 of 3 pitch cards (any works); drag offer; hold to shake hands | Invite a second porter |
| W-E2 | E | The ferryman must agree to take the caravan | Tap to greet; choose a pitch card; connect ferryman to the caravan on the map; hold handshake | Persuade the ferryman's son to help too |
| W-C1 | C | Cargo is mixed up | Sort 4 crates into bays by symbol (P-SORT) | Write the tally (tap ledger) |
| W-C2 | C | Delivery ledger doesn't match | Tick 4 ledger lines against sacks (tap) | Correct one smudged entry |

### 5.2 Makers' Hall activities (L03) — 60–90 s, 6 required + 2 optional each, plus a bonus round
| ID | Bench | Required (6) | Optional (2) | Bonus round (1 time-candle) |
|---|---|---|---|---|
| H-R | **Water pump** (Rabia) | Drag 4 pipe sections into place; tap ×2 to bolt; hold to pump — water flows | Grease the handle; add a drip tray | Fix a second, older pump |
| H-I | **Garden lab** (Dr Zoya) | Toggle light on plant A, shade on plant B; water both (tap); tap "next day" ×3 to watch growth; record which grew taller (visible, any record accepted) | Test soil with the kit; photograph leaves | Run the test again with water changed instead of light |
| H-A | **Poster studio** (Danish) | Choose a background; place 3 stamps anywhere; choose a title style; colour the title; tap "print" | Add a border; sign your work | Design a second poster in a different style |
| H-S | **Study buddy** (Usman) | Hold to listen to a younger student; drag 3 subject tiles into their timetable as they ask (icons shown in speech); tap to encourage; hold to listen to the "thank you" | Make a revision card; walk them to the library desk | Help a second student with a different worry |
| H-E | **Open-day stall** (Sana) | Greet a sponsor; choose 2 of 4 pitch cards (any accepted); connect 2 volunteers to stall jobs; hold to shake hands; tap "open stall" | Invite the mayor; put up a volunteer sign-up sheet | Win a second sponsor |
| H-C | **Records office** (Ammar) | Sort 6 visitor forms into drawers by month (labels shown); stamp "done" | Label the drawers; make a contents list | Sort a second box of forms |

**Bonus offer** (existing): after finishing, the maker asks "One more round? It costs 1 candle." Yes/No equally prominent; no reward difference.

**Tidy-up opportunity (research only):** after an activity, the tools used remain on the bench. An outline on the rack shows where they belong. The student may tap tools back to the rack (P-SORT, 3 taps). No prompt, no reward, no mention. See `BIG_FIVE_ASSESSMENT_DESIGN.md` indicator C-1.

### 5.3 Riverside Park tasks (L04) — 30–45 s, 3 required + 1 optional each
Each site has a different task in each phase (morning set-up, afternoon festival, evening wrap-up):

| Site | Morning | Afternoon | Evening |
|---|---|---|---|
| R Repair yard | Fix a wobbly bench (drag legs, hold) | Repair a lantern stand | Take down the stage frame |
| I Survey hut | Test pond water (strip + record) | Count visitors at 2 gates and compare (tap counters) | Check which lanterns burned longest (observe + record) |
| A Design tent | Paint signposts | Decorate the stage backdrop | Design a thank-you card |
| S Welcome tent | Welcome elderly visitors to shade | Comfort a child who lost her parents (they are found) | Serve tea to volunteers |
| E Sponsors' stall | Persuade a shop to lend chairs | Announce the next event (choose words, tap megaphone) | Thank sponsors and invite them next year |
| C Records desk | File stall permits | Keep the lost-and-found list | Count and log returned equipment |

Every task: 3 required + 1 optional; same expected time per phase.

## 6. Puzzle interaction (ability levels)

| Level | Interaction | What it must *not* allow (to protect the construct) |
|---|---|---|
| L05 Workshop Orders | Drag order cards to the bench; materials and coins update live; ring the bell to submit | No auto-optimise button; no showing which set is best before submission |
| L06 Map Room | Drag a fragment into the gap; fragment snaps in place in its *fixed* orientation; "Pin it" submits | **Fragments cannot be rotated by the player** (manual rotation would turn mental rotation into trial and error) **[D]** |
| L07 Pattern Gate | Pick a stone from the cart; it drops into the socket; "Turn the wheel" submits | No elimination hints that remove options |
| L08 Vault | Swipe 3 dials; read the clue note; pull the lever to submit | No feedback per dial before submission (would leak the answer) |

Common rules (existing scoring): one practice item with retries; six scored items with **one attempt each**; one hint per item; skip always available; progress continues after any outcome.

## 7. Moving between scenes

- Enter a building: walk into its door + Action "Enter" → 300 ms iris transition → scene arrival (NPC greets).
- Leaving mid-level: Pause → "Back to the valley" (progress saved; existing `LEVEL_EXIT`).
- After a stop: stamp + map piece animation → rest spot appears beside the door → Journal page → back in the hub with the next "!" lit.

## 8. Difficulty and onboarding curve

| Stage | New skills introduced | Support |
|---|---|---|
| L01 | Walk, Action, pick up, place, read | Chakor prompts; arrows on the ground for the first 3 objectives |
| L02 | Choose by walking; drag, tap, hold, paint, sort | First work moment has finger-animation guides |
| L05 | Planning board | Practice day with unlimited tries |
| L03 | Time budget, revisiting | Candle stand explained by Mehr at the door |
| L06–L07 | Placing a fixed piece; reading a sequence | Practice items |
| L04 | Roles, phases, free movement between sites | Mayor's briefing; site bubbles |
| L08 | Dials and clues | Practice lock |

No skill is required that was not taught earlier, and no level requires speed.
