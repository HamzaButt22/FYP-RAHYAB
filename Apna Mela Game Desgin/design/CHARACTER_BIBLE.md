# APNA MELA — Character Bible

| | |
|---|---|
| **Document** | CHARACTER_BIBLE.md · v1.0 |
| **Visual reference** | `mockups/png/18_character_lineup.png` (height chart + expressions), plus every screen mockup |
| **Rule zero** | Each character looks **identical on every screen**: the same silhouette, colours, outline weight and props. Variation comes only from the approved poses and expressions listed here. |

---

## 1. Shared style rules

| Property | Spec |
|---|---|
| **Proportion (teen characters)** | Chibi, **≈ 2.6 heads tall**. Head diameter = 37 % of standing height. Body (shoulders to hem) ≈ 34 %. Legs ≈ 20 %. |
| **Proportion (Ustad Karim)** | ≈ 3 heads tall; standing height **1.12 ×** a teen. |
| **Outline** | 5 px Ink `#26214A` at the reference height (900 px teen). It scales with the character but never goes below 2 px on screen. |
| **Shading** | Flat colour with **one** highlight shape on hair or clothing (white at 25–50 % opacity). No gradients on skin. |
| **Face** | Two tall oval eyes (ink, with a white catch-light at the upper right), short curved brows, pink cheek blush (`#FF8FA3` at 65 %), simple mouth. Small round nose shown only from the side (never in front views). |
| **Hands** | Simple rounded mitts (no separate fingers) in skin tone, outlined. |
| **Volunteer lanyard** | Teal V-shaped strap + **pink ID badge** with two white lines, worn by all four student NPCs. The player instead has a **yellow star on the pink T-shirt**. |
| **Ground shadow** | An ink ellipse at 18 % opacity, 70 % of the character's width. |
| **Facing** | The default art faces ¾ toward the viewer. Mirroring is allowed for every character (props keep their side when mirrored, apart from Hira's clipboard). |
| **Skin tones** | s1 `#F6D2AE` · s2 `#E7B48A` · s3 `#C98B5A` · s4 `#96603D` |

### 1.1 Shared expression set (all humans)
| Key | Eyes | Brows | Mouth | Use |
|---|---|---|---|---|
| `smile` | Open ovals | Soft arches | Small smile curve | Default / listening |
| `happy` | Closed upward arcs ^ ^ | Raised | Open grin with tongue | Celebration, waving |
| `talk` | Open | Soft arches | Small open oval | Alternates with `smile` while speaking |
| `wow` | Taller ovals | High arches | Round open "o" | Surprise, amazement |
| `think` | Open, looking up | One raised, one flat | Flat slanted line | Thinking, puzzles |
| `worried` | Open | Tilted inward (sad) | Wavy downturned curve | Problems, twists |

Plus a **blink** frame (eyes become ink arcs) for each character.

### 1.2 Shared poses (body layers)
| Key | Description |
|---|---|
| `idle` | Arms relaxed at the sides |
| `wave` | Right arm raised high, hand beside the head |
| `point` | Right arm out to the side, pointing toward the screen centre |
| `think` | Right hand on chin |
| `busy` | Both hands forward at chest height, holding the job prop or tool (used in Loved-it vignettes) |
| `cheer` | Both arms up, a small jump (finale only) |

**Production method:** characters are assembled from layers: `body_<pose>` + `face_<expr>` (+ `prop`). The face layer is anchored at the head pivot. This gives 6 poses × 6 expressions without having to draw 36 full images.

---

## 2. Hudhud — the hoopoe guide

| | |
|---|---|
| **Role** | Narrator and guide. Keeps the private diary. Presents the final reveal. Speaks only to the player. |
| **Personality** | Old, wise, warm and a little vain about his crest. Speaks gently, sometimes in rhyme, with occasional Urdu poetry. Never judges, never hurries the player. |
| **Voice (if voiced)** | Mid-low, warm, slightly theatrical. Calls the player "dost" (friend). |
| **Silhouette** | A round cinnamon body, a **fan crest of 5 feathers with ink tips**, a long thin curved beak, black-and-cream striped wing and tail. |
| **Proportions** | Body ellipse 1.35 : 1. Head 0.6 × the body height. The beak is 1.1 × the head diameter. Standing height ≈ 0.45 × a teen character (on the ground); shown larger when he's the focus. |
| **Colours** | Body/crest `#F0A35E` cinnamon · wing/tail stripes Ink `#26214A` + Cream `#FFF6E6` · beak `#4A3F55` · cheek blush `#FF8FA3` · **golden round spectacles** `#D99A0B` |
| **Signature props** | Tiny round **golden spectacles** (always) · a **pink diary satchel** (pink cover, yellow spine) on a **teal strap** across the body (always, except in the finale, where the diary is open in his wings). |
| **Expressions** | `smile`, `happy` (eye closed upward, beak open), `talk` (beak open), `wow` (crest fully raised), `think` (crest drooped, eye looking up), `worried` (crest flat). |
| **Animations** | `idle` (breathing + blink + an occasional head tilt) · `crest_flutter` (6 frames) · `hop` · `fly` (8-frame flap cycle, wings up/down) · `write` (holding a quill, 6 frames, used in the diary) · `present` (wings open, diary glowing; finale). |
| **Never** | Wears other clothes, changes colour, appears without spectacles, or is shown as aggressive. |

## 3. Zain — Day 1 buddy

| | |
|---|---|
| **Age / role** | 15 · the player's friend · tutorial guide on Day 1 |
| **Personality** | Energetic, loyal, talks fast, full of ideas, says "yaar". Gets things moving. |
| **Silhouette** | **Spiky black hair** (7 spikes, slightly messy); slim. |
| **Outfit** | **Kesar Orange** zip hoodie (`#FF8A3D`) with a darker orange hem line and white drawstrings; **blue jeans** (`#3B6FD8`); white sneakers; volunteer lanyard. |
| **Skin / hair** | s2 `#E7B48A` · hair `#2B2238` |
| **Signature colour** | Orange (name tag, ribbon) |
| **Default pose / expression** | `point` / `talk` (when guiding); `wave` / `happy` (menus) |
| **Animation notes** | Bounces more than the others (idle amplitude ×1.3); uses big gestures. |

## 4. Hira — Day 2 buddy

| | |
|---|---|
| **Age / role** | 16 · head of the mela committee |
| **Personality** | Organised, caring, a little anxious, quietly funny. Loves a checklist. |
| **Silhouette** | **Teal hijab** framing the face and draping over the shoulders; **round glasses**; carries a **clipboard** in her left hand. |
| **Outfit** | **Neel Blue** kameez (`#3B6FD8`) with a yellow trim line near the hem; cream shalwar (`#F4F0E6`); pink shoes; lanyard over the hijab drape. |
| **Skin** | s1 `#F6D2AE` · hijab `#11998E` with a white highlight arc |
| **Signature colour** | Blue (name tag) |
| **Props** | Clipboard (brown board, white paper, grey clip) — present in every pose except `think` (where her hand is on her chin and the clipboard is tucked under her arm). |
| **Animation notes** | Pushes her glasses up in `think`. Flips through the clipboard in idle (every 8 s). |

## 5. Bilal — Day 3 buddy

| | |
|---|---|
| **Age / role** | 14 · youngest volunteer · gives the stage announcement |
| **Personality** | Funny, kind, always snacking. Hides his nerves with jokes. |
| **Silhouette** | **Big round curly hair** (cloud of 7 curls); **wider, rounder body** (body width ×1.12, head radius ×1.03). |
| **Outfit** | **Cream kurta** (`#FFF6E6`) with **Mehndi Green waistcoat** (`#6BB548`, two front panels, 2 ink buttons); cream shalwar; brown sandals/shoes (`#8B5A3C`); lanyard. |
| **Skin / hair** | s3 `#C98B5A` · hair `#1E1A2E` |
| **Signature colour** | Green |
| **Props (optional)** | A paper cone of chana (idle variant only — never in finale or results). |
| **Animation notes** | Laughs with the shoulders (a squash and stretch loop). In `worried` he fidgets. |

## 6. Sara — Day 4 buddy

| | |
|---|---|
| **Age / role** | 15 · the mela photographer (her photos fill the Mela Board) |
| **Personality** | Sporty, curious, upbeat, notices details. "Smile — no, a real smile!" |
| **Silhouette** | **High ponytail** swinging behind the head with a **yellow hair tie**; a **camera** at hip level on a diagonal **yellow strap**. |
| **Outfit** | **Jamun Purple** track jacket (`#6C3FB5`) with a centre zip line; dark trousers (Ink); **yellow sneakers**; lanyard. |
| **Skin / hair** | s2 `#E7B48A` · hair `#3B2418` (dark brown) |
| **Signature colour** | Purple |
| **Props** | Camera (dark body `#3A3566`, light-blue lens, pink shutter button) — always present. |
| **Animation notes** | `photo` pose (both hands raising the camera to her eye) + a flash (disabled with Reduce Motion). Her ponytail swings on turns. |

## 7. Ustad Karim — teacher in charge

| | |
|---|---|
| **Age / role** | Mid-50s · mela organiser · opens and closes each day; Day 5 companion |
| **Personality** | Warm, theatrical, quotes Ghalib and Iqbal (short, attributed lines from public-domain classics only), secretly sentimental. Firm but never scary. |
| **Silhouette** | Taller (1.12 ×); **grey karakul cap**; **neat white-grey beard**; round gold-rimmed **glasses**. |
| **Outfit** | **White shalwar kameez** to below the knee; **brown waistcoat** (`#8A5A3B`) with a yellow pocket square and a pink pen in the breast pocket; brown shoes (`#6B4226`). |
| **Skin** | s3 `#C98B5A` · beard/moustache `#D9D4E2` · cap `#5C4A3A` |
| **Signature colour** | Teal (name tag) with brown |
| **Animation notes** | Gestures with an open palm (`point`). Strokes his beard in `think`. Wipes a tear with a handkerchief at the closing ceremony (one-off). |

## 8. The player avatar (8 presets)

| ID | Skin | Hair / head | Extras |
|---|---|---|---|
| A1 | s2 | Short, dark | — |
| A2 | s1 | Long, brown, fringe with a centre part | — |
| A3 | s3 | Curly, dark | — |
| A4 | s2 | **Hijab, white** `#F2F0EA` | — |
| A5 | s4 | Short, dark | Glasses |
| A6 | s3 | Bun, dark | — |
| A7 | s1 | Spiky, light brown | — |
| A8 | s4 | **Hijab, purple** `#6C3FB5` | — |

- **Fixed uniform:** **Rani Pink Mela Volunteer T-shirt** (`#E8336D`) with a **yellow 5-point star** on the chest; dark trousers (`#3A3566`); white sneakers. There is **no lanyard**, which keeps the player distinct from the NPCs.
- **The avatar never speaks** (no voice lines, no speech bubbles). It reacts with expressions only.
- **Poses needed:** idle, wave, think, busy (with the job prop), cheer, walk (4-frame cycle for the map).
- **Map sprite:** the same design at 190 px tall with a pink location marker above.

---

## 9. Consistency checklist (art review)

- [ ] The outline is exactly 5 px at the reference size; colours match the hex values above (check with an eyedropper).
- [ ] The head-to-height ratio is within ±3 % of the spec.
- [ ] Signature props are present (spectacles, satchel, clipboard, camera, cap, lanyards, star).
- [ ] The face uses only the shared expression parts. No new eye shapes appear without an update to this document.
- [ ] Mirrored versions keep prop logic (badge text never shown reversed).
- [ ] No character wears a stall's colours as a uniform, or holds a stall's signature item (wrench, flask, brush, first-aid heart, chaat bowl, ticket roll) in shared art. Hira's clipboard and Sara's camera are personal props and never appear at a matching stall as "theirs" (this is a neutrality rule: see GAME_DESIGN §4).
- [ ] Cultural review: clothing, hijab drape and the karakul cap are drawn respectfully. Reviewed by a teacher at the school.
