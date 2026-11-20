# Visual Art Direction

**Version:** 1.0 design proposal · 19 Nov 2026
**Concept mockups (original, not final art):** `mockups/01_hub_world.svg`, `02_makers_hall_pump.svg`, `03_journal_page.svg`, `04_path_map_results.svg` (PNG renders beside them). **Baseline of the current build:** `mockups/00_current_build_baseline.png`.

---

## 1. Direction in one line

> **"A storybook map of a Pakistani mountain valley you can walk around in."** Flat vector shapes with soft shading, warm daylight, hand-drawn map details, and decorative borders inspired by Pakistani folk and truck-art patterns — polished like a 2D adventure game, never like a worksheet.

### Keywords
Warm · readable · handmade · hopeful · local · uncluttered.

### What to avoid
Clip-art icons on white cards; cartoon babyishness; photo-realism; dark or dangerous moods; copyrighted characters or recognisable game styles; religious or political symbols; real brand logos; real places or people.

## 2. Visual references (described, not copied)

| Reference type | What to take from it |
|---|---|
| Northern Pakistani valley landscapes (poplars, apricot blossom, stone-and-timber houses with carved wooden balconies, glacier streams) | Environment shapes, seasonal colour (spring) |
| Pakistani truck art and folk embroidery | Border patterns for UI frames, the caravan wagon, festival bunting — used as *pattern language*, simplified to 2–3 colours |
| Hand-drawn exploration maps | The Path Map, quest map, map pieces |
| Cosy top-down 2D adventure games (genre convention) | Readable tiles, chunky characters, clear interaction highlights |

Artists must create **original** designs; no tracing or close imitation of any existing game, illustrator or brand. **[D]**

## 3. Colour palette

### 3.1 UI tokens (existing `ui/theme.ts`, kept)
| Token | Hex | Use |
|---|---|---|
| parchment | `#F6EFE3` | App background |
| surface | `#FFFFFF` | Cards, sheets |
| ink / inkMuted | `#1F2A2E` / `#52626A` | Text |
| primary / primaryDark / primarySoft | `#1F7A6D` / `#145A50` / `#D7EDE8` | Main buttons, D-pad, success of progress |
| accent / accentSoft | `#D9822B` / `#FBE6D0` | Action button, objective "!", highlights (**dark text `#2B1A08` on accent**) |
| success / caution | `#2E7D4F` / `#9A5B0B` | Status pills |
| border, locked | `#E4D9C6`, `#A7B0B4` | Lines, locked stops |

Measured contrast: ink on parchment ≈ 12.9:1; white on primary ≈ 5.2:1; ink on accent ≈ 5.0:1 (WCAG AA for text).

### 3.2 World palette (existing tokens + additions)
| Element | Colours |
|---|---|
| Sky / snow | `#CDE8EC`, `#FFFFFF` |
| Grass / hills | `#8FC195`, `#5E9B6E` |
| Mountains / stone | `#9AA8B5`, `#7E8790`, `#5E6770` |
| Water | `#6FB3D2` (+ white wave hatching — water is never colour-only) |
| Paths / sand | `#E9D3A8` |
| Timber / roofs | `#C9A97E`, `#8A5A3B`, `#7A5A3A` |
| Blossom accents | `#F2B8C6`, `#FFFFFF` |
| Night (Night camp, epilogue) | `#2F3E46`, `#1F2A2E`, lantern glow `#F3C089` |

### 3.3 Work-type colours (RIASEC) — **equal lightness** **[D]**
Used for signposts, bench cloths, site flags and activity headers. They are tuned to the same perceptual lightness (CIE L\* 54–58) so that no option "pops" more than another (`RIASEC_ASSESSMENT_DESIGN.md` §7, visual salience). Each also has its own icon, so colour is never the only cue.

| Type | Hex | L\* | Icon |
|---|---|---|---|
| R | `#9A7B5E` (timber brown) | 54 | wrench |
| I | `#4F86C2` (lake blue) | 55 | magnifier |
| A | `#B66BA8` (blossom purple) | 55 | brush |
| S | `#D2704F` (clay coral) | 58 | open hands |
| E | `#A58A2C` (brass gold) | 58 | megaphone |
| C | `#3F9283` (ledger teal) | 55 | folder |

The current build's task tints range from L\* 56 to 68 (E and S noticeably brighter); these replacements remove that difference.

## 4. Typography

| Role | Spec |
|---|---|
| Typeface | Platform system font (Roboto on Android) by default — no download, best rendering on low-end devices. Optional: one rounded display face under the SIL Open Font License for titles only (e.g., Nunito) **[A]** (adds ~100–200 KB) |
| Scale (existing) | display 28/34 bold · title 21/27 · subtitle 17/23 · body 16/23 · small 14/19 · label 13/17 caps-spaced |
| Settings | 100% / 125% / 150% text size; layouts must reflow without clipping at 150% |
| Rules | Sentence case; no all-caps sentences; numbers as digits; ≤ 15 words per speech bubble |

## 5. Character design

