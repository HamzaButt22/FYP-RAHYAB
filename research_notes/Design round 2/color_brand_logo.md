# Rahyaab — Color, Brand Identity and Logo Research (Design round 2)

Researched 2026-10-31. Every contrast ratio below was computed with a Python WCAG 2.x relative-luminance script. OKLCH values come from the same script, using Björn Ottosson's OKLab matrices. Where a hex code comes from a third-party reconstruction and not an official brand page, it is marked **(unofficial)**.

---

## 0. TL;DR

- **Why the current palette feels dull, measured:** Fern #1F7A5C is OKLCH L0.52 C0.096. Coral #C8502C is L0.58 C0.161, and Clay #A65562 is L0.55 C0.107. All three sit in a dark, low-chroma band (L about 0.52–0.58). The lively youth brands put their *hero* colors at **L 0.66–0.86 and C 0.15–0.23**:
  - Duolingo Feather: L0.75 C0.229
  - Careem Green: L0.81 C0.203
  - Spotify: L0.77 C0.212
  - Bumble: L0.85 C0.166
- **How those brands stay readable:** they don't put white text on the bright color. Either they use **dark ink text on a bright fill**, or they keep a **second, deeper shade** of the same hue just for text. Duolingo's white-on-Feather button is only **2.09:1** (computed), which fails AA. We should not copy that part.
- **Recommendation:** Candidate **A "Jade Spark"**:
  - bright jade hero #1DBF8A, with ink text at 7.08:1
  - deep jade #007D58 for text and white-label buttons (5.15:1 with white)
  - sunrise coral action #FF6B3D, with ink text at 5.93:1
  - sunflower reward #FFC23D, with ink text at 10.41:1
  - indigo secondary #4D5BD6
  - warm paper #FBF8F3 kept as the background
  
  The chroma target is "vivid, not neon": C 0.14–0.19 for fills, against 0.20–0.23 for neon brand greens.

---

## 1. How successful youth / learning / wellbeing apps build vivid-but-friendly palettes

