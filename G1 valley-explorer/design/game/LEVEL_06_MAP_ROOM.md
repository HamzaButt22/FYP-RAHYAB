# Level 06 — The Map Room

| Field | Value |
|---|---|
| Level ID (code) | `map_room` (existing) |
| Play order | 5 of 8 · Chapter 2 (first stop after the Night camp) |
| Kind | **Ability evidence — spatial reasoning (mental rotation)** |
| Location | Mehr's Map House (`WORLD_AND_STORY_DESIGN.md` §5.6; layout `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §7) |
| Target duration | 4 min |
| Characters | Ustad Mehr, Chakor |
| Preserved | Item bank `mr_practice` + `mr1…mr6` (land/water grids; one option is a pure rotation, three are mirror images then turned; fixed option order per item), scoring rules (first response, practice unscored, 1 hint, skip, ≥ 4 attempted), events |
| Changed | Story framing (genuine fragment vs "back-side tracings"), the fragment is dropped into the map, and the map visibly rebuilds |

---

## 1. Level name
**The Map Room** — "Find the piece that has only been turned."

## 2. Level objective
- **Player objective:** restore Mehr's old route map to find the way to the Fort where the festival lanterns are stored.
- **Assessment objective:** six scored items. Operational construct: *recognising a shape after rotation while rejecting its mirror image* (mental rotation). Correctness is defined; no time limit.

## 3. Story introduction
Morning after the Night camp. Mehr unlocks his Map House: "The way to the old Fort is on this map." → "Long ago it was torn, and someone made tracings from the *back* of the paper — they look right but they're flipped." → "My record cards show each missing piece. Find the real one — it may be turned around, but never flipped."

## 4. Environment design
A tall, cosy room: shelves of rolled maps, a brass globe (Chakor perches on it), a lamp, and a large table with the **old map** spread out. Each missing section is a square gap. Beside the table: Mehr's **record card** for the current gap (shows the piece as it should look, drawn in ink), and a **tray** with four fragments, some turned, three of them back-side tracings. Paper texture, ink lines, land in sand colour, water in blue **with wave hatching** (shape readable without colour).

## 5. Map layout
Walk-in (door → table, 4 tiles), then the table close-up (sketch in `WORLD_MAP_AND_LEVEL_LAYOUTS.md` §7): record card top-left, map gap top-right, fragment tray below (2 × 2), controls at the bottom.

## 6. Character movement
Walk-in only; at the table the player character stands beside it and leans in when a fragment is dragged.

## 7. Interactive objects

| Object | Interaction | Response |
|---|---|---|
| Fragment (×4) | Drag to the gap (or tap fragment, tap gap) | Fragment sits in the gap **in its current orientation**; the previous one returns to the tray |
| Gap | — | Highlights when a fragment hovers |
| Record card | Tap | Enlarges the target drawing |
| Magnifier (hint) | Tap | Chakor hint (existing hints, e.g., "Follow the lonely island in the corner…") |
| Pin | Tap (enabled when a fragment is placed) | Submits |
| Skip | Tap | Mehr finds the piece himself |

**Rotation is not available to the player** (no rotate button, no two-finger twist). Allowing manual rotation would let students match by trial and error and would change the construct from mental rotation to visual matching. **[D]**

## 8. NPC interactions
- **Mehr:** introduces, explains the practice item, gives feedback after each scored item, and after the last item traces the route to the Fort with his finger.
- **Chakor:** hints.

## 9. Main mission
Restore the practice section and **six map sections** (mr1–mr6).

## 10. Optional missions
None during scored items. After the level, the student may look around the Map House (globe, shelves — flavour lines; curiosity spot "the star chart" counts as O-1 research signal).

## 11. Exact gameplay mechanics
1. **Practice** (`mr_practice`): retries allowed; after a correct answer the fragment animates *turning* into place so the student sees what "only turned" means; after a mirror choice, Mehr flips the fragment over to show it is a back-side tracing.
2. **Sections 1–6:**
   1. `ITEM_PRESENTED`.
   2. Student places a fragment in the gap (may swap any number of times before pinning).
   3. **Pin** → `ITEM_RESPONSE` (first response counts).
   4. **Story resolution and feedback:**
      - Correct: the fragment rotates into alignment, the ink route draws across it to the next section; "That's the one!"
      - Mirror chosen: the fragment flips over to reveal the tracing; Mehr: "That one's a back-side tracing. The real one is this —" (the correct fragment turns into place; the route draws).
      - Skipped: Mehr places the correct fragment ("I'll find this one").
   5. Next section (the map is now one section more complete).
3. After section 6: the full route to the Fort glows; map piece 5; journal page.

## 12. Player decisions
Which fragment to place (the answer); hint; skip.

## 13. Challenge and difficulty progression

| Item | Grid | Turn of correct piece | Difficulty driver |
|---|---|---|---|
| mr1 | 3 × 3 | ¼ turn | Small grid, one turn |
| mr2 | 4 × 4 | ½ turn | Upside down |
| mr3 | 4 × 4 | ¾ turn | Two corners to track |
| mr4 | 4 × 4 | ¼ turn | Busier pattern |
| mr5 | 4 × 4 | ¾ turn | Corner order reasoning |
| mr6 | 4 × 4 | ½ turn | T-shape orientation |

Order is provisional; re-order by pilot p-values.

## 14. Rewards
2 coins per attempted scored item (any outcome), 20 coins for the level, map piece 5, stamp 5. The map rebuilds fully whatever the outcomes.

## 15. Completion conditions
Practice + six sections answered or skipped.

## 16. Failure and retry behaviour
Practice: retries. Scored: one attempt; story continues. Resume after app kill at the current section.

## 17. Assessment signals collected

| Event (existing) | Data | Use |
|---|---|---|
| `ITEM_PRESENTED` | item_id, family `spatial`, version, difficulty, practice | Exposure |
| `ITEM_RESPONSE` | chosen option, correct, attempt, hints_used, response_time_ms | Ability count (first response) |
| `HINT_USED` | item_id | "Without hints" count |
| `RESEARCH_SIGNAL {persistence…}` **[A]** | ms before skip/hint, number of fragment swaps | Research only (C-2) |
| `RESEARCH_SIGNAL {curiosity_spot: star_chart}` **[A]** | after the level | Research only (O-1) |
| `BIG5_RESPONSE` | Journal: mi08, mi12 | Big Five questionnaire |

## 18. What the system can and cannot conclude
- **Can:** how many of six rotation-vs-mirror problems the student solved today (with/without hints).
- **Cannot:** general spatial ability, suitability for engineering/architecture, or intelligence. Mental rotation performance is known to vary with practice and familiarity (e.g., gaming experience) — the control-familiarity covariate (L01) is used to check this in research. Small screens may make 4 × 4 grids harder to see: minimum cell size 12 mm is required (UI spec), and device size is logged.

## Journal page after this stop
**mi08** "I often forget to put things back in their proper place." · **mi12** "I feel others' emotions."

## Changes from the current build
| Current | Proposed |
|---|---|
| Choose 1 of 4 pieces, then "Check answer" | Drag a fragment into the map gap, pin it; map visibly rebuilds |
| Abstract instruction | Story reason for mirror distractors (back-side tracings) |
| Feedback in a sheet | Fragment turns/flips in the world to show why |
