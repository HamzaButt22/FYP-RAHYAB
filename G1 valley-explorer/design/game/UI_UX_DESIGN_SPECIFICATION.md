# UI/UX Design Specification

**Version:** 1.0 design proposal · 19 Nov 2026
Portrait, Android phones from 360 × 640 dp upward; content max width 560 dp on tablets (existing `MAX_WIDTH`). All text English, ≤ 15 words per line of dialogue, read-aloud available everywhere **[A]**. Touch targets ≥ 48 dp (existing `TOUCH`), D-pad arrows 56–64 dp, Action button ≈ 116 dp.

---

## 1. Global layout system

```
┌──────────────────────────────────┐  status-bar safe area
│ HUD: [⏸] Title / sub     🪙 120 ⭐3 [🗺] │  56 dp
├──────────────────────────────────┤
│                                  │
│          WORLD / SCENE           │  flexible
│                                  │
│   (dialogue bubble overlays here) │
├──────────────────────────────────┤
│  ▲                               │
│ ◀ ▶            [  ACTION  ]      │  controls band ≈ 200 dp
│  ▼                               │  (thumb zone)
└──────────────────────────────────┘  gesture-bar safe area
```
- Left-handed setting mirrors the controls band.
- The HUD never shows timers.
- Modal sheets slide from the bottom and keep their buttons in the thumb zone.

## 2. Journey flow

```
S01 Splash → S02 Consent check (host) → S03 Title ─┬─ New → S04 Traveller → S05 Story intro → S06 World (L01)
                                                    └─ Continue → S06 World (last position) or the level in progress
S06 World ⇄ S07 Dialogue · S08 Map/Quest log · S18 Pause/Settings · S19 Tailor
S06 → level scene → (S09/S10/S11/S12 interest UI | S13/S14 puzzle UI) → S15 Stop complete → S16 Journal → S06
After stop 4: S17 Night camp → S16 Journal → S06 (Chapter 2)
After stop 8: S16 Journal → S20 Epilogue → S21 Path Map → S22 Pathways (or return to RahYaab)
```

## 3. Screen specifications

### S01 Splash / loading
| Aspect | Spec |
|---|---|
| Layout | Full-bleed valley illustration at dawn; logo "Valley Explorer" centred; small RahYaab mark bottom |
| Components | Logo, progress line (indeterminate) |
| Text | "Valley Explorer" · "A RahYaab adventure" |
| Interactions | None; ≤ 2 s on mid-range devices |
| Feedback | Chakor flies across once (reduced motion: static) |

### S02 Consent check (existing behaviour)
| Aspect | Spec |
|---|---|
| Purpose | The game opens only if the host says consent/assent are recorded; otherwise shows "Please finish the consent step in RahYaab first" and a **Back to RahYaab** button. Nothing is stored. |
| Layout | Card on parchment; Mehr portrait |

### S03 Title
| Aspect | Spec |
|---|---|
| Layout | Illustration of the gate; title; two big buttons stacked |
| Buttons | **Start the adventure** (new) / **Continue** (if saved progress); small **Settings** link |
| Text | Continue button shows "Chapter 1 · Workshop Orders" (where they are) |
| Navigation | Start → S04; Continue → last scene |

### S04 Traveller creation (existing `AvatarCreator`, extended)
| Aspect | Spec |
|---|---|
| Layout | Large avatar preview on a meadow tile (top 45%); three option rows below: Style, Skin, Clothes; **Ready** button |
| Components | Style chips (5, with icons), skin swatches (5), outfit swatches (2 free + locked ones with padlock and "earn in the game") |
| Character placement | Avatar centred, turns to face the user; idle blink |
| Text | Title "Choose your traveller"; one line "You can change this later at the tailor." |
| Interactions | Tap to change; preview updates instantly; the initially selected style is random **[D]** |
| Feedback | Small sparkle on change |
| Navigation | Ready → S05 (first time) or back to S06 (from the tailor) |

