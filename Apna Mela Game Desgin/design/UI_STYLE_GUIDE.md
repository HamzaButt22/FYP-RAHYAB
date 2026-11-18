# APNA MELA — UI Style Guide ("Mela Pop")

| | |
|---|---|
| **Document** | UI_STYLE_GUIDE.md · v1.0 |
| **Visual reference** | `mockups/png/19_ui_kit.png`, plus all screen mockups |
| **Units** | Logical pixels on the 1920 × 1080 canvas, unless stated otherwise |

---

## 1. Visual direction

**Mela Pop**: a chunky, warm, confident casual-game look based on Pakistani **truck art**, school mela **bunting** and evening **string lights**.

| Principle | Rule |
|---|---|
| **Ink outlines** | Everything you can touch, and every character, has a **5 px Ink (#26214A) outline**. Small details use 3–4 px. Backgrounds use 5–6 px but are softer (blurred when behind UI). |
| **Candy depth** | Buttons and cards sit on a hard, offset "lip" shadow (no blur). This gives a physical, pressable feel without photographic realism. |
| **Warm, never white** | Panels use Cream (#FFF6E6). Pure white is reserved for speech bubbles and polaroids. |
| **One hero colour per screen** | The primary action is always Rani Pink. Other colours support it and never compete with it. |
| **Truck-art accents, used sparingly** | Diagonal stripes, scallops and dashed borders appear on frames, ribbons and headers, never behind text. |
| **Readable over decorative** | No text sits on patterns or busy art. When a scene sits behind UI it is blurred and dimmed to 55 % ink. |

---

## 2. Colour

### 2.1 Primary & secondary

| Token | Name | Hex | "Lip"/dark | Use |
|---|---|---|---|---|
| `pink` | **Rani Pink** (primary) | `#E8336D` | `#B81F51` | Primary buttons, logo ribbon, the player's T-shirt, selected hearts |
| `teal` | **Peacock Teal** (secondary) | `#11998E` | `#0B6F67` | Secondary buttons, ribbons for info screens, language pill, Hira's hijab |
| `yellow` | **Haldi Yellow** (accent) | `#FFC93C` | `#D99A0B` | Selection glow, rewards, lights, medallion rings, pause button |

### 2.2 Supporting colours (stall and character identity)

| Token | Name | Hex | Dark | Stall | Character |
|---|---|---|---|---|---|
| `orange` | Kesar Orange | `#FF8A3D` | `#D9621A` | Karigar Workshop | Zain |
| `blue` | Neel Blue | `#3B6FD8` | `#274FA6` | Jugnu Science Tent | Hira |
| `purple` | Jamun Purple | `#6C3FB5` | `#4D2A86` | Rang Mahal Art Stall · Twist tag · Diary | Sara |
| `green` | Mehndi Green | `#6BB548` | `#4A8A2E` | Madad Markaz Help Desk · success ticks | Bilal |
| `red` | Mirchi Red | `#E23B3B` | `#B02525` | Chatkhara Chaat Stall · destructive actions | — |
| `teal` | Peacock Teal | (above) | | Hisaab Ghar Ticket Office | Ustad Karim (accents) |

### 2.3 Neutrals & backgrounds

| Token | Hex | Use |
|---|---|---|
| `ink` | `#26214A` | Outlines, body text, lip shadows |
| `ink2` | `#5A537E` | Secondary text, captions |
| `cream` | `#FFF6E6` | Cards, panels, tertiary buttons |
| `parchment` | `#FBE8C8` | Screen backgrounds (with a radial gradient from cream) |
| `lilac` | `#E7E1F0` | Empty progress tracks, dividers |
| `disabled` | `#CFC8DA` (+ text `#8C85A3`) | Disabled controls |
| `scrim` | `rgba(27,23,51,.55)` | Overlay dimming |
| Sky · day | `#7FD0F5 → #E6F7FF` | Gameplay scenes |
| Sky · dusk | `#6E58C9 → #FFB37A` | Menu, summary |
| Sky · night | `#1F1A45 → #5A3C8C` | Diary, finale |

### 2.4 Contrast rules
- Body text is always **Ink on Cream or White** (≈ 14:1).
- White text is allowed **only at 28 px or larger, in bold weight**, and **only** on Pink, Teal, Blue, Purple or Red. It always has a 3 px ink drop shadow.
- **Yellow, Green and Orange surfaces always use Ink text.**
- *Exception:* single display letters of 54 px or larger (the reveal and results medallions) may be white on any stall colour, provided they have a 2–5 px ink outline or drop shadow.
- Colour is never the only signal. Stalls always show icon + name; selection always adds a lift, glow and check badge; disabled states also change the label or icon.
- **High-contrast mode:** removes background patterns and blur, makes panels pure white, increases outlines to 7 px, uses a solid 3 px ink outline as the focus ring, and turns the scrim up to 75 %.

---

## 3. Typography

| Role | Font | Weight | Size / line-height | Notes |
|---|---|---|---|---|
| Logo | Custom lettering (Baloo 2 base) | 800 | — | Supplied as an image asset, not live text |
| **H1** | Baloo 2 | ExtraBold 800 | 72 / 1.0 | Title cards |
| **H2** | Baloo 2 | 800 | 56 / 1.05 | Screen questions, diary statements |
| **H3** | Baloo 2 | 800 | 40 / 1.1 | Card titles, buttons (button sizes 36–76) |
| **Body L** | Nunito | Bold 700 | 34 / 1.35 | Dialogue (40 in the dialogue box), scenarios |
| **Body** | Nunito | SemiBold 600 | 28 / 1.4 | General text |
| **Caption** | Nunito | Bold 700 | 24 / 1.3 | **Minimum size for any text in the game** |
| Urdu display | Baloo Bhaijaan 2 | 700–800 | match the Latin size × 1.0 | Short labels, buttons |
| **Urdu body** | Noto Nastaliq Urdu | 400 / 700 | Latin size × 1.15, line-height **1.9** | All Urdu paragraphs and dialogue |

- **All fonts are SIL Open Font License**, so they can be bundled in `assets/fonts/`.
- Text scaling (Settings): ×1.0 / ×1.25 / ×1.5. Layouts must reflow; boxes grow vertically and are never clipped. Cards that would overflow at ×1.5 switch to a scroll area with a visible scroll hint.
- Maximum line length: 60 characters (English), about 45 (Urdu).
- Left-aligned (English) / right-aligned (Urdu). Centre alignment only for headings and single-line labels.
- No italics, no ALL-CAPS paragraphs (caps only for sign boards), no underlines except on links.
- **Implementation note (Pygame):** Urdu Nastaliq needs complex text shaping. Use **pygame-ce** built with SDL_ttf + HarfBuzz and set the script and direction on the font. Verify this in a technical spike before production (see Approvals). Fallback: Noto Naskh Arabic, which shapes more simply, or pre-rendered text for fixed UI labels.

---

## 4. Spacing & layout grid

| Token | px | Typical use |
|---|---|---|
| `s1` | 8 | icon-to-label gap |
| `s2` | 16 | inside chips, between bulbs |
| `s3` | 24 | gaps between tiles/cards |
| `s4` | 32 | card inner padding (small) |
| `s5` | 48 | screen safe margin (minimum), card padding (large) |
| `s6` | 64 | **standard safe margin** |
| `s7` | 96 | gaps between sections |

- **Safe area:** 64 px on all sides for interactive UI (the HUD may use 26–48 px from the top).
- **12-column grid:** column width 120, gutter 24, margin 96 (total 1920). Cards snap to whole columns.
- **Minimum touch target:** 96 × 96 (icon buttons 104). Minimum spacing between targets: 16.

---

## 5. Components

### 5.1 Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| **Primary** | Rani Pink | White, 3 px ink drop shadow | One per screen: the main forward action |
| **Secondary** | Peacock Teal | White | Other positive actions (Continue, Settings, Mela Board) |
| **Tertiary** | Cream | Ink | Back, Help, About, low-emphasis actions |
| **Reward / Story** | Haldi Yellow | Ink | Next (story), "See what it means" |
| **Diary** | Jamun Purple | White | "Write it down" |
| **Danger** | Cream + red outline | Mirchi Red | Delete data (the step-2 confirm is solid red) |
| **Disabled** | `#CFC8DA`, lip `#8C85A3` | `#8C85A3` | Before a selection is made |

**Anatomy:** height 92–156 px; corner radius 30 (XL: 40); outline 5 px ink; **lip shadow** 0 10 px 0 ink (XL: 14); top-half highlight (white 28 % over the upper 46 %); label in Baloo 2 800 at 36–76 px; optional icon (36–48 px) 18 px before the label; Urdu sub-label in Nastaliq at 55 % of the label size.

**States:**
| State | Change |
|---|---|
| Hover (mouse) | Brightness +6 %, lift −2 px |
| Pressed | Moves down 6 px, lip 10 → 4 px, scale 0.98 (80 ms) |
| Focused (keyboard) | 6 px dashed Haldi Yellow outline, 10 px offset |
| Disabled | Disabled colours, no lip movement, `sfx_ui_denied` on tap |

### 5.2 Icon button (IBtn)
104 × 104, radius 30, cream fill (pause is yellow), 5 px outline, 8 px lip, 56–60 px line icon with 7 px strokes.

### 5.3 Cards & panels
| Type | Spec |
|---|---|
| **Panel card** | Cream, radius 36, 5 px ink outline, drop shadow 0 14 0 `rgba(38,33,74,.28)` |
| **Choice card** (What/How) | Panel card. Rest state rotated −2°/0°/+2° (What). **Selected:** straightens, lifts −24 to −30 px, 12 px Haldi glow ring, green check badge (84 px) at the top-right corner |
| **Stall card** | Panel card with a 140 px header in the stall colour, separated by a 5 px ink line |
| **Ribbon** | Coloured block, radius 18, 5 px outline, 8 px lip, white H2/H3 text. Used as screen titles, overlapping the top edge of the card by about 40 px |
| **Speech bubble** | White, radius 34, 5 px outline, 10 px soft-ink lip, name tag (in the speaker's colour) overlapping the top-left by −34 px |
| **Pill** | Cream, radius 999, 4 px outline, 6 px lip. HUD counters, chips, small status |
| **Polaroid** | White, 4 px outline, 16 px frame (40 px at the bottom for the caption), pink push-pin, rotated −4°…+4° |

### 5.4 Controls
- **Toggle:** 120 × 64 track (green = on, lilac = off), 48 px white knob with a 4 px outline.
- **Slider:** 22 px track with a teal fill, 56 px yellow knob with a 5 px outline and 5 px lip.
- **Text field:** white, radius 22, 5 px outline, 36 px text, 4 px ink caret.
- **Hearts:** 150 px; filled = Pink with a white shine; empty = White.
- **Stepper:** 52 px circles (done = green + check, current = yellow, upcoming = white), connected by 30 px ink dashes, with labels.
- **Diary stamps:** circles that grow in size from left to right (70 → 94 px); selected = purple fill + yellow ring.

---

## 6. Iconography

- **Style:** rounded line icons on a 100 × 100 grid, 7 px stroke, round caps and joins, Ink colour; filled versions only for stall icons.
- **UI set:** settings (gear), sound, music, pause, back, next, close, map, book (diary), board, check, lock, info, help, globe, trash, save, home, text-size, motion, contrast, voice, screen, camera, star, diya.
- **Stall icons** (shown in a coloured disc): Karigar = wrench · Jugnu = flask · Rang Mahal = brush · Madad = heart · Chatkhara = chaat bowl · Hisaab = ticket.
- **Job illustrations** (What cards): 60 neutral spot illustrations, in a 220 px circle on a warm cream background. **These never use stall colours or stall icons.**
- **Sizes:** 24 (inline), 36–48 (inside buttons), 56–60 (IBtn), 100 (medallion).

---

## 7. Borders, shadows & depth

| Layer | Outline | Shadow |
|---|---|---|
| Background scenery | 5–6 px ink | none |
| Characters | 5 px ink (scaled with the character) | soft ellipse on the ground (ink at 18 % opacity) |
| Cards / panels | 5 px | 0 14 0 ink @ 28 % |
| Buttons | 5 px | 0 10 0 ink (solid) |
| Pills / chips | 4 px | 0 6 0 ink @ 30 % |
| Overlays | — | scrim 55 % + 6–8 px background blur |
| Glow (selection, reward) | — | 12 px solid ring `#FFC93C` + 60 px soft glow `rgba(255,224,122,.8)` |

No gradients on UI apart from the button top highlight, progress bars (yellow→orange) and the sky.

---

## 8. Motion

### 8.1 Tokens
| Token | Duration | Easing | Use |
|---|---|---|---|
| `tap` | 80 ms | easeOutQuad | Button press |
| `fast` | 120–160 ms | easeOutCubic | Highlights, stamp |
| `base` | 240 ms | easeOutCubic | Fades, small moves |
| `pop` | 320 ms | easeOutBack (1.4) | Overlays and cards appearing |
| `slow` | 400–500 ms | easeInOutCubic | Screen wipes, book opening |
| `celebrate` | 900 ms | easeOutElastic (light) | Medallion reveal, day complete |

### 8.2 Catalogue
| Animation | Spec |
|---|---|
| Screen transition | Bunting wipe, 450 ms |
| Card deal-in | From +120 px y and 0 opacity, staggered 60 ms, `pop` |
| Card select | Lift −30 px, rotate to 0°, glow ring fades in (160 ms) |
| Confirm stamp | A "PAKKA!" stamp drops from scale 1.6→1 with a 2 px screen nudge (60 ms) |
| Light earned | Diya particle travels a bezier path to the HUD (500 ms); the counter pops |
| Character idle | Breathing: scaleY 1→1.015, 2.4 s sine loop · blink every 3–5 s (120 ms) |
| Character talk | Mouth alternates talk/smile at 8 fps while text types |
| Hudhud | Crest flutter (6 frames, 12 fps) on each reaction · fly cycle (8 frames) · hop (squash and stretch) |
| Ambient | Bunting sway ±3° (3 s) · lights twinkle · Ferris wheel 1 rev/40 s |
| Fireworks | Up to 3 bursts at a time, at most 3 flashes per second, no full-screen flash |

### 8.3 Reduce Motion
All movement-based transitions are replaced with 200 ms opacity fades. Turned off entirely: idle bobbing, screen nudges, particles, parallax, the camera flash and fireworks movement (the fireworks are replaced by a static glow). Blinking and talking mouths stay.

---

## 9. Responsive layout (Pygame)

- **Logical canvas:** 1920 × 1080. All UI is laid out in logical coordinates and then **scaled uniformly** to the largest 16:9 rectangle that fits the window (`scale = min(w/1920, h/1080)`).
- **Letterboxing:** any extra space is filled with a tiled bunting pattern on night-purple (`ui_letterbox_tile.png`) rather than plain black.
- **Supported windows:** 1280 × 720 (×0.667) up to 3840 × 2160 (×2). Below 1280 × 720 the game shows S30-D.
- **Assets:** authored at **1× logical size** (and optionally @2× for 4K, see ASSET_MANIFEST). Scale down with smooth scaling and cache scaled surfaces per resolution. Never scale every frame.
- **Text** is rendered at the final pixel size (font size × scale), not scaled as a bitmap, so it stays sharp.
- **Input:** mouse and touch coordinates are converted from window space back to logical space before hit-testing.
- **Text scale ×1.25 / ×1.5:** containers grow vertically. Choice cards keep the same width and their text area grows. When content would overflow, card heights expand and the confirm button moves down (the minimum gap of 24 px is kept).
- **RTL mirroring (Urdu):** horizontally mirror layouts defined as left/right anchor pairs. Exceptions that never mirror: the logo, numbers, the progress direction of bars (they still fill from the start edge, which is the right side in Urdu), and character art (characters keep their art, only their positions swap).
