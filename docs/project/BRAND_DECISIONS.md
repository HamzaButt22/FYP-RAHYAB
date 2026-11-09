# Rahyaab brand identity (v3, 31 Oct 2026; final choices 3 Nov 2026)

## FINAL DECISIONS (supersede anything below that conflicts)

**Source of truth (updated 7 Nov 2026):** `design/tokens/tokens.json` is the master. `tokens.css`, `theme.ts` and `tokens.dtcg.json` mirror it, and `design/tokens/check_tokens.py` fails CI if they drift. The Figma frame "Rahyaab – Design system" is a visual copy that follows the tokens, not the other way round. Brand files are in `design/brand/` (SVG and PNG).

**Changes from the table below:**
- **The logo adapts to its ground.** On light: twig `#8A5A3A` and leaf `#3E8A5A`. On dark: twig `#FBF3E6` and leaf `#6FCF97`. On a terracotta tile: twig `#FFFFFF` and leaf `#FBD9A8`.
- **The mascot in dark mode** gets a brighter body (`#D9643F`, 4.9:1 on the dark background). Its wing, beak and tail stay `#1F2326`, and it gets a 1.5px `#F3ECE1` die-cut edge.
- **Saffron is now `accent`** (`#F2B33D`). It's for highlights only, never text.
- **New tokens:**
  - `success`: `#2E7A52` light, `#6FCF97` dark;
  - `focus`: `#1F7A7A` light, `#6FCBC5` dark.
- **Token names in code** follow the design system: `bg`, `surface`, `sunken`, `border`, `text`, `muted`, `primary` (with `on-primary` and `primary-text`), `secondary` (with `on-secondary` and `secondary-text`), `accent`, `success`, `danger`, `focus`, `logo-*` and `mascot-*`.
- **Type:**
  - Bricolage Grotesque 800 for display (`display-xl` 40/44, `display-l` 32/36, `heading` 24/30);
  - Plus Jakarta Sans for text (`title` 18/24, `body-l` 17/26, `body` 15/22, `label` 14/20, `caption` 12/16);
  - Gulzar for Urdu (`urdu-title` 24/44, `urdu-body-l` 21/38, `urdu-body` 19/34, `urdu-label` 17/30);
  - Atkinson Hyperlegible as the optional reading font (`reading-body` 17/26).
- **High contrast:** a third colour theme, `contrast` (7:1 text, ≥ 3:1 control borders), in tokens.json.
- **Spacing:** 4, 8, 12, 16, 24, 32.
- **Radius:** 10, 14, 20, 28, 999.
- **Touch targets:** at least 48px.

- **Logo:** Branch (Logo lab W4 / Palette lab L7). The Fork's r is drawn as a wooden branch, with a twig and leaves; the dotted line is the expected path. The family preferred it.
- **Mascot:** Hudhud, **B2 Chubby**. B3 Front-facing is used only for waving and celebrating. Style is S1 Flat; S2 Sticker is for WhatsApp and share cards.
- **Palette:** **C2 Terracotta & teal**, extended into light and dark token sets.

The colour table that used to be here (with the old names terra, teal, saffron, wood and leaf) was out of date and is removed so nobody copies stale values. **Read the colours from `design/tokens/tokens.json`** (names, light, dark and high-contrast values, with contrast notes). The old names map to: terra → `primary`, on-terra → `on-primary`, terra-text → `primary-text`, teal → `secondary`, teal-text → `secondary-text`, saffron → `accent`, wood → `logo-twig`, leaf → `logo-leaf` (logo only; success text uses `success`).

**Mascot colours:** read `mascot-body`, `mascot-ink`, `mascot-light` and `mascot-outline` from tokens.json. The body is `#B54A2F` in light and the brighter `#D9643F` in dark; wing, beak and tail are `#1F2326` in both; in dark mode the bird gets a 1.5px `#F3ECE1` die-cut edge.

**Rules:**
- Terracotta leads and teal answers.
- Saffron is the only extra accent.
- No white text on saffron.
- Dark mode is teal-tinted, not black, and not the rejected P3 "Night hoopoe".

Board: "FINAL · Terracotta, Teal & Branch" on the design canvas.

---

**History:**

| Version | What it was | Feedback |
|---|---|---|
| v1 | Qalam / Sang-e-Meel / Taaray | "Too basic, a children's story app" |
| v2 | Midnight palette with an abstract companion | "Looks like an AI app"; only the **Fork** logo was kept |
| v3 | Keeps the Fork, brings back the warm palette and a character mascot, and gives both a story of their own | (this document) |

