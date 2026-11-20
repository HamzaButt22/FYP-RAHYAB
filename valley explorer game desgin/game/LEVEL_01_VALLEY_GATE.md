# Level 01 — The Valley Gate

| Field | Value |
|---|---|
| Level ID (code) | `valley_gate` (existing) |
| Play order | 1 of 8 · Chapter 1 |
| Kind | Context + tutorial (no interest, ability or personality score) |
| Location | Valley Gate & Meadow (`WORLD_AND_STORY_DESIGN.md` §5.1; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §3) |
| Target duration | 4 min (2 min tutorial + optional exploring) |
| Characters | Ustad Mehr, Chakor |
| Preserved from current build | The level machine (`valleyGate`: read signs = `VISIT`, open gate = `ENTER`), `EXPLORATION` events, the in-world gate |
| New in this design | Latch-repair tutorial mission, curiosity spot, control-familiarity covariate, first feather |

---

## 1. Level name
**The Valley Gate** — "Welcome, Rahyaab."

## 2. Level objective
- **Player objective:** repair the latch of the Valley Gate and open it to enter the valley.
- **Design objective:** teach every control the game uses (walk, Action, talk, pick up, place, read) in under two minutes, introduce Mehr, Chakor and the quest, and show the six districts *without* asking the student to choose anything.
- **Assessment objective:** none scored. Collect research covariates: control familiarity (γ) and optional exploration (signboards, curiosity spot).

## 3. Story introduction
After traveller creation and the 3 intro panels, the bus pulls away and the player stands at the bus stop.

1. Chakor flutters down onto the gatepost. *Chirp!* Text: "Hello! Tap the arrows to walk." (A pulsing hand shows the D-pad. Tap-to-walk hint appears after 2 steps: "You can also tap the ground.")
2. When the player is within 2 tiles of Mehr, the Action button reads **Talk**. Mehr: "Welcome, Rahyaab! I'm Ustad Mehr, the valley's mapmaker." → "The gate latch has fallen apart again." → "Can you find the three pieces in the meadow?"
3. The quest card slides in: **Fix the gate latch (0/3)**.

## 4. Environment design
Spring morning. The meadow is bright green with yellow and pink wildflowers; snow peaks behind the gate; a narrow stream crosses the meadow with a plank bridge. The stone gateway has a carved arch and a heavy wooden gate. Mehr's small cart (maps, a tea kettle) is parked beside the path. Six painted signboards stand along a low stone wall, each showing a district icon (workshop gear, market awning, hill house, aqueduct arch, park fountain, fort tower). Birdsong and stream ambience.