| Brand | Published / found hex | Source quality | OKLCH (computed) | What makes it lively, not garish |
|---|---|---|---|---|
| **Duolingo** | Feather Green #58CC02, Mask Green #89E219, Eel #4B4B4B; Cardinal #FF4B4B, Bee #FFC800, Fox #FF9600; Macaw #1CB0F6 (unofficial) | Official design site lists Feather as the core color, "taken from Duo" ([design.duolingo.com/identity/color](https://design.duolingo.com/identity/color), now redirecting to [blog.duolingo.com/hub/design](https://blog.duolingo.com/hub/design/)); values echoed by [brandpalettes](https://brandpalettes.com/duolingo-colors/) | Feather L0.75 C0.229 H138; Bee L0.86 C0.175; Fox L0.77 C0.175; Cardinal L0.67 C0.217 | One owned hero (green). Every accent is high-L, so nothing is muddy. Gray Eel #4B4B4B text, not black. Chunky rounded shapes soften the high chroma. Note: white on Feather = **2.09:1** (fails AA). They rely on bold weight and size. |
| **Careem** (Pakistan market) | Careem Green #00E784; Forest #00493E; Light Green #D6FFEA; Desert Sky #A6EDF2; Midnight #001942; Off-white #FAFFFC; UI: Purple #855DFF, Red #FF0040, Orange #FB6704 | **Official** ([brand.careem.com/colour](https://brand.careem.com/colour/)); 2023 rebrand ([Careem blog](https://blog.careem.com/posts/say-hello-to-the-new-careem-💚), [Campaign ME](https://campaignme.com/careem-rolling-out-most-significant-rebrand-in-its-history)) | Green L0.81 C0.203 H155 | Strict rule: "never make a composition without our core Careem Green". There is a **deep partner (Forest) for contrast**: Forest on Green = 6.31:1, white on Green = 1.65:1. Category colors only appear inside their category. This is the clearest published model of "one hero + a deep partner + tints". |
| **Spotify** | #1ED760 (current), legacy #1DB954; surfaces #121212/#181818 | Unofficial reconstructions ([brandpalettes](https://brandpalettes.com/spotify-color-codes/), [shadcn DESIGN.md](https://www.shadcn.io/design/spotify)) | L0.77 C0.212 | Green is reserved for *function* (play, active, CTA) on near-black. Album art supplies the other color. Black on green = 10.94:1. Wrapped's loud gradients are a *seasonal campaign* layer, not the base UI. |
| **NayaPay** (PK) | "Electric Orange" signature + new "Blackberry" companion; no hex published | **Official** ([NayaPay Reborn](https://www.nayapay.com/news/NayaPay-Reborn)), by studio Koto | n/a | Hero intensified in the refresh, then grounded by a dark companion. The "Dyno" emblem is made of interlocking arrows (motion), and the icons reuse the logo geometry. |
| **SadaPay** (PK) | "Minty front, peachy back", "vibrant sea tones"; no hex | **Official** ([SadaPay blog](https://sadapay.pk/blogs/introducing-sadapays-new-look)) | n/a | Positioned against the "uninspiring" blue/black/gold of Pakistani banks. The palette is inspired by Pakistan's natural beauty. Pastel-plus-vivid pairing with a friendly tone. |
| **Bumble** | Yellow #FFC629 | Third-party ([brandcolorcode](https://www.brandcolorcode.com/bumble)) | L0.85 C0.166 | A single warm, high-lightness hero with lots of white. Pairs with dark text. |
| **Airbnb** | Rausch #FF385C (newer), #FF5A5F (older); sources conflict | Unofficial ([shadcn](https://www.shadcn.io/design/airbnb), [color.codes.in](https://color.codes.in/brands/airbnb)) | #FF385C L0.66 C0.231 | One hero on a vast white/gray canvas. Photos do the rest. |
| **Headspace** | Orange about #FF7E1D or #FFAC1D; blue #0061EF, yellow #FFCD00; **no official hex** | Unofficial and conflicting ([kombai](https://kombai.com/examples/design-systems/headspace-kombai), [webdesignhot](https://www.webdesignhot.com/design.md/headspace/)) | n/a | Warm orange "smile" mascot; soft round illustration; saturated colors in *large flat shapes* with no gradients, which keeps them calm. |
| **Calm** | No official hex (blue variously #60B0E7 / #0066FF / #1A3E6F) | Unofficial ([brandcolorcode](https://www.brandcolorcode.com/calm)) | n/a | Uses nature photography and dark blues. This is the "calm" end of the spectrum, too sleepy for Rahyaab's game energy. |
| **Khan Academy** | Accent blue #1865F2 (unofficial); no hex in the official post | Official method post: [How we rebuilt Khan Academy's color system](https://blog.khanacademy.org/how-we-rebuilt-khan-academys-color-system-from-the-ground-up/) | n/a | Method worth copying: core hues are tuned *early* to pass 4.5:1. Tokens follow Domain/Layer/Context/Intensity (Subtle/Default/Strong). Contrast is computed for all core pairs: 3:1 for borders/UI, 4.5:1 for text. Dark mode adds a darker ramp stop and adjusts hues. |
| **Linear** | Theme generated from 3 inputs (base, accent, contrast) in **LCH** | Official ([Linear blog](https://linear.app/blog/how-we-redesigned-the-linear-ui)) | n/a | Moved from HSL to LCH because it is perceptually uniform. 98 variables per theme became 3 inputs, and high-contrast themes are generated automatically. |
| **Finch** | No official palette found | Reviews only ([Android Authority](https://androidauthority.com/finch-habit-tracker-app-hands-on-3537434), [Pratt IxD critique](https://ixd.prattsi.org/author/yiqin-meng)) | n/a | Pastel world, cartoon pet, green hills. User-chosen bird color gives ownership. "Rainbow stones" reward motif. Liveliness comes from character and reward moments, not a loud base UI. Directly relevant to a stress-free game for teens. |
| Notion, Arc, BeReal, Quizlet, Brainly, Photomath, Khanmigo, Bykea, Maqsad, Taleemabad, Tapmad | Not verified | Searches returned no official palette pages | n/a | Not used as evidence. From general knowledge (unverified): Notion and BeReal are near-monochrome, with personality in illustration and type. Bykea is green, Tapmad is red/black, Taleemabad uses a multi-color kids style. Verify before citing. |

**Patterns that explain "lively without garish":**
1. **One owned hero hue, used everywhere** (Duolingo, Careem, Spotify, Bumble). Liveliness is consistent recognition, not many colors.
2. **Hero at high lightness (L 0.70–0.86), high but not maximal chroma.** Neon brand greens hit C about 0.20–0.23. A calmer "vivid" sits at C 0.14–0.19.
3. **A deep partner shade for text and contrast** (Careem Forest, Spotify near-black, Duolingo Eel gray). Bright fills carry dark text.
4. **Warm accents (yellow, orange) for reward and celebration only**, kept out of chrome.
5. **Plenty of neutral space.** Saturation reads as joyful when it covers about 10–20% of the screen. Full-bleed color is saved for celebration and splash moments (Careem "takeover" rule; Spotify Wrapped).
6. **Character and shape** (Duo, Headspace smile, Finch bird) carry the friendliness, so the colors don't have to be cartoonish.

---

## 2. Trend evidence 2025–2026: evidence versus marketing

| Claim | What it actually is | Use for Rahyaab |
|---|---|---|
| Pantone CoY 2025 **Mocha Mousse** (17-1230) | Marketing/forecast pick. Warm brown, aimed at fashion and interiors. | Supports warm neutrals (paper, sand), not a hero. |
| Pantone CoY 2026 **Cloud Dancer** (11-4201), a soft white | Marketing. Framed as relief from being "overstimulated" ([NBC News](https://www.nbcnews.com/pop-culture/pop-culture-news/pantone-names-2026-color-year-rcna247366), [Dezeen](https://www.dezeen.com/?p=2275626)). Widely criticized as boring. | Weak support for an off-white, airy canvas, which we already have (#FBF8F3). |
| WGSN × Coloro CoY 2026 **Transformative Teal** (Coloro 092-37-14), a "fusion between dark blue and aquatic green" | Forecaster pick; S/S26 key colors include Electric Fuchsia, Blue Aura, Amber Haze, Jelly Mint ([WGSN blog](https://www.wgsn.com/en/blogs/colour-year-2026-transformative-teal), [Mr Mag](https://mr-mag.com/wgsn-and-coloro-announce-colour-of-the-year-2026-transformative-teal-and-the-key-colours-for-a-w-26-27)) | Supports moving green *toward teal/jade* (H about 165–185) and a deep teal for dark mode. |
| **Material 3 Expressive** (May 2025): "46 studies, 18,000+ participants", expressive UI "strongly preferred" by all ages, key elements spotted "up to 4x faster" | Real research, but reported from a Google post that leaked and was then pulled ([Business Insider NL](https://www.businessinsider.nl/google-says-people-are-over-the-non-expressive-design-of-iphone-apps/), [Gigazine](https://wbgsv0a.gigazine.net/gsc_news/en/20250506-android-material-3-expressive)). No color-specific findings published. | Best available evidence that more color, shape and emphasis improves preference and findability. It is about *expressive emphasis*, not neon. |
| Material color = **HCT** (hue, chroma, tone) tonal palettes from seed colors; "Vibrant/Expressive" schemes raise chroma | Official docs ([Android color system](https://developer.android.com/design/ui/wear/guides/styles/color/system)); a higher-chroma seed gives a more saturated palette ([pushing-pixels](https://www.pushing-pixels.org/category/general/radiance/page/2)) | Method: pick a seed, derive tones; contrast follows tone difference. |
| Apple **iOS 26 Liquid Glass**: layered translucent icons, Light/Dark/Clear/Tinted icon modes; iOS 26.1 added a "Tinted" option after legibility backlash | Secondary coverage ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/4), [Gulf News](https://gulfnews.com/technology/companies/apple-yields-tinted-control-in-ios-261-beta-4-tones-down-liquid-glass-after-backlash-1.500315176), [MobileAction](https://www.mobileaction.co/blog/apple-liquid-glass-design/)) | Icons must survive tinted and monochrome rendering. Avoid pale, low-contrast icons. Don't rely on translucency for legibility. |
| "Gen Z loves bright colors" (e.g., "70% prefer bright colors", attributed to WGSN) | **Unverified.** The original could not be found. Adobe's "51% chose a brand on color" combines Gen Z with millennials. A table claiming "bright pink 63%" is unsourced ([designyourway](https://www.designyourway.net/blog/color-statistics/)). The only Gen-Z-specific study found is a 407-person student thesis ([HSE](https://hse.ru/en/edu/vkr/925415876)). | Treat as marketing. Validate with our own teen users (quick A/B preference test of the 3 candidates). That is also good evidence for the FYP. |

**Net:** the evidence supports *expressive, high-emphasis color with clear hierarchy* (M3E) and *calm, airy neutrals* (the Pantone 2026 mood, the backlash against over-stimulation). Teal/jade is on-trend (WGSN). No credible data says Gen Z wants neon.

---

## 3. Practical method for "vivid but not oversaturated"

Use **OKLCH** (CSS `oklch()`) or Material **HCT**. Both are perceptually uniform, so lightness predicts contrast regardless of hue. HSL does not ([Evil Martians write-up via Stefan Judis](https://www.stefanjudis.com/blog/oklch-perceived-lightness), [Linear](https://linear.app/blog/how-we-redesigned-the-linear-ui)).

**Targets used in this research (computed on references):**

| Role | OKLCH L | OKLCH C | Notes |
|---|---|---|---|
| Hero fill (buttons, big shapes, illustration) | 0.70–0.78 | 0.13–0.19 | Neon zone is C ≥ 0.20 at L ≥ 0.75 (Careem, Spotify, Feather). Stay under it. |
| Deep text / white-label button shade | 0.50–0.55 | 0.10–0.13 | Keep the **same hue angle** (±3°) so it reads as the same brand. |
| Tint (chips, cards) | 0.93–0.96 | 0.02–0.04 | |
| Neutrals | bg 0.98, text 0.22–0.24, muted 0.47–0.49 | 0.003–0.02 | Tint the neutrals slightly toward the hero hue (warm paper H about 80) for cohesion. |
| Dark mode hero | 0.75–0.81 | 0.13–0.16 | Raise L and lower C a little. Neutrals at L 0.18–0.24 tinted with the hero hue. |

**Scale systems:**
- **Radix 12-step scale** ([Radix docs](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)):
  - steps 1–2: backgrounds
  - steps 3–5: component states
  - steps 6–8: borders
  - step 9: the purest, most saturated solid (the brand color)
  - step 10: hover
  - steps 11–12: text, guaranteed APCA Lc 60/90 on step 2
  
  Map Rahyaab's hero to step 9, deep to step 11, tint to steps 3–4.
- **Tailwind**: 50–950 ramps. Emerald-500 #10B981 is L0.70 C0.149 and teal-500 #14B8A6 is L0.70 C0.123, almost exactly our hero targets.
- **Material 3**: tonal palette tones 0–100. Primary is tone 40 (light) / 80 (dark), primary-container is tone 90 / 30. Contrast is guaranteed by tone distance (≥40 tones gives about 4.5:1 in practice).

**Keeping the hue identifiable in dark mode:** keep H fixed, raise L from about 0.71 to 0.78, and drop C by about 0.0–0.02 so it doesn't vibrate on dark. Put **dark text on the bright hero** (onHero #04201A gives 9.18:1). Tint dark surfaces with the hero hue (C about 0.015, H 168).

**Rule of thumb:** "liveliness" = hero coverage × lightness. Use a bright fill with dark text for primary CTAs, and white text only on the deep shade.

---

## 4. Cultural color notes for Pakistan

- **Green** = national flag (#01411C, deep green, OKLCH L0.33 C0.087 H151), Islam, prosperity, nature. Very positive, but a *dark flag green plus crescent/star* reads as state or patriotic. Shifting toward **jade/teal (H 160–185) and higher lightness** keeps the positive meaning without looking governmental.
- **Political associations to avoid** in combinations, not single hues:
  - **PML-N:** plain green ([Wikipedia](https://en.wikipedia.org/wiki/Pakistan_Muslim_League_(N))), plus the tiger symbol. Avoid a tiger mascot.
  - **PTI:** red + green flag with crescent ([PTI-P on Wikipedia](https://en.wikipedia.org/wiki/Pakistan_Tehreek-e-Insaf_Parliamentarians): red, dark green). The bat symbol is ECP-related. Avoid a red-and-green pair as the two equal brand colors.
  - **PPP:** red-black-green tricolor ([Flags of the World](https://crwflags.com/FOTW/FLAGs/pk}.html)). Avoid red + black + green stripes.
  - **MQM-P:** red, green, white.
  - **JUI-F:** black with white stripes (older FOTW source).
  
  **Practical rule:** never present saturated red and saturated green as co-equal stripes or blocks. Coral/orange (H 35–50) as an accent next to jade is safe because it reads as sunrise, not party red. Avoid pure red (H about 25–30) as a second brand color.
- **Red** = bridal/wedding (lehenga), celebration, but also danger. Keep pure red for errors only.
- **Gold/yellow** = weddings, festivity (mehndi yellow/marigold), success. Great for **rewards**.
- **Orange/marigold** = mehndi, festivity. Positive.
- **White** = purity but also mourning. Fine as a neutral, not as a celebratory color.
- **Black** = mourning (Muharram) and seriousness. Use a near-black ink, not pure black, and not large black areas in light mode.
- Teens in Pakistan already know vivid fintech/mobility brands (Careem green, NayaPay orange, SadaPay mint/peach, JazzCash/Easypaisa). A jade + coral + sunflower palette sits in this familiar "modern Pakistani app" family without copying any of them.

Sources: ECP symbols coverage ([APP](https://www.app.com.pk/?p=736996)), [Al Jazeera party explainer](https://www.aljazeera.com/news/2024/2/3/pakistan-elections-2024-here-are-the-major-political-parties). Wedding and mourning meanings are general cultural knowledge, not sourced.

---

## 5. Three candidate palettes (all ratios computed)

Notation: "fill" = large surfaces/buttons; "deep" = text and white-label buttons. AA = ≥4.5:1 normal text; UI/large = ≥3:1.

### Candidate A — "Jade Spark" (refined, more alive green) — RECOMMENDED

**Light mode**

| Token | Hex | OKLCH |
|---|---|---|
| bg (warm paper, kept) | #FBF8F3 | L0.98 C0.007 H81 |
| surface | #FFFFFF | |
| ink | #14201B | L0.23 C0.020 H167 |
| muted text | #56625C | L0.48 C0.018 |
| **hero fill (Jade)** | **#1DBF8A** | L0.71 C0.147 H164 |
| hero deep (text, white-label btn) | #007D58 | L0.52 |
| hero ink-on-tint | #006A4B | |
| hero tint | #DDF6EB | L0.95 C0.030 |
| secondary (Indigo) | #4D5BD6 | L0.53 C0.187 H273 |
| **action (Sunrise coral)** | **#FF6B3D** | L0.71 C0.191 H37 |
| onAction | #1C120D (or ink #14201B) | |
| **reward (Sunflower)** | **#FFC23D** | L0.85 C0.156 H82 |
| success | #007D58 | |
| warning (text) | #A75F00 | |
| danger | #C93545 | |
| info | #2F68D0 | |

| Pair | Ratio |
|---|---|
| ink on bg | **15.83** AAA |
| muted on bg / surface | 6.01 / 6.37 AA |
| ink on hero fill #1DBF8A (primary button) | **7.08** AAA |
| white on hero deep #007D58 | **5.15** AA |
| hero deep #007D58 on bg | 4.87 AA (on white 5.15) |
| #006A4B on tint #DDF6EB | 5.83 AA |
| ink on tint | 14.74 AAA |
| white on secondary | 5.55 AA; secondary on bg 5.24 AA |
| onAction on action / ink on action | 6.50 / 5.93 AA |
| ink on reward | **10.41** AAA |
| warning on bg | 4.63 AA (on white 4.91) |
| danger on bg / white on danger | 4.86 / 5.15 AA |
| info on bg | 4.94 AA |
| Do **not**: hero fill as text on bg | 2.23 FAIL |
| Do **not**: white on hero fill | 2.37 FAIL |
| Do **not**: white on action | 2.83 FAIL |

**Dark mode**

| Token | Hex |
|---|---|
| bg | #0E1613 |
| surface | #17211D |
| ink | #EDF5F1 |
| muted | #9FAEA7 |
| hero | #34D69E (L0.78 C0.153 H164, same hue as light) |
| onHero | #04201A |
| hero tint | #123A2D |
| secondary | #9AA5FF |
| action | #FF8A63 |
| onAction | #1C0E08 |
| reward | #FFD166 |
| warning | #F2B347 |
| danger | #FF7A85 |
| info | #7FB0FF |

| Pair | Ratio |
|---|---|
| ink on bg / surface | 16.57 / 14.89 |
| muted on bg / surface | 7.95 / 7.15 |
| hero on bg / surface | 9.85 / 8.85 |
| onHero on hero | 9.18 |
| ink on hero tint | 11.34 |
| hero on hero tint | 6.75 |
| secondary on bg | 8.05 |
| onAction on action | 8.13 |
| onHero on reward | 11.87 |
| warning / danger / info on bg | 9.90 / 7.33 / 8.36 |
| Do **not**: light-mode deep #007D58 on dark surface | 3.20 (UI only) |

Clay #A65562 from the old palette can survive as an illustration-only tone (4.84 on paper). It is not needed in the UI.

### Candidate B — "Lagoon Teal" (electric-but-soft teal; on-trend with WGSN 2026)

**Light mode**

| Token | Hex |
|---|---|
| bg | #F7FAF9 |
| surface | #FFFFFF |
| ink | #10201F |
| muted | #52625F |
| **hero fill** | **#14C3B4** (L0.74 C0.127 H185) |
| hero deep | #007C74 |
| tint | #D7F5F1 |
| ink-on-tint | #00726B |
| secondary (violet-ultramarine) | #5A55E8 |
| action | #FF7442 |
| reward | #FFC93C |
| success | #1E8A4C |
| warning | #A75F00 |
| danger | #C93545 |
| info | #2F68D0 |

| Pair | Ratio |
|---|---|
| ink on bg | 16.02 |
| muted on bg | 6.11 |
| ink on hero fill | 7.61 |
| white on deep | 5.08 |
| deep on bg | 4.84 |
| #00726B on tint | 5.03 (#007C74 on tint only 4.41) |
| white on secondary | 5.39; secondary on bg 5.13 |
| dark on action | 6.86 |
| ink on reward | 10.95 |
| danger on bg | 4.90 |
| success on bg | **4.17, UI/large only.** Darken to about #17784A for text (not computed). |
| hero fill on bg | 2.11 FAIL |

**Dark mode**

| Token | Hex |
|---|---|
| bg | #0C1617 |
| surface | #152122 |
| ink | #ECF6F5 |
| muted | #9BB0AD |
| hero | #3FDCCB |
| onHero | #032220 |
| tint | #0F3936 |
| secondary | #A5A2FF |
| action | #FF9166 |
| reward | #FFD466 |
| success | #5CD68E |
| danger | #FF7A85 |

| Pair | Ratio |
|---|---|
| ink on bg | 16.69 |
| muted on bg / surface | 8.06 / 7.24 |
| hero on bg | 10.77 |
| onHero on hero | 9.82 |
| secondary on bg | 8.06 |
| onAction on action | 8.51 |
| onHero on reward | 11.86 |
| danger on bg | 7.33 |

**Risk:** teal plus a separate green success color makes two greenish hues. It is also closer to generic health/fintech teal.

### Candidate C — "Ultramarine Sunrise" (blue-violet hero, jade secondary)

**Light mode**

| Token | Hex |
|---|---|
| bg | #F8F7FC |
| surface | #FFFFFF |
| ink | #161833 |
| muted | #565A73 |
| **hero** | **#4F5BEF** (L0.55 C0.219 H273) |
| hero bright (illustration) | #7480FF |
| tint | #E6E8FF |
| ink-on-tint | #3F4AD6 |
| secondary (jade) fill | #13A57C |
| secondary deep (text) | #0B7A5A |
| action | #FF8A3D |
| reward | #FFCB47 |
| success | #14804F |
| warning | #A75F00 |
| danger | #C93545 |

| Pair | Ratio |
|---|---|
| ink on bg | 16.25 |
| muted on bg | 6.34 |
| white on hero | 5.15 |
| hero on bg | 4.83 |
| #3F4AD6 on tint | 5.49 (hero on tint only 4.26) |
| ink on tint | 14.31 |
| white on #0B7A5A | 5.32; #0B7A5A on bg 4.99 |
| dark on action | 7.84 |
| ink on reward | 11.45 |
| success on bg | 4.66 |
| danger on bg | 4.83 |
| white on secondary fill #13A57C | 3.13 (large only) |
| secondary fill as text | 2.94 FAIL |

**Dark mode**

| Token | Hex |
|---|---|
| bg | #0F1024 |
| surface | #191B33 |
| ink | #EEEFFF |
| muted | #A3A6C4 |
| hero | #9DA6FF |
| onHero | #10133A |
| tint | #262B5E |
| secondary | #43D6A8 |
| action | #FF9E5E |
| reward | #FFD670 |
| danger | #FF7A85 |

| Pair | Ratio |
|---|---|
| ink on bg | 16.45 |
| muted on bg / surface | 7.87 / 7.07 |
| hero on bg | 8.33 |
| onHero on hero | 7.93 |
| ink on tint | 11.59 |
| secondary on bg | 10.20 |
| onAction on action | 9.24 |
| onHero on reward | 12.84 |
| danger on bg | 7.48 |

**Strengths:** the most distinctive among Pakistani apps, and it has zero political-color risk. **Weakness:** loses the "path/nature/growth" meaning of green. Blue-violet at C 0.22 is close to the neon threshold, so use it sparingly.

### Recommendation: A "Jade Spark"

1. **Continuity:** it keeps the team's green identity and warm paper, but moves the hero from L0.52/C0.096 to L0.71/C0.147. That is the measurable "aliveness" jump, while staying under the neon band (Careem C0.203, Feather C0.229, Spotify C0.212).
2. **Meaning:** green = growth/path ("raah"), jade leans toward the WGSN 2026 teal trend, and the shift away from flag/PML-N green keeps it non-political. Coral is sunrise, not party red, and is never used as a co-equal stripe with green.
3. **Energy hierarchy is game-native:** jade = you/progress, coral = "do this", sunflower = reward/celebration (Pakistani festive gold), indigo = info/stream insights (a cool hue for the "explainable recommendation" screens, which calms them).
4. **Accessibility is designed in:** the primary button uses ink on jade (7.08:1), and the text shade is #007D58 (5.15:1 with white). Dark mode keeps the same hue angle (H164) for the hero.
5. **Usage ratio guidance:** about 70% neutrals, 15–20% jade (fills + tints), 5–10% coral (CTAs only), and ≤5% sunflower (stars, XP, badges). Reserve full-bleed jade/sunflower gradients for celebration screens (the Careem takeover rule; Spotify Wrapped as a seasonal layer).
6. **Validate:** show A/B/C mock screens to about 20 teens and ask them to pick "fun", "calm" and "trustworthy". That gives the FYP report primary evidence and replaces the unverifiable Gen-Z statistics.

---

## 6. Logo research and concepts

### What makes great youth-app icons and wordmarks
- **One bold, simple shape plus one hero color.** Examples: Duolingo's Duo face, Careem's "C" wink (kept almost unchanged in the 2023 rebrand, [Gulf Business](https://gulfbusiness.com/?p=253390)), Spotify's three arcs, NayaPay's arrow emblem "Dyno" with icons derived from its geometry ([NayaPay](https://www.nayapay.com/news/NayaPay-Reborn)).
- **Legible at 48 px and below:** at most 2–3 elements, strokes ≥ about 8% of icon width, no text inside the icon, no thin Nastaliq detail.
- **Android adaptive icon** ([developer.android.com](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)):
  - 108×108 dp foreground and background layers
  - keep the artwork in the **central 66×66 dp safe zone** (masks crop to circle, squircle, etc.)
  - provide a **monochrome layer** for Android 13+ themed icons; Android 16 QPR2 auto-themes apps that lack one
  - so the mark must work as a single flat silhouette
- **iOS 26:** icons are rendered in Light/Dark/Clear/Tinted modes ([MacStories](https://www.macstories.net/stories/ios-and-ipados-26-the-macstories-review/4)). A silhouette-first mark with strong contrast survives tinting.
- Rounded geometry reads as friendly and playful (Duolingo, Headspace). Geometric precision reads as trustworthy, which matters for the recommendation side.

### Three logo concept directions

**1. "Spark Path"**: a winding route ending in a spark. One thick rounded stroke forms an S-curve path (the journey through the game's life story), ending in a 4-point spark/star (the "found it", yaab moment).
- Icon: jade path on paper, or paper path on jade, with a sunflower spark.
- Monochrome: path + spark silhouette.
- Scales well. The spark doubles as the reward/XP glyph and the loading animation (the path draws, then the spark pops).
- The most "game" of the three.

**2. "Nuqta Compass"**: the Urdu dot as destination. The Nastaliq nuqta is a rotated diamond. Use it as the brand atom: a jade diamond "dot" sitting at the end of a curved stroke inspired by the tail of ب / ی in راہ یاب. The diamond also reads as a compass needle/north point.
- Bilingual lockup: Latin "Rahyaab" + Nastaliq "راہ یاب" stacked or side by side.
- Very culturally specific and ownable. The icon is just the diamond plus one curve, so it is very legible at 48 px.
- Risk: it needs careful drawing by someone who knows Nastaliq.

**3. "Fork Monogram"**: the stream choice. A lowercase "r" or a "Y" made of a path that branches into 3–5 rounded lines (Pre-Medical, Pre-Engineering, ICS, Commerce, Humanities). One branch is highlighted in coral or sunflower ("your recommended path").
- Communicates the product literally, and the highlighted branch can animate per user result, so the mark becomes part of the explainable-recommendation UX.
- Risk: it gets busy beyond 3 branches. Use 3 in the icon and show the full set only in illustration.

### Wordmark and fonts (Google Fonts; licenses to confirm on each specimen page)

| Use | Font | License | Notes |
|---|---|---|---|
| Nastaliq "راہ یاب" | **Gulzar** | SIL OFL 1.1 ([Fontsource](https://fontsource.org/fonts/gulzar/about)) | Modern Nastaliq designed for screens (Borna Izadpanah, Fiona Ross et al.). Best for a display wordmark. |
| Nastaliq UI text | **Noto Nastaliq Urdu** | SIL OFL 1.1 ([Google Fonts](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu/about), [Fontsource](https://fontsource.org/fonts/noto-nastaliq-urdu/about)) | Very tall line height. Budget about 1.8–2× line-height for Urdu UI text. |
| Urdu fallback (compact) | Noto Naskh Arabic | OFL (per [Fontsource](https://fontsource.org/fonts/noto-naskh-arabic/about)) | Naskh is more compact for dense UI, but less "Pakistani" in feel. |
| Latin wordmark, friendly rounded | Fredoka / Nunito / Baloo 2 | OFL (Google Fonts standard; verify) | Fredoka and Baloo 2 are bold and rounded, gamey like Duolingo. Baloo Bhaijaan 2 covers Arabic script, so it can match bilingual weights. |
| Latin wordmark, geometric-modern | Plus Jakarta Sans / Outfit / Sora / Lexend | OFL (verify) | More "trustworthy recommendation" feel. Lexend was designed for reading ease. |

**Wordmark suggestion:** "rahyaab" in lowercase Fredoka SemiBold or Outfit Bold. Tighten the double "aa" into a ligature, or make the second "a" counter a jade dot that echoes concept 2's nuqta. Pair it with Gulzar "راہ یاب" at an optically matched x-height, with Urdu on the right in RTL lockups. Keep Nastaliq out of the 48 px icon; it belongs in the splash screen and wordmark.

---

## Method appendix
- Scripts: a WCAG 2.x contrast and OKLCH converter in the session scratchpad (`pal.py`, `pals.json`). Ratios use the sRGB relative-luminance formula (0.2126R + 0.7152G + 0.0722B, linearized) and (L1+0.05)/(L2+0.05).
- Unverified / not found: official hex values for Headspace, Calm, Finch, Quizlet, Notion, Arc, BeReal, Brainly, Photomath, Khanmigo, Bykea, Maqsad, Taleemabad and Tapmad, and NayaPay/SadaPay exact hexes (only described in words).
