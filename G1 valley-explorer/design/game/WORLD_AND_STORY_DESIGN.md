# World and Story Design

**Version:** 1.0 design proposal · 19 Nov 2026
All names, places and events are fictional. The setting draws on the look of northern Pakistani mountain valleys (poplar rows, apricot orchards, stone-and-timber houses, glacier streams) without depicting any real town, community or real event. **[D]**

---

## 1. World background

**Rahwali Valley** is a green mountain valley with a river town at its heart. Every spring the valley used to hold the **Lantern Festival**: each family carried a lantern down to the river and set it on the water, and the whole valley could see the path from the mountain pass to the river shining at night. People said the festival "showed every traveller the way".

The festival has not been held for many years. The old lantern store was locked inside the Fort when the keeper retired, the route map to the Fort was damaged, the aqueduct gate that waters the park was jammed, and the town's makers drifted to other work. This year the town has decided to bring the festival back — and they have sent for a **Rahyaab**, a young pathfinder, to help.

Tone: warm, hopeful, community-centred. There is **no villain, no danger and no disaster**. Problems are things that have been neglected and can be fixed by people working together. (Natural-disaster framing is deliberately avoided; many students will have personal memories of floods.) **[D]**

## 2. Premise and player role

- The player is a **new Rahyaab**, arriving by the mountain road with a letter of invitation from **Ustad Mehr**, the valley's old mapmaker.
- Mehr gives the player the **Pathfinder's Journal** — a notebook to keep during the journey — and introduces **Chakor**, a chukar partridge who has adopted Mehr and now follows the player (companion, hint-giver).
- The player's quest: **help the valley get ready for the Lantern Festival** and collect the **8 pieces of the Pathfinder's Map**. Each stop gives one piece. When all eight are joined, the map shows the player's own path — the **Path Map** (results screen).

Why this framing works for assessment: the player is a *helper* who is welcome everywhere. Choosing *which* help to give is natural (interest evidence), puzzles are obstacles the old valley left behind (ability evidence), and keeping a journal is something pathfinders do (self-report).

## 3. Story arc

### Prologue — Arrival (3 min)
- **Opening panel 1:** a bus winds up a mountain road at sunrise. Caption: *"Every spring, Rahwali Valley lit its Lantern Festival. This year, it is coming back."*
- **Panel 2:** a letter: *"Dear Rahyaab, the valley needs a pathfinder. Come to the Gate. — Ustad Mehr"*
- **Panel 3:** the player steps off at the Valley Gate. Chakor lands on the gatepost.
- Traveller creation happens before panel 3 so the player sees *their* traveller arrive.

### Chapter 1 — The Road to Rahwali

| # | Stop | Story beat | Ends with |
|---|---|---|---|
| 1 | **Valley Gate** | The gate's latch is broken. Mehr shows the player how to walk, pick up and place. Signboards describe the six districts of the valley. Together they fix the latch. | Gate opens; **map piece 1**: the pass and the meadow |
| 2 | **Crossroads Caravan** | A trader caravan is going to town and offers a ride. On the way, the road forks again and again; at every fork, people need a hand with different kinds of work. | Caravan reaches town; **piece 2**: the valley road |
| 3 | **Workshop Orders** | The town's shared workshop has a pile of festival orders and limited materials. Nasreen Khala, the festival quartermaster, asks the player to plan which orders to make each day. | Festival goods built; **piece 3**: the town |
| 4 | **Makers' Hall** | The Makers' Hall holds an open day so young people can try the town's trades. The player has ten candles of time to spend at six benches. | Open day over; **piece 4**: the river bend |
| — | **Night camp** | Fire, stars, Mehr's story about the old festival; the map so far is laid out by the fire. *"Tomorrow we find the lanterns."* | Save point / chapter break |

### Chapter 2 — Lanterns for the Festival

| # | Stop | Story beat | Ends with |
|---|---|---|---|
| 5 | **Map Room** | In Mehr's Map House, the route to the old Fort is on a map that was torn into pieces long ago. The player restores the missing fragments. | Route found; **piece 5**: the hill path |
| 6 | **Pattern Gate** | The path to the Fort crosses the old aqueduct. Its sluice gate is locked by carved stones that must follow the builders' patterns. Opening it also sends water to the park. | Water flows; **piece 6**: the aqueduct |
| 7 | **Riverside Park** | Festival day! Mayor Saima runs the preparations at the park. The player picks a role and helps wherever they choose through the morning, afternoon and evening. | Park ready; **piece 7**: the park |
| 8 | **Lantern Vault** | In the old Fort, the lantern store is behind six locked doors. The retired keeper, Baba Sher, left notes instead of keys. | Lanterns carried out; **piece 8**: the Fort |