The design canvas board is "Identity v3 · Fork logo + Hudhud mascot".

---

## 1. Brand story

In Fariduddin Attar's 12th-century Persian poem *Mantiq-ut-Tair* (*The Conference of the Birds*, well known in Urdu literature), the **hoopoe (hudhud)** guides the birds on a long journey to find their king, the Simurgh. At the end, the birds discover that what they were looking for was themselves ("si murgh" means "thirty birds").

**That is Rahyaab:** a guide on the journey, and the answer turns out to be *you*.

The hoopoe also fits for other reasons:
- it's native to Pakistan and seen in gardens and fields;
- it's known from the story of Hazrat Suleman;
- its crown is saffron-orange with black tips: our logo's point;
- its black-and-cream barred wings give us a signature pattern.

**Taglines:**
- "Play your year. Find your raah."
- "Apni raah. Apni kahani."
- "Every journey needs a guide."

**Promise:** *Find your raah, and bring your family with you.*

---

## 2. Logo: The Fork (approved)

- **Form:** a lowercase **r** at a crossroads.
  - The stem continues upward as a **dotted line**: the path everyone expects.
  - The shoulder **rises right** to a **saffron point**: the path you choose.
- **Construction** (64 grid):
  - stem `M22 58 V34`, shoulder `C22 21 31 15 44 15`, 7-unit stroke, round caps;
  - dotted `M22 30 V8`, dasharray `0.1 8.5`, muted colour;
  - point `r=5` at (52,15).
- **At 24 px and below:** no dotted line, stroke 9, point r 6.5.
- **App icon:** the mark on a **cinnamon** tile, with a cream point and kohl stroke. Alternates are cream and night tiles.
- **Wordmark:** "rahyaab", lowercase, Bricolage Grotesque 700, tracking −3%. Urdu: راہ یاب in Gulzar.
- **Hero lockup:** Hudhud perched on the end of the shoulder stroke, standing on the path you chose. Use it on the splash, the store listing and posters.

---

## 3. Mascot: Hudhud ("Hud" to friends)

A flat, geometric hoopoe in profile.

**Construction (200 grid):**
- cinnamon body with a lighter belly;
- kohl wing with 4 cream bars;
- kohl tail with one cream band;
- a long, thin, curved kohl beak;
- a **small** eye with a highlight;
- a crest of 5 feathers, each with a black tip and a cream band.

**Why it doesn't read as childish:**
- no big eyes, no smile, no round blob body;
- expression comes from the **crest and the head angle**, the way a real hoopoe signals;
- no mouth: the beak can't grin.

**Why it doesn't read as Duolingo:**
- a slender, long-beaked side profile (Duo is a round, front-facing owl);
- warm cinnamon, not green;
- a real local bird with a literary story.

| Expression | Crest | Other cues | Used for |
|---|---|---|---|
| Listening | Folded flat (a single swept-back tuft) | — | Default while you play |
| Curious | Half raised | Head tilted −8° | After a surprising choice |
| Thinking | Half raised | Eye looking up | Model updating, short waits |
| Delighted | Full fan | — | Only big moments: Blueprint, a parent linking |
| Resting | Folded | Eye closed, head +6° | Offline, waiting for consent |

**Dark-mode variant (superseded, history only):** a coral body (`#FF8A5B`) with cream wing and beak. Replaced by the `#D9643F` body above.

**Animation (Skia/Reanimated):**
- the crest rotates per feather with spring easing;
- the head tilts;
- a peck cycle for loading, because hoopoes probe the ground for food.

Everything is simple shapes, so a student team can build it without Lottie.

**Where it appears:**
- the strip at the bottom of scenes (56 px);
- loading;
- empty states;
- the Blueprint;
- onboarding.

**Where it doesn't appear:** in the parent and teacher views, which get the logo only and stay serious.

