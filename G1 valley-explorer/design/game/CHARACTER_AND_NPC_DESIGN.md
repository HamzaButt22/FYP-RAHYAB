# Character and NPC Design

**Version:** 1.0 design proposal · 19 Nov 2026

---

## 1. The player character — "the Rahyaab"

| Aspect | Design |
|---|---|
| Identity | A young pathfinder, the student's own age. Always addressed as **"Rahyaab"**. **No name entry** — the game never asks for a real name (privacy rule; the host app already has a pseudonymous ID). **[D]** |
| Silhouette | Chibi-proportioned (head ≈ 1/3 of height) so the character reads clearly at 40–64 px tiles; carries a satchel with the journal. |
| Movement | 4-direction walk with a 2-frame walk cycle and a facing pose for each direction (existing `Avatar.tsx` has front/back/side) |
| Customization at start | **Style** (existing: headscarf, braid, short hair, cap — add *dupatta over braid* and *topi*) · **Skin tone** (existing 3 → **5 tones**) · **Outfit colour** (6, 2 free at start). The first style shown is **randomised** so no style is the default. **[D]** |
| Customization later | Coins buy cosmetic items at the Bazaar tailor: outfit colours, caps, scarves, a festival lantern pin, Chakor's feather scarf (from feathers). Nothing affects gameplay. |
| Emotes | Short reaction animations on events: jump on mission complete, head-scratch on a wrong puzzle answer (neutral, not sad), wave when an NPC greets. |

**Accessibility:** the avatar is never the only indication of state — the HUD and sounds say the same thing.

## 2. Companion — Chakor