### Epilogue — Festival night (4 min)
1. **Cut-scene:** lanterns float down the river; every NPC the player met waves from the bank. Chakor flies along the line of lights.
2. **Mehr's last talk:** two short reflection questions (existing `REFLECTION_RESPONSE`: favourite part, how it felt).
3. **The Path Map:** the eight pieces join, and the map redraws itself as the player's path (results screen; `UI_UX_DESIGN_SPECIFICATION.md` §S16).
4. **Closing line (Mehr):** *"A map shows where paths go. You choose which one to walk. Talk about yours with people you trust."*

### Narrative rules
- **Every activity has a reason in the world.** No task exists only to measure something.
- **No moral judgement of choices.** NPCs thank the player equally for every kind of help; dialogue never says one kind of work is more important. **[D]**
- **No branching endings** based on assessment results (the ending is the same for everyone; only the Path Map differs). This prevents students from "playing for an ending" instead of choosing freely. **[D]**
- **Short lines:** ≤ 15 words per speech bubble, ≤ 3 bubbles before the player acts again. All lines read aloud **[A]**.

## 4. Sample dialogue (tone reference)

| Moment | Speaker | Line |
|---|---|---|
| First meeting | Mehr | "Welcome, Rahyaab! The gate is stuck again. Can you help an old mapmaker?" |
| Tutorial | Chakor (icon + chirp, text) | "Tap the arrows to walk. The orange button does things." |
| Caravan fork | Uncle Faraz (driver) | "Three roads, three kinds of work. Take whichever you like — I'll wait." |
| Activity finished (any type) | NPC of that work | "Thank you — that really helped." (same structure for all six types) |
| Wrong puzzle answer (scored) | Nasreen Khala | "Not this time. Here's how it works…" (shows the rule, then moves on) |
| Skipped puzzle | Baba Sher's note | "Skipping is allowed. The keeper's master key opens this one." |
| Journal | Mehr | "Let's write in your journal. There are no right answers." |
| Night camp | Mehr | "Tomorrow we look for the lanterns. Rest well." |

## 5. Locations

Each location below lists the elements the brief requires. Tile layouts and entry/exit coordinates are in `WORLD_MAP_AND_LEVEL_LAYOUTS.md`.

### 5.1 Valley Gate & Meadow (L01, hub south)
- **Environment:** open spring meadow at the bottom of a pass; snow peaks behind; a stream with a plank bridge; wildflowers.
- **Buildings/landmarks:** stone gateway with a wooden gate and broken latch; Mehr's cart; six district signboards along a low wall.
- **Interactive objects:** latch parts (bolt, pin, hinge) lying in the grass; signboards; Mehr; a curiosity spot (old milestone with a carved arrow); first Chakor feather.
- **NPCs:** Ustad Mehr, Chakor.
- **Player activities:** walk, pick up, place, read signs, talk.
- **Missions:** main — fix the latch and open the gate; optional — read signboards; look at the milestone.
- **Entry/exit:** enter from the bus stop (bottom edge); exit through the gate (top) into the hub town.
- **Visual feedback:** sparkle on pick-up-able objects; latch slot glows when holding the right part; gate swings open with a creak and dust puff.

### 5.2 Caravan Road (L02)
- **Environment:** a winding valley road through orchards, a river ford, a bazaar edge, a pine slope and a hill shrine meadow — the terrain changes every 2 forks.
- **Landmarks:** caravan wagons (moving), fork signposts with three painted icons, a rest tent at every fork.
- **Interactive objects:** the three roads (walk up one to choose), the rest tent (rest instead of working), work objects at each stop (see L02).
- **NPCs:** Uncle Faraz (caravan driver); work hosts — the six makers, each hosting the same number of stops (see `CHARACTER_AND_NPC_DESIGN.md`); travellers.
- **Activities:** choose a road, do a short work moment, return to the caravan.
- **Missions:** main — reach town (10 forks); optional — none (to keep the choice pure).
- **Entry/exit:** from the opened Valley Gate; exits at the town square.
- **Feedback:** the caravan rolls forward one segment after each fork; the route line on the mini-map grows.

### 5.3 Town Workshop (L05 Workshop Orders)
- **Environment:** a busy workshop with a big order board, material shelves (wood planks, metal sheets, cloth rolls), a workbench, a coin box.
- **Interactive objects:** order cards (draggable), "today's bench" tray, material stacks that shrink as orders are planned, the bell (submit).
- **NPCs:** Nasreen Khala (festival quartermaster — a neutral host, see `CHARACTER_AND_NPC_DESIGN.md` §3), customers who collect finished goods.
- **Activities:** plan orders, submit, watch the goods get made.
- **Missions:** main — plan six days of orders; practice day first.
- **Entry/exit:** workshop door on the town square.
- **Feedback:** materials glow green when enough, red outline + icon when not enough; built goods stack up on the shelf for the festival.