### S05 Story intro (3 panels)
| Aspect | Spec |
|---|---|
| Layout | Full-screen illustrated panels (bus on the mountain road; Mehr's letter; arrival at the gate with *your* traveller and Chakor) |
| Text | One caption per panel (≤ 15 words); read-aloud |
| Buttons | **Next** (bottom right); **Skip story** (top right, small) |
| Interactions | Tap anywhere = Next |

### S06 World view (hub and walkable scenes)
| Aspect | Spec |
|---|---|
| Layout | §1 global layout; tile world in the middle; camera follows the character |
| Components | HUD (pause, place name, coins, stamps, map button), D-pad, Action button, objective marker "!", object labels within 2 tiles, carry slot (when carrying), Chakor |
| Character placement | Player sprite centred (camera clamps at edges); NPCs on their tiles facing the player when near |
| Interactions | D-pad / tap-to-walk; Action (context verb); tap HUD map → S08 |
| Feedback | Path glow toward the next objective (can be turned off in settings); footstep sounds; Action button pulses when a new verb appears |
| Navigation | Doors → level scenes; pause → S18 |

### S07 Dialogue bubble
| Aspect | Spec |
|---|---|
| Layout | Bubble anchored above the speaker, or bottom card with portrait if the speaker is off-screen |
| Components | Portrait (96 px), name, ≤ 15 words, speaker icon (read-aloud replay) |
| Interactions | Action button shows **OK** while a bubble is open (existing); tap bubble also advances |
| Rules | Max 3 bubbles before control returns; no auto-advance (reading speed differs) |

### S08 Map & quest log
| Aspect | Spec |
|---|---|
| Layout | Full-screen illustrated valley map (hand-drawn style) with district names, "!" on the next stop, ✓ stamps on finished stops; bottom card "Next: Makers' Hall — spend the open day" |
| Interactions | Tap a visited signpost to fast-travel (hub only); pinch-zoom optional |
| Feedback | Collected map pieces shown as coloured areas; uncollected as sketch lines |

### S09 Caravan fork banner
| Aspect | Spec |
|---|---|
| Layout | Small top banner: work icon + "Heading to *Fix the cart wheel*…" with **Back** (1 s, then auto-continue) |
| Purpose | Prevent accidental choices (L02 §6) |

### S10 Activity Stage (all interest activities)
| Aspect | Spec |
|---|---|
| Layout | See `GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §4: HUD with work icon; maker portrait + goal line; work scene; step pips and ★ extra chips; item tray; **Leave** / **Finish** |
| Buttons | **Finish ✓** (disabled until required steps done; label shows "Finish (uses 1 candle)" in L03), **Leave** (secondary) |
| Character placement | The player character appears small at the edge of the work scene, animating the current action (hammering, writing, painting) |
| Interactions | Primitives P-DRAG/TAP/HOLD/PAINT/SORT/CONNECT/TOGGLE with fallbacks |
| Feedback | Current target glows; finger hint after 6 s idle on the first activity only; "Nice!" / "Extra!" pops (same for all types) |
| Accessibility | Every target has an accessibility label ("the pump handle — press and hold to pump") |

### S11 Bonus offer (L03)
| Aspect | Spec |
|---|---|
| Layout | Bottom sheet over the finished activity |
| Text | "One more round? It uses one candle. It's up to you." |
| Buttons | **Yes, one more** / **No thanks** — same size, same colour weight **[D]** |

### S12 Role sheet (L04)
| Aspect | Spec |
|---|---|
| Layout | Bottom sheet with six role cards (icon, name, one line), **order randomised per student** |
| Buttons | Role cards (single select); at phase breaks **Keep my role** / **Switch** equally prominent |
| Text | "Every role keeps the festival going. You can still help anywhere." |

### S13 Puzzle scene frame (L05–L08)
| Aspect | Spec |
|---|---|
| Layout | HUD with "Puzzle 3 of 6" or "PRACTICE" pill; environmental puzzle area (board / map table / sluice / door); bottom controls: **Hint** (feather), **Skip**, primary submit (**Ring the bell / Pin it / Turn the wheel / Pull the lever**) |
| Rules | No timer; one hint per item; skip always enabled; submit enabled only when an answer is placed |
| Character placement | Player at the side, animating submit |

### S14 Puzzle feedback
| Aspect | Spec |
|---|---|
| Layout | World payoff first (water flows, door opens), then a bottom card |
| Text | Correct: "That's it!" / "Solved!" · Not correct (scored): "Not this one — here's how it works: …" · Skipped: "No problem — here's how it works: …" · Practice wrong: "Not quite — have another go" |
| Buttons | **Next** (scored) / **Try again** (practice wrong) |
| Rules | Never "wrong", "fail", red crosses or buzzers |

### S15 Stop complete
| Aspect | Spec |
|---|---|
| Layout | Journal opens on screen; the stop's stamp thumps onto the page; the map piece flies to a small map in the corner; coins counter ticks up |
| Text | "★ Stop complete: The Map Room" · "+20 coins · Map piece 5 of 8" |
| Duration | 3 s, tap to skip |

### S16 Journal page
| Aspect | Spec |
|---|---|
| Layout | Notebook page with the stop's stamp in the corner; Mehr portrait + one line at top; progress dots (1 of 3); statement in large type; optional gloss; five answer buttons (growing dots + words); **Skip this sentence**; after the last statement: "Journal page saved" ink stamp + **Back to the valley** |
| Rules | Exact wording; one statement at a time; same layout every page; no coins; read-aloud reads the statement and the five answer labels |
| Existing | `game/Journal.tsx` implements the content; this redesign changes framing (rest spot, notebook art) only |

### S17 Night camp (chapter break)
| Aspect | Spec |
|---|---|
| Layout | Night meadow scene; two fires (big fire with travellers / small fire with Mehr); map blanket |
| Interactions | Walk to either fire → **Sit** → Mehr's line → S16 journal page 4 → "Chapter 1 complete — your progress is saved. Continue now or later." **Continue** / **Back to RahYaab** |

### S18 Pause & Settings
| Aspect | Spec |
|---|---|
| Pause sheet | **Continue**, **Map**, **Settings**, **Back to the valley** (inside a level), **Back to RahYaab** (saves) |
| Settings | Text size (100/125/150%) · Read-aloud on/off · Music volume · Sound volume · Haptics on/off · Reduced motion · Left-handed controls · Objective path glow on/off · High-contrast outlines · "Reduced motor demand" (holds become double-taps) |
| Rules | Settings are cosmetic preferences (stored locally like `ve:prefs`); setting usage is logged as research covariates only if research consent covers it **[A]** |

### S19 Bazaar tailor
| Aspect | Spec |
|---|---|
| Layout | Shop counter; avatar preview; item grid (colours, caps, scarves, pins) with coin prices; owned items marked |
| Rules | Cosmetic only; no randomised items; no time-limited offers; prices fixed |

### S20 Epilogue
| Aspect | Spec |
|---|---|
| Layout | Non-interactive scene (≈ 40 s) — lanterns on the river, NPCs waving; **Skip** button |
| Then | Mehr's two reflection questions (existing `REFLECTION_RESPONSE`: favourite part; how it felt) as tap choices |

### S21 Path Map (results)
| Aspect | Spec |
|---|---|
| Layout | Top: the completed Pathfinder's Map with the player's route drawn through the eight stops; below, a vertical scroll of section cards with icons: **What you enjoyed** · **How you usually are** · **Puzzles you solved** · **Ideas to explore** · **Reminders**; bottom bar **Back to RahYaab** (+ **See pathways** if connected) |
| Text rules | No numbers for interests or personality (bars without labels are allowed for interests, as now); puzzle counts allowed ("4 of 6"); every section has a one-line "what this means"; no percentiles; reminders always shown |
| Character placement | The traveller stands at the end of the drawn route with Chakor |
| Feedback | Sections reveal one by one on first view (reduced motion: instant) |
| Existing | `screens/Results.tsx` provides the sections; this redesign adds the map header and pathways link |

### S22 Pathways to explore (if connected — D-12)
| Aspect | Spec |
|---|---|
| Layout | Cards: primary idea, 2–3 alternatives, "something different"; each card: pathway name, why (interests / subjects / goals), eligibility status with checked date, "what to do next" |
| Buttons | **Save to my RahYaab plan** (host), **Talk to a counsellor** (host) |

### S23 System states
| State | UI |
|---|---|
| Offline | Small cloud-off icon in HUD; "Saved on this phone. It will upload when you are online." (existing storage/sync behaviour) |
| Storage problem | Banner "Your phone is low on space — progress may not save" (existing `storageWarning`) |
| Resume | "Welcome back! You were in the Map Room." with **Continue** |
| Exit mid-level | "Your progress is saved." |

## 4. Text and tone rules
- Second person, present tense, friendly, never childish.
- Use the same verbs everywhere (Walk, Look, Pick up, Place, Talk, Work here, Finish, Leave, Skip).
- Avoid: "test", "exam", "score", "correct/incorrect", "wrong", "fail", "IQ", "personality type".
- Numbers only for coins, stamps, map pieces and puzzle counts.

## 5. Accessibility checklist
| Requirement | Spec |
|---|---|
| Contrast | Text ≥ 4.5:1 (existing palette documented at 5.3–13:1) |
| Colour independence | Every state has an icon/word; pattern puzzles use shape/count/fill only (existing) |
| Touch | ≥ 48 dp; D-pad arrows 56–64 dp, Action button ≈ 116 dp; 8 dp spacing |
| Motion | Reduced-motion setting; no flashing > 3 Hz |
| Screen readers | All interactive elements labelled (existing practice); world objects announce "Mehr, 2 steps up" when focused **[H — feasibility to test]** |
| Reading | Read-aloud for all text; glosses for difficult journal words; ≤ 15 words per bubble |
| Motor | Tap fallback for drag; hold → double-tap option; tap-to-walk |
| Cognitive | One objective at a time; quest log always available; no time pressure |