| Aspect | Design |
|---|---|
| What | A chukar partridge (Pakistan's national bird) that follows the player one tile behind and hops onto objects. |
| Function | **Hint and help channel without text walls:** points (hops onto) the next objective after ~20 s of no progress in tutorial scenes; gives puzzle hints when the student taps the hint feather; announces controls in the tutorial. |
| Voice | Chirps + a short text line (always read aloud). Chakor never comments on choices ("Good choice!") in interest levels — it only helps with *how*, never *what*. **[D]** |
| Assessment neutrality | Chakor never walks toward an interest option, never hops onto a bench or road, and is hidden during forced-choice moments to avoid nudging. |

## 3. Neutral guide characters (no work type)

These characters carry the story. They are deliberately **not** linked to a RIASEC type so that liking them cannot bias interest choices.

### Ustad Mehr — the mapmaker (mentor)
- **Look:** elderly man, white beard and hair, round glasses, teal waistcoat over a cream kurta, a rolled map under one arm (consistent with the existing `UstadMehr` icon).
- **Personality:** warm, curious, a little forgetful; treats the player as a capable helper.
- **Function:** gives the quest, runs the tutorial, hosts the Map Room, opens every journal moment, gives the final reflection.
- **Speech style:** short, encouraging, never evaluative about choices. "Let's see where this goes."

### Uncle Faraz — caravan driver
- **Look:** middle-aged man, flat Chitrali cap, sleeveless jacket, driving a painted wagon (truck-art inspired patterns).
- **Function:** drives the caravan in L02; says "Pick any road — I'll wait for you" at every fork. Does not host any work.

### Nasreen Khala — festival quartermaster
- **Look:** woman in her fifties, dupatta, reading glasses on a cord, clipboard.
- **Function:** hosts **Workshop Orders** (L05) at the town's shared workshop. Chosen as a neutral host so that the R maker (Rabia) does not get extra screen time before the Makers' Hall. **[D]**

### Mayor Saima — festival organiser
- **Look:** woman in her forties, shawl with festival pin, megaphone.
- **Function:** runs Riverside Park (L04): explains phases, offers the role choice, announces phase changes. Deliberately neutral about roles: "Every role keeps the festival going."

### Baba Sher — retired vault keeper
- **Look:** very old man, long coat, big ring of (useless) old keys.
- **Function:** author of the clue notes in L08; appears at the end to thank the player and hand over the last map piece.

### Noor — a lost child (research event, L04)
- **Look:** small girl with a festival ribbon missing from her hair, holding a balloon.
- **Function:** optional costly-helping event (research only, `BIG_FIVE_ASSESSMENT_DESIGN.md` §4, indicator A-1). She is placed on the path *between* sites, not at a site, so she is not part of any RIASEC option.

## 4. The six makers (work hosts)

One maker represents each kind of work. They host work moments in the Caravan, the benches in the Makers' Hall and the sites in Riverside Park.

**Design rules (assessment neutrality) [D]:**
1. **Equal exposure:** each maker appears the same number of times, with the same number of lines, before and during interest levels.
2. **Equal warmth:** all six are friendly, competent, and thank the player in the same way. No maker is funnier, younger or more "cool" than the others; this is checked in the expert review (Study B).
3. **Counter-stereotyped gender assignment** for the most gender-typed areas (Realistic and Social show large sex differences in interests; Su, Rounds & Armstrong, 2009 [E]): a woman hosts mechanical work, a man hosts caring/teaching work.
4. **Work first, person second:** the choice UI shows the *work icon and verb* large and the maker small, so students choose the work rather than the person.
5. Makers' appearances are balanced in age (late 20s to 50s), and none is a celebrity look-alike.

| Code | Maker | Look | Work they host | Signature line |
|---|---|---|---|---|
| **R** Realistic | **Rabia** — mechanic & carpenter | Woman, early 30s, headscarf tied back, overalls with rolled sleeves, tool belt | Fixing wheels, pumps, benches; assembling parts | "Let's get this working again." |
| **I** Investigative | **Dr Zoya** — valley scientist | Woman, 40s, lab coat over shalwar kameez, notebook, magnifier | Testing water, comparing plants, finding why things happen | "Let's find out why." |
| **A** Artistic | **Danish** — muralist & designer | Man, late 20s, paint-stained kurta, sketchbook, colourful scarf | Painting banners, designing posters and stage decorations | "Let's make it beautiful." |
| **S** Social | **Usman** — teacher & community helper | Man, 30s, sweater vest, warm smile, carries tea flask | Helping tired travellers, tutoring a younger student, welcoming visitors | "Let's make sure everyone's okay." |
| **E** Enterprising | **Sana** — bazaar trader & organiser | Woman, 30s, smart jacket over kameez, phone, festival badge | Persuading sponsors, recruiting helpers, running a stall | "Let's get people on board." |
| **C** Conventional | **Ammar** — record keeper | Man, 50s, waistcoat, ledger, pencil behind ear | Sorting cargo, filing forms, scheduling | "Let's get it in order." |

### Maker presence by level

| Level | Rabia (R) | Zoya (I) | Danish (A) | Usman (S) | Sana (E) | Ammar (C) |
|---|---|---|---|---|---|---|
| L01 Valley Gate | Signboard only | Signboard only | Signboard only | Signboard only | Signboard only | Signboard only |
| L02 Caravan | 5 offers | 5 offers | 5 offers | 5 offers | 5 offers | 5 offers |
| L03 Makers' Hall | 1 bench | 1 bench | 1 bench | 1 bench | 1 bench | 1 bench |
| L04 Riverside Park | 1 site | 1 site | 1 site | 1 site | 1 site | 1 site |
| Night camp / Epilogue | Waves | Waves | Waves | Waves | Waves | Waves |

## 5. Background characters

Festival visitors, bazaar shoppers, children flying kites, an old couple on a bench. They have one-line idle barks ("The festival is back!") and no interaction that affects evidence. Their density increases through Chapter 2 to show progress.

## 6. Dialogue system rules

| Rule | Reason |
|---|---|
| ≤ 15 words per bubble, ≤ 3 bubbles in a row | Reading load (`GAME_VISION.md` §5) |
| Every line has audio read-aloud **[A]** | Weaker English readers |
| NPCs speak in plain international English, no idioms (except glossed journal items) | Comprehension |
| No NPC praises a choice of work; thanks are identical in structure across types | Avoid nudging interest |
| Puzzle feedback never uses "wrong" or "fail" | Existing tone rule |
| Speaker portrait + name on every bubble | Who is speaking is clear without reading |

## 7. Art notes per character

See `VISUAL_ART_DIRECTION.md` §5 for proportions, outline weights and palette. Each NPC has: a world sprite (4 directions not needed — NPCs face the player), a bust portrait (96 px) for dialogue, and 2 idle animations (blink, small gesture).