### 5.4 Makers' Hall (L03)
- **Environment:** a long timber hall decorated for open day; six benches along the walls, each with its own colour, tools and host; a candle stand at the door holding ten candles (the time budget).
- **Interactive objects:** benches (start work), host NPCs (ask what the bench is about), the candle stand (see time left), the exit door (end the day), tool racks (tidy-up opportunity).
- **NPCs:** the six makers (Rabia, Dr Zoya, Danish, Usman, Sana, Ammar).
- **Activities:** six distinct work activities (L03), bonus round offers, revisiting.
- **Missions:** main — spend the day (at least 3 activities); optional — bonus rounds, extra steps, tidy tools.
- **Entry/exit:** main door from the town square; exit through the same door when done.
- **Feedback:** candles blow out as time is spent; bench host waves when you approach; finished work appears on a display wall.

### 5.5 Night camp (chapter break)
- **Environment:** meadow above the town at night, fire, stars, town lights below.
- **Interactive objects:** fire (sit — triggers the journal page and chapter-break save), Mehr, the partial map on a blanket.
- **Feedback:** stars appear one by one; the four collected map pieces glow.

### 5.6 Mehr's Map House (L06 Map Room)
- **Environment:** a tall room full of map scrolls, a globe, a big table with the torn map, a lamp.
- **Interactive objects:** the torn map (empty slot), tray of fragments, magnifier (hint), pin (submit).
- **NPCs:** Mehr; Chakor perched on the globe.
- **Missions:** main — restore six map sections (one practice first).
- **Entry/exit:** door on Hill Lane; leaving reveals the hill path to the aqueduct on the hub map.
- **Feedback:** the placed fragment snaps in; a correct fragment draws a route line to the next section.

### 5.7 Old Aqueduct (L07 Pattern Gate)
- **Environment:** a stone aqueduct across a gorge; a sluice gate with a row of carved stones and one empty socket; dry channel below.
- **Interactive objects:** stone cart (choose a stone), socket, turning wheel (submit), the gatekeeper's carving guide (hint).
- **NPCs:** none living — an old carved plaque "voice" (read aloud); Chakor.
- **Missions:** main — set six stones (one practice).
- **Entry/exit:** from the hill path; exit to the Fort road.
- **Feedback:** wheel turns; correct → a gush of water along the channel; incorrect → the stone glows, the rule is shown, and the builders' repair crew sets the right stone (story keeps moving).

### 5.8 Riverside Park (L04)
- **Environment:** a riverside park being prepared for the festival; six work sites around a central fountain; stalls, lantern lines, a stage.
- **Sites:** Repair yard (R), Survey hut by the pond (I), Design studio tent (A), Welcome & care tent (S), Sponsors' stall (E), Records & permits desk (C).
- **NPCs:** Mayor Saima; the six makers at their sites; festival visitors; a child who has lost her ribbon (research event).
- **Missions:** main — work 9 shifts across three phases; choose a role at the start and at each phase break.
- **Entry/exit:** park gate from the river road; exit to the Fort road at evening.
- **Feedback:** the park visibly fills up: bunting, lantern lines, crowd density increase per phase.

### 5.9 Old Fort & Lantern Vault (L08)
- **Environment:** an old stone fort on the northern ridge; a courtyard with a well; the vault passage with six iron doors, each with three code dials.
- **Interactive objects:** keeper's notes (clues), dials (swipe), lever (submit), lantern racks behind doors.
- **NPCs:** Baba Sher (retired keeper, appears at the end), Chakor.
- **Missions:** main — open six doors (one practice).
- **Entry/exit:** fort gate from the north road; exit leads straight into the festival night epilogue.
- **Feedback:** dials click; lever pull → bolts slide; lanterns inside light up as the player carries them out.

### 5.10 Rahwali Town (hub)
- **Districts:** Town Square (fountain, notice board with the quest log), Bazaar (tailor = cosmetic shop; tea stall), Makers' Street (Town Workshop, Makers' Hall), Hill Lane (Map House), River Road (to the park), North Road (to the Fort), Meadow (gate, night camp).
- **Purpose:** connective tissue, not a level. No assessment except optional curiosity spots (research only).
- **Optional content:** Chakor's 8 feathers (on main paths, visible); 6 curiosity spots (off-path, unrewarded, research only); tailor; notice board quest log.
