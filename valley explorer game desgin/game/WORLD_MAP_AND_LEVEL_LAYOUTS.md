# World Map and Level Layouts

**Version:** 1.0 design proposal · 19 Nov 2026
Layouts are **design sketches**. Exact tile maps are authored in the implementation phase and must pass the existing automated checks (rectangular rows; every interactive object reachable on foot; stops beyond the gate unreachable until the gate opens — see `__tests__/game.test.ts`).

---

## 1. Conventions

| Symbol | Meaning | Walkable |
|---|---|---|
| `.` | grass / floor | yes |
| `=` | path / road (glows when it leads to the next objective) | yes |
| `,` | flowers / decoration | yes |
| `b` | bridge | yes |
| `T` | trees | no |
| `^` | mountains / cliff | no |
| `~` | water | no |
| `#` | wall / fence | no |
| `G` / `g` | closed / open gate | no / yes |
| `[ ]` | building footprint (door marked `D`) | no (door is the interaction point) |
| `@` | player start | — |
| `!` | next objective marker (bouncing) | — |
| `*` | curiosity spot (research only, unrewarded) | — |
| `f` | Chakor feather (optional collectible) | — |

**Camera:** 9 columns wide in portrait (existing `VIEW_COLS = 9`), tile size = ⌊screen width ÷ 9⌋ up to 64 px; the camera leads by 1 tile in the walking direction and is clamped at map edges (existing `cameraFor`).

**Mini-map:** a corner button opens a full-screen illustrated map of the hub with the quest marker; tapping a visited signpost fast-travels there (hub only).

## 2. Hub — Rahwali Valley (schematic)

```
 N ▲                       ^^^^^^^^^^^^^^^^^^^^^^^^
                           ^^^  OLD FORT  [LANTERN ^^
                           ^^^   VAULT D ] (L08)   ^^
                           ^^^      ==            ^^^
             HILL LANE      ======    NORTH ROAD
   [MAP HOUSE D]==========        ==========b~~~~ OLD AQUEDUCT
     (L06)        *                      ~~~[SLUICE D] (L07)
                 ==                       ~~~~~
   MAKERS' STREET ==            TOWN SQUARE         RIVER ROAD
   [TOWN WORKSHOP D] (L05)    ( fountain )  ===========  [PARK GATE D]
   [MAKERS' HALL  D] (L03)    notice board              RIVERSIDE PARK (L04)
                 ==     BAZAAR [tailor] [tea]   *     ~~~~ river ~~~~
                  ===========
       CARAVAN ROAD (L02)   ==   f
     (winds west, off-map         ==
      scene; arrival here)          ==     NIGHT CAMP (fire)
                                     ==       *
     MEADOW   ,  ,  f   *             ==
     ######### VALLEY GATE  G (L01) ########
                        @ bus stop
```

| Hub element | Tile size (approx.) | Notes |
|---|---|---|
| Whole hub | 24 × 44 tiles | Portrait scroll; ≈ 3–4 screens tall |
| Districts | Meadow (rows 34–43), Town (16–33), Hill Lane & Aqueduct (8–15), Fort (0–7) | Unlock top-to-bottom with progress |
| Signposts (fast travel) | Meadow, Square, Hill Lane, River Road, North Road | Fast travel unlocks after first visit |
| Curiosity spots (6) | old milestone (Meadow), sundial (Square), bird's nest (Hill Lane), carved stone (Aqueduct path), river otters (River Road), star dial (Night camp) | Off the main path by 2–4 tiles; each shows one fact line; no reward |
| Feathers (8) | Visible on main paths near landmarks | Collectible; unlocks a cosmetic scarf |

**Unlocking:** areas beyond the next objective are fenced with friendly blockers (cart parked across the road, "Opening soon" ribbon), never invisible walls.

## 3. L01 Valley Gate & Meadow (scene inside the hub)

```
 ##########G##########     G = gate (needs latch)
 #  ,  [S1] [S2] [S3] #    S1–S6 = district signboards
 #    ,      ==        #
 # [S4] [S5] [S6]  ==  #
 #  *          == Mehr  #   * = old milestone (curiosity)
 #   ,   bolt  ==  cart #   bolt, pin, hinge = latch parts
 #  ~~~b~~~~~~~~~~ ~~~ #   stream with plank bridge
 #   pin    ==    hinge #
 #  f      ==          #
 ##########@###########    @ = bus stop (start)
```
Size 21 × 10. Start at `@`; Mehr stands by the cart; latch parts are each in a different part of the meadow (teaches walking in all directions and crossing the bridge). Exit: through the opened gate to the Town (hub north).

## 4. L02 Crossroads Caravan (separate scene, 10 forks)

Each fork is a small scene (9 × 9, the existing `FORK` layout extended with terrain variety):

```
  R1     R2     R3        R1–R3 = three road ends; walking onto one = choosing it
  ==     ==     ==        (each road end shows a big work icon + verb on a signpost)
   ==    ==    ==
     ==  ==  ==
       ======         [tent]   tent = rest (decline to work at this fork)
         ==
         @  (caravan wagon behind the player)
```