## 5. Map layout
21 × 10 tiles (sketch in `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §3). Start at the bus stop (bottom centre). Latch parts are placed so the student must walk up, left, right and across the bridge: **bolt** (left of path, row 5), **pin** (lower left, across the stream), **hinge** (lower right). Signboards in two rows near the top. Curiosity spot (old milestone) 3 tiles off the path, upper left.

## 6. Character movement
D-pad and tap-to-walk both enabled. Ground arrows guide the first objective only (to Mehr). Walking speed is fixed (no running), so no student is faster than another.

## 7. Interactive objects

| Object | Action label | What happens |
|---|---|---|
| Mehr | Talk | Dialogue; once all parts are placed: "Now open it!" |
| Bolt / Pin / Hinge (latch parts) | Pick up | Part floats above the head and appears in the HUD carry slot (carry one at a time) |
| Latch slot on the gate | Place | Glows when carrying a part; part snaps in with a click; quest counter +1 |
| Gate (after 3 parts) | Open the gate | Gate swings open; `ENTER` |
| Signboards ×6 | Read | Speech bubble with icon + one line: e.g., "The Makers' Street: workshops and the Makers' Hall." Logged as `EXPLORATION` (existing) |
| Old milestone (curiosity spot) | Look | "An old milestone: 'Rahwali 2 kos'. Kos is an old way to measure distance." No reward. Research signal O-1 |
| Feather | Pick up | Feather counter 1/8; Chakor chirps |
| Mehr's cart | Look | "Maps, a kettle, and a lot of pencils." (flavour) |

## 8. NPC interactions
- **Mehr**: 3 bubbles at first meeting; 1 bubble per later interaction ("Two more pieces to go."). After the gate opens: "Wonderful! Here is your Pathfinder's Journal." (journal handed over) → "And the first piece of the old Pathfinder's Map." → "Follow the path into town. The caravan is waiting."
- **Chakor**: tutorial prompts (walk, Action, pick up, place); if no progress for 20 s, hops toward the nearest unfound part (tutorial only).

## 9. Main mission
**Fix the gate latch** — find and place 3 parts, then open the gate.

## 10. Optional missions
- Read the six district signboards (shown as "Signboards read: 2/6" only after the first one is read).
- Look at the old milestone.
- Collect the first feather.
None of these affect progress or rewards.

## 11. Exact gameplay mechanics (flow)
1. Spawn at bus stop → Chakor tutorial bubble (walk).
2. Walk to Mehr (arrows on ground) → Talk → quest card.
3. Free walk: pick up any part → walk to gate → Place. Repeat ×3 in any order.
4. The gate's Action changes to **Open the gate** → gate animation → `LEVEL_COMPLETE` (existing machine: `ENTER`).
5. Mehr hands over the journal and map piece 1 (stamp animation).
6. Rest spot appears (bench by the gate) → **Journal page 1** (first-time explanation; `BIG_FIVE_ASSESSMENT_DESIGN.md` §3).
7. Return to the hub just inside the gate; the "!" marks the caravan on the town road.

## 12. Player decisions
Order of collecting parts; whether to read signboards or explore. No assessment-relevant choices are offered in this level (deliberate: the first minutes should be pure orientation).

## 13. Challenge and difficulty progression
Trivial by design: every action is shown before it is needed. The only "challenge" is navigating around the stream (teaches that water blocks and bridges connect).

## 14. Rewards
Map piece 1 · Pathfinder stamp 1 · 20 coins · the Pathfinder's Journal (used after every stop). Feather 1 (optional).

## 15. Completion conditions
Gate opened (all three parts placed). Reading signs is not required (existing rule: the gate can be opened without visiting any sign).

## 16. Failure and retry behaviour
No failure state. If the student leaves the app, the level resumes with parts already placed (state saved per commit). Dropping a part elsewhere is not possible (carried until placed), so parts cannot be lost.

## 17. Assessment signals collected

| Event | When | Use |
|---|---|---|
| `LEVEL_START`, `LEVEL_COMPLETE` (existing) | Start/finish | Journey progress |
| `EXPLORATION {area_id}` (existing) | Each signboard read | Research only: part of Openness indicator O-2 (exploring before needed) |
| `RESEARCH_SIGNAL {signal_id: "curiosity_spot", spot_id}` **[A] new type** | Milestone looked at | Research only: Openness indicator O-1 |
| `RESEARCH_SIGNAL {signal_id: "control_familiarity", steps_to_mehr, wall_bumps, tap_to_walk_used, time_to_first_place_ms}` | After the third part is placed | Covariate γ (gaming/control familiarity) used to check fairness of all other measures. Never scored. |
| `BIG5_RESPONSE` (existing) | Journal page 1: items mi05, mi02 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** that the student learned the controls (progress), how many signboards they read, whether they examined the milestone, and how familiar the controls seemed (as a covariate).
- **Cannot:** anything about interests (no choices offered), ability (no puzzles), or personality from behaviour. Reading signboards may reflect curiosity — or reading confidence, completionism, or following Mehr's suggestion; therefore it stays research-only.

## Journal page after this stop
Items **mi05** "I have a vivid imagination." and **mi02** "I sympathize with others' feelings." (first page: longer explanation and a one-time example of the answer scale with a neutral statement that is *not* recorded, e.g., "I like apricots" — **[A]**, to teach the scale without wasting a real item).

## Changes from the current build
| Current | Proposed |
|---|---|
| Gate opens with one Action after Mehr's welcome | Short latch-repair mission that teaches pick up / place |
| Signs are the only interaction | Signs + curiosity spot + feather + Mehr's cart |
| No covariate collection | Control-familiarity research signal |