**Alternative (if the team prefers continuity): Nuqta, grown up.** A saffron diamond (the logo's point) with sharper corners, lidded eyes, no smile, and a tail that is the fork's rising stroke. It's simpler, but has no story.

---

## 4. Loading screens

| Screen | Behaviour |
|---|---|
| **Splash**, 1.5 s on cream | 0.0 s: the r's shoulder draws itself. 0.8 s: Hudhud lands on the end of the stroke, crest fanning on landing. 1.3 s: the wordmark appears, then Home |
| **Long loading** (building the Blueprint) | Hudhud pecks along a dotted line. Text: "Digging through your four weeks…". Facts: "12 scenes · 30 choices · 6 challenges". Below: the barred progress meter |
| **Short waits** | The crest goes from folded to half to folded; no spinner |
| **Reduced motion** | A static perched lockup plus the text |

---

## 5. Palette: "Jade Spark, re-led by the hoopoe"

The warm cream, coral energy and jade that you liked are kept. **Cinnamon now leads** and jade supports, so green is no longer the hero.

**Light**

| Token | Hex | Use | Contrast |
|---|---|---|---|
| Chai cream | `#FBF5EC` | Background | — |
| Kohl | `#1E1B18` | Text, wing, beak | 15.81 on cream |
| Muted | `#5E574F` | Secondary text | 6.56 on cream |
| Hudhud cinnamon | `#E8743F` | Hero fills, app icon, Dil | Kohl on it 5.71 (**never white text**: 3.0) |
| Cinnamon text | `#A3401A` | Cinnamon-coloured text on cream | 5.86 |
| Saffron point | `#FFB224` | The logo point, highlights | Kohl on it 9.51 |
| Jade | `#2DB888` | Duniya, progress, success | Kohl on it 6.79 |
| Jade text | `#0B7352` | Links and "fit" labels on cream | 5.40 |

**Dark**

| Token | Hex | Contrast |
|---|---|---|
| Night | `#17130F` | — |
| Surface | `#231D18` | — |
| Text | `#F6EEE4` | 16.07 |
| Muted | `#B4A99C` | 8.0 on bg, 7.22 on surface |
| Coral | `#FF8A5B` | Text `#1A0C05`, 8.23 |
| Saffron | `#FFC24D` | 11.51 |
| Jade | `#3CCB9A` | Text `#0A1F17`, 8.35 |

- **Signature pattern, the hoopoe bars:** kohl and cream segments are used for the "Rahyaab knows you" meter, week progress (in cinnamon), dividers and share-card borders.
- **Dropped:** indigo and purple.

**Type:**
- **Bricolage Grotesque 700/800** for headings;
- **Plus Jakarta Sans** for UI;
- **Gulzar** for Urdu.

All are on Google Fonts under the OFL.

---

## 6. Hudhud's voice and dialogue

**Voice rules:**
- A well-travelled older cousin: warm, curious, a little witty.
- Roman Urdu and English mixed.
- Never judges, never says "correct" or "wrong", never guilt-trips.
- Never claims more certainty than the model has.

| Moment | Hudhud says |
|---|---|
| First launch | "Salaam! I'm Hudhud. Birds have followed me on long journeys before. This one's yours." |
| How it works | "No pass or fail, no marks. Some puzzles show your strengths. Bas apni marzi se khelo. I'll take notes." |
| Making the player | "Looking sharp. Ready to live your year?" |
| Waiting for a parent | "Waiting for Ammi/Abbu's OK. Tab tak, look around. Nothing is saved yet." |
| Plan your week | "Three things. You can't do everything, and nobody can." |
| Idle in the planner | "No rush. Sunday night is long." |
| After a scene | "Noted." |
| Certainty rises | "The robotics club told me a lot about you." |
| Certainty drops (Curious) | "Oh, didn't see that coming. Good. Tell me more next week." |
| "Ask a friend" in a task | "Asking is a skill too." |
| Back after a break | "Wapis aa gaye! Your year waited for you." |
| Offline (Resting) | "No signal? Sab kuch phone pe save hai." |
| Long loading | "Digging through your four weeks…" / "Connecting what you chose…" / "Ek last line…" |
| Blueprint intro (Delighted) | "Four weeks. Twelve scenes. Let me show you what I found." |
| Blueprint close | "A starting point, not a verdict. Ghar walon ko dikhao?" |
| Low certainty at the end | "I'm not sure about you yet, and I won't pretend. One more week?" |
| Error | "Uff, something broke on our side. Try again?" |
| Empty saved paths | "Nothing saved yet. Bookmark any path that catches your eye." |

**Dil and Duniya** stay as the two inner voices, shown as filled choice cards: **Dil in coral/cinnamon** and **Duniya in jade**, each with a small caps label. Example lines are in GAME_DESIGN.md.

---

## 6b. Hudhud lab: options to choose from (board "Hudhud lab")

The Fork logo is fixed. Choose a **body type (B)**, a **palette (P)** and the **actions (A)** to use. For example, `B2 · P1 · A1` is the chubby bird in cinnamon, perched on the Fork.

**B · Body types**

| Code | Body | Notes |
|---|---|---|
| B1 | Slim profile | The v3 bird; elegant and closest to a real hoopoe |
| B2 | Chubby | Round body, bigger head, shorter beak; friendlier, still not babyish |
| B3 | Front-facing | Looks at you; good for onboarding and moments where it talks |
| B4 | Low-poly | Faceted origami look; the most grown-up and techy |
| B5 | Monoline | Drawn with the Fork's stroke; the crest tips are logo points |
| B6 | In flight | Broad, striped, butterfly-like wings |

**A · Actions and props**

| Code | Action | Use |
|---|---|---|
| A1 | On the Fork | Hero lockup |
| A2 | At the crossroads | A signpost with ICS and Pre-Eng signs |
| A3 | The messenger | Carries a scroll, the way the hoopoe carried Suleman's letter; delivers the Blueprint and notifications |
| A4 | Reading | Explore and course pages |
| A5 | Headphones | Home and weekly recap |
| A6 | Backpack | Onboarding and Week 1 |
| A7 | Glasses on | While the model updates |
| A8 | Scrolling a phone | Notifications and parent link |
| A9 | Waving | First launch and returning after a break |
| A10 | Celebrating | Blueprint reveal only |
| A11 | Sleeping | Offline, or waiting for consent |
| A12 | Pecking | Long loading |

**S · Render styles**

| Code | Style | Use |
|---|---|---|
| S1 | Flat | Default |
| S2 | Sticker | White die-cut edge; WhatsApp stickers and share cards |
| S3 | Avatar | Circular head crop |
| S4 | Knock-out | Single colour for print |

**P · Palettes**

All palettes are drawn from hoopoe colours. "Buttons" is the lowest contrast among the ink, body and secondary buttons, each using its most legible text colour.

| Code | Palette | bg / body / ink / accent / secondary | Text | Buttons |
|---|---|---|---|---|
| P1 | Cinnamon (current) | `#FBF5EC` `#E8743F` `#1E1B18` `#FFB224` `#2DB888` | 15.8 | 6.2 |
| P2 | Terracotta & teal | `#F6EFE3` `#B54A2F` `#1F2326` `#F2B33D` `#1F7A7A` | 13.9 | 5.1 |
| P3 | Night hoopoe (dark-first) | `#17130F` `#FF8A5B` `#F6EEE4` `#FFC24D` `#3CCB9A` | 16.1 | 8.0 |
| P4 | Truck art | `#FFF6E0` `#FF5A36` `#1B1B3A` `#FFD23F` `#00A6A6` | 15.4 | 6.0 |
| P5 | Mughal tile | `#F7EEDC` `#E9A23B` `#0F3D47` `#C8442F` `#0F4C5C` | 10.2 | 8.6 |
| P6 | Karachi coast | `#FFF8F0` `#F26B3A` `#1D2A30` `#FFC857` `#2A9DB5` | 14.0 | 5.9 |
| P7 | Kohl & saffron | `#F4F1EC` `#4A423B` `#141211` `#FFB224` `#8A8178` | 16.6 | 4.9 |

**Suggested pairing:** P1 for the student app, with P3 as its dark mode. P7 (or P2) can be the calmer palette for the parent and teacher views, so one brand serves both audiences.

---

## 7. Applying v3 to the screens (next step)

| Screen | Change |
|---|---|
| Splash and loading | As in §4 |
| Home | Cream (or night) background; a greeting with Hudhud in the corner; this week's 3 slots; the barred "knows you" meter |
| Week planner | Activity cards; the energy bar in cinnamon segments |
| Scene | Coral Dil and jade Duniya cards; the Hudhud strip at the bottom |
| Blueprint | Full-bleed cinnamon or cream slides; Hudhud Delighted on the archetype slide; a share card with a barred border |
| Parent report and teacher dashboard | Cream and kohl; the logo only, no mascot; jade-text fit labels |
| Buttons | Primary: kohl fill with cream text, or cinnamon fill with kohl text; 14 px radius; **no 3D lip**; press scales to 0.97 |