| Fork | Terrain theme | Background |
|---|---|---|
| 1–2 | Orchard (apricot blossom) | Blossom trees, beehives |
| 3–4 | River ford | Stepping stones, water |
| 5–6 | Pine slope | Pines, woodpile |
| 7–8 | Bazaar edge | Stalls, awnings |
| 9–10 | Shrine meadow before town | Prayer flags are **not** used (religious symbols avoided); stone benches, poplars |

Road ends are **at equal distance** from the start (4 tiles each) so no road is easier to reach. Road position (left/centre/right) of each work type is balanced across forks (existing BIBD + position recording).

After a road is chosen, the scene cross-fades to the **work moment** (a 1-screen interaction, `GAMEPLAY_AND_INTERACTION_SPECIFICATION.md` §5), then back to the next fork.

## 5. L05 Workshop Orders — Town Workshop (single-screen scene)

```
 ┌───────────────────────────────────┐
 │  ORDER BOARD (cards)              │   cards: name, picture, material costs, coins
 │  [card][card][card][card][card]   │
 ├───────────────────────────────────┤
 │  TODAY'S BENCH (drop zone)        │   planned cards sit here
 │  [  ]   [  ]   [  ]               │
 ├───────────────────────────────────┤
 │  SHELVES: wood ▮▮▮▮▮▮  metal ▮▮▮  │   stacks shrink as cards are planned
 │           cloth ▮▮▮▮               │
 │  Coins planned: 46                 │
 ├───────────────────────────────────┤
 │ [hint feather]  [Skip]  [Ring bell]│   bell = submit
 └───────────────────────────────────┘
```
Walk-in: the student walks from the door to the counter (3 tiles) and talks to Nasreen Khala; the planning board then fills the screen.

## 6. L03 Makers' Hall (walkable scene)

```
 ###################
 # [R]   [I]   [A] #     benches along the top wall, each with its maker
 #  .     .     .  #
 #   tool racks    #     tool racks behind benches (tidy-up opportunity)
 #  .     .     .  #
 # [S]   [E]   [C] #     benches along the lower wall
 #        .        #
 # candles  ==  door#
 ########D#########
```
Size 17 × 10. Bench positions (R…C) are **randomised per student** among the six slots (recorded) so that location (nearest to door, centre) does not bias choices. **[D]** All benches are within 4–6 steps of the centre point.

## 7. L06 Map Room (single-screen scene with walk-in)

```
 ┌─────────────────────────────┐
 │  TORN MAP (target section)  │   map with one square gap
 │  ┌───┐┌───┐                 │
 │  │   ││ ? │   ← gap         │
 │  └───┘└───┘                 │
 ├─────────────────────────────┤
 │  FRAGMENT TRAY: [A] [B] [C] [D] │  fragments are fixed in orientation
 ├─────────────────────────────┤
 │ [magnifier hint] [Skip] [Pin it]│
 └─────────────────────────────┘
```

## 8. L07 Pattern Gate (single-screen scene with walk-in)

```
   ~~~~~~~~~~~ dry channel ~~~~~~~~~~~
   [stone1][stone2][stone3][stone4][  ]   ← empty socket
   ───────────── sluice gate ─────────────
   STONE CART: [a] [b] [c] [d]
   [carving guide hint] [Skip] [Turn the wheel]
```

## 9. L04 Riverside Park (walkable scene)

```
 TTTTTTTTTTTTTTTTTTT
 T [R yard]   [I hut]   T     six sites around a central fountain
 T    .   ===   .       T
 T [A tent] (fountain) [S tent]
 T    .   ===   .       T
 T [E stall]  [C desk]  T
 T       Noor?          T     Noor appears on the path in phase 2 (research event)
 T   Mayor  ==  gate D  T
 TTTTTTTTTTTTTTTTTTTTTTT
```
Size 21 × 13. Site positions are **randomised per student** among six slots (recorded). Equal path distance from the fountain to each site (± 1 tile).

## 10. L08 Lantern Vault (walkable corridor + door close-up)

```
 ^^^^^^^^^^^^^^^^^^^^
 ^ [D1] [D2] [D3]   ^     six iron doors; the next door has the "!" marker
 ^   ======          ^
 ^ [D4] [D5] [D6]   ^
 ^   ==  well   ==   ^
 ^^^^^^^^ gate ^^^^^^^
```
Walking to a door opens the **door close-up**: three code dials (swipe up/down or arrows), the keeper's note with clues, a lever (submit), hint and skip.

## 11. Night camp and Epilogue

- **Night camp:** 9 × 9 meadow at night; fire in the centre; Mehr seated; map blanket; star dial curiosity spot.
- **Epilogue:** non-interactive scene (≈ 40 s, skippable) — riverbank, lanterns, all NPCs; then the Path Map.

## 12. Layout rules (all scenes)

1. Every interactive object reachable; no dead ends longer than 3 tiles.
2. No more than 8 tiles of walking between the entry point and the first interaction.
3. In interest scenes, all options are equidistant (± 1 tile) from the decision point and their positions are randomised and logged.
4. Interaction points are at least 2 tiles apart so the Action button never has to guess between two objects (the engine already picks the faced tile first).
5. Text labels above objects appear within 2 tiles (existing behaviour); they never overlap the D-pad area.