| Aspect | Spec |
|---|---|
| Proportions | "Chibi" 2.5–3 heads tall; big readable faces; simple shapes |
| Outline | 2 px dark outline (`#1F2A2E` at 70%) on characters and interactive objects; none on background — separates "things you can use" from scenery |
| Player | 4 directions × (idle, 2-frame walk); 5 skin tones; 5 hair/headwear styles; 6+ outfit colours; accessories layer (cap, scarf, ribbon, lantern pin) |
| NPCs | Distinct silhouettes (Mehr: long coat + map roll; Rabia: tool belt; Zoya: lab coat; Danish: scarf + sketchbook; Usman: sweater vest + flask; Sana: jacket + badge; Ammar: waistcoat + ledger; Saima: shawl + megaphone; Baba Sher: coat + key ring; Faraz: cap + wagon) |
| Portraits | 96 px busts for dialogue, same framing and background for all makers (equal attractiveness) |
| Animation | Idle blink every 3–5 s; one gesture per NPC; reactions (wave, nod) identical across makers |
| Clothing | Everyday Pakistani clothing (shalwar kameez, kurta, dupatta, waistcoats, caps) mixed with work wear; modest; no religious or political insignia |

## 6. Environment design

| Aspect | Spec |
|---|---|
| Perspective | Top-down 3/4 ("front-facing walls") tile view, consistent everywhere |
| Tile size | Rendered at screen width ÷ 9 (≤ 64 px); art authored at 64 px |
| Layering | Ground → paths → decorations → objects (with outline) → characters → labels → UI |
| Readability | Walkable ground light and low-detail; blockers (trees, walls, water) darker or patterned; interactive objects outlined and gently animated |
| Time of day | Chapter 1 morning → midday; Night camp night; Chapter 2 morning → evening (Park) → night (epilogue) |
| Density | Max 3 decorative objects per 3 × 3 tiles near interaction points (avoid clutter) |

## 7. Object design

| Category | Style rule |
|---|---|
| Interactive objects | Outlined, slightly saturated, idle "breathing" scale 1.0–1.03 when within 2 tiles |
| Pick-up items | Float 2 px with a sparkle every 2 s |
| Slots/targets | Dashed outline; glow (`#F3C089`) when the correct item is near |
| Puzzle pieces | Clean, high-contrast: map fragments land sand/water with hatching; carved stones with engraved shapes (solid = filled, outline = engraved line); dials with large numerals |
| Collectibles | Feathers (coral/brown), map pieces (torn parchment) |

## 8. Buttons and controls

| Control | Spec |
|---|---|
| D-pad | Four rounded squares (56–64 dp) in primary teal, white arrows; pressed state primaryDark |
| Action button | Orange circle ≈ 116 dp with a light ring, dark text; disabled = grey "Action" |
| Primary button | Teal fill, white text, 52 dp tall, radius 16 |
| Secondary | White fill, border, ink text |
| Accent (rare) | Orange fill with dark text (e.g., "Start the adventure") |
| Ghost | Text-only teal (e.g., "Skip this sentence") |
| States | Pressed scale 0.96; disabled 50% opacity **plus** label explaining why where relevant ("Finish (do 2 more steps)") |

## 9. HUD
- Top bar 56 dp: pause (left), place name + one-line objective, coins, stamps, map (right).
- No timers, no health, no score.
- Carry slot appears under the HUD when carrying an item.
- In levels, the sub-line shows level-specific state (candles left, fork 3 of 10, puzzle 2 of 6, shift 2 of 3).

## 10. Dialogue boxes
- Speech bubble with tail pointing at the speaker; white, radius 16, 2 px border; portrait circle on the left; name in bold small caps; text 16 px; replay-audio icon.
- Off-screen speaker → bottom card version.
- Chakor's lines use a smaller, round bubble with a feather icon.

## 11. Mission indicators
- **"!"** bouncing orange marker above the next objective (existing).
- **Path glow:** dashed light-orange line on the ground toward the objective (toggle in settings).
- **Locked:** padlock badge + friendly blocker in the world ("Opening soon" ribbon).
- **Done:** green check stamp on buildings; journal stamp.
- **Quest card:** small card under the HUD for 3 s when a mission updates ("Fix the latch 2/3").

## 12. Reward animations

| Reward | Animation (≤ 1.5 s, reduced-motion = fade) |
|---|---|
| Coins | Coin icons arc into the HUD counter, counter ticks up |
| Activity finished | Finished object pops onto the display wall/park with a bounce |
| Map piece | Torn parchment piece flies into the map icon, map icon shimmers |
| Stamp | Journal opens, stamp thumps with ink splash |
| Puzzle correct | Environmental: water rushes, door swings, route ink draws |
| Cosmetic unlocked | Outfit swatch sparkles in the tailor |

All work types and all puzzle outcomes share the same reward animation set (fairness).

## 13. Level completion screen (S15)
Journal page view: stop name in the header banner, stamp in ink, map piece joining the map, "+20 coins", one sentence of story ("The valley road is on your map!"), **Continue** to the journal rest spot. Same layout for all stops; only the stamp and map piece differ.

## 14. Production notes
- Format: SVG source → optimised PNG sprite sheets (or `react-native-svg` for simple shapes, as now). Keep total art ≤ 15 MB in the app bundle.
- Every asset has an owner and licence record (original work or CC0/OFL with attribution).
- Art review checklist: equal salience of options (work-type colours, sizes), counter-stereotyped NPCs, readable at 360 dp width, colour-blind simulation (deuteranopia/protanopia/tritanopia) passes.
