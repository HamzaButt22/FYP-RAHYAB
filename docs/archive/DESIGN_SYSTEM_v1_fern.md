> **Superseded.** Kept for history only. See `design/` and `docs/project/` for current documents.

# Rahyaab design system (v1, 31 Oct 2026)

"Soft-tech, breathable minimalism" for a career app that teenagers (14–18) play rather than take. Calm, warm and intelligent; never a dark cyber dashboard, never a classroom test.

Implementation: `src/theme/tokens.ts` (React Native) and `design/tokens.json` (W3C design-token format). Components read **semantic tokens only** (`color.surface.raised`, `color.action.fill`), never raw hex.

---

## 1. Color strategy

**Harmony: split-complementary, warm side forward.** The brand anchor is **Fern** (hue 160°, growth, calm, "go"). Its complement sits at about 340°, so the split pair is about 310° and 10°. The 310° side is purple-magenta, which would dilute the identity, so it is pulled toward a **desaturated rose (Clay, 350°)** and used only as a quiet secondary. The 10° side carries energy as **Coral (14°)**, the single colour that means "do this now". **Honey (39°)**, an analogue of Coral, is reserved for rewards. Neutrals are warm (paper and soil), not blue-grey slate.

**Psychology, grounded in the research:** colour-mood claims (for example "red lowers test scores") failed replication, so colours were chosen for **contrast, colour-blind safety, cultural fit and consistency**, not claimed calming effects. Green reads positively in Pakistan; Fern is deliberately not flag green, to avoid an "official" look. Warm off-white grounds feel less clinical than pure white.

**Identity rule:** at most **one strong hue per screen** besides neutrals: Fern for structure, *or* Coral for the one primary action. Clay and Honey appear only as soft tints or small marks. No purple, no neon, no gradients.

### Palette

| Role | Token family | Light | Dark | Use |
|---|---|---|---|---|
| Primary brand | `brand` | Fern `#1F7A5C` | `#5CC59A` | Identity, selected states, progress, links |
| Brand soft | `brand.soft` / `brand.ink` | `#E3F1EA` / `#145741` | `#17352A` / `#8FDDB9` | Tinted cards, chips, "strong match" |
| Secondary | `clay` | Clay `#A65562` | `#E39AA5` | Rare accents (people, family, notes) |
| Secondary soft | `clay.soft` / `clay.ink` | `#F7E8E6` / `#8A3F4B` | `#3A2427` / `#F0B8C0` | Family and parent surfaces |
| Accent 1, action | `action` | Coral `#C8502C` | `#FF8A66` | The one primary button per screen |
| Action soft | `action.soft` / `action.ink` | `#FCE7DF` / `#9A3A1E` | `#3D2016` / `#FFB49B` | Pressed and hover backgrounds |
| Accent 2, reward | `reward` | Honey `#F2B544` | `#F5C25E` | Unlocks, Blueprint reveal, milestones (fills only) |
| Reward soft | `reward.soft` / `reward.ink` | `#FDF1D6` / `#7A5200` | `#3A2C10` / `#F5C25E` | Achievement badges |
| Canvas | `surface.canvas` | Paper `#FBF8F3` | Soil `#141210` | App background |
| Raised | `surface.raised` | `#FFFFFF` | `#1D1A17` | Cards and sheets |
| Sunken | `surface.sunken` | `#F3EEE6` | `#26221E` | Inputs, segmented controls, tracks |
| Border | `border.subtle` | `#E6DFD4` | `#3A342D` | Hairlines (only when needed) |
| Text | `text.primary` / `.secondary` / `.tertiary` | `#1F1B16` / `#5E564C` / `#7A7064` | `#F5F0E8` / `#BDB3A6` / `#9A9084` | Body, supporting, captions |
| Success | `status.success` | = brand `#1F7A5C` | `#5CC59A` | Saved, done (always with an icon) |
| Warning | `status.warning` | `#7A5200` on `#FDF1D6` | `#F5C25E` on `#3A2C10` | "Worth a chat" |
| Danger | `status.danger` | `#B3261E` | `#FF8A80` | Destructive actions only (delete account) |
| Info | `status.info` | `#2F6E8F` | `#8CC8E8` | Neutral notices |

**On-colour text:** white on `brand` (5.25:1), `action` (4.53:1), `clay` (5.13:1) and `danger` (6.54:1). `text.primary` on `reward` (9.35:1); **never white on Honey**. Dark mode uses dark ink on fills: `#0E1F17` on brand (8.07:1), `#2A0E05` on action (7.80:1), `#2A1C00` on reward (10.09:1), `#2A0E12` on clay (8.06:1).

### Verified contrast (WCAG 2.2 AA, computed)

| Pair | Light | Dark |
|---|---|---|
| text.primary on canvas / raised | 16.16 / 17.12 | 16.47 / 15.27 |
| text.secondary on canvas / raised | 6.81 / 7.21 | 9.04 / 8.38 |
| text.tertiary on raised / canvas | 4.85 / 4.58 | 5.52 |
| brand on raised / canvas / sunken | 5.25 / 4.96 / 4.55 | 8.17 / 8.82 |
| brand.ink on brand.soft | 7.30 | 8.37 |
| clay.ink on clay.soft | 6.10 | 8.43 |
| action.ink on action.soft | 5.88 | 8.65 |
| reward.ink on reward.soft | 6.17 | 8.25 |
| danger on raised | 6.54 | 7.59 |

Every text pairing passes 4.5:1. `text.tertiary` is the floor for any text; nothing lighter carries words.

### Dark mode adjustments (explicit)

- Grounds become **warm soil** (`#141210`, `#1D1A17`), not slate or indigo.
- Fills get **lighter and slightly less saturated** (Fern `#1F7A5C` → `#5CC59A`) so they glow less and still reach 8:1 against the ground.
- Text on fills flips from white to **near-black ink**.
- Elevation comes from **lighter surfaces, not shadows** (shadows disappear on dark).
- Soft tints become **deep tints** (`brand.soft` `#17352A`) so chips stay readable without glowing.
- Users choose **Light, Dark or System** (default System) in You → Look.

---

## 2. Applying colour for breathing room

1. **Neutral first, about 85 / 10 / 5.** About 85% of any screen is canvas and raised surfaces, about 10% brand tints and text, and at most 5% Coral or Honey. If a screen looks busy, remove colour before removing space.
2. **One action, one Coral.** Each screen has exactly one Coral button: the next step ("Continue Thursday", "Lock my week"). Secondary actions are text buttons or outlined neutrals.
3. **Honey only rewards.** It appears when something is earned or unlocked (Blueprint reveal, a week completed), never for navigation, so it keeps its meaning.
4. **Tint, don't paint.** Cards sit on `surface.raised`; status appears as a small soft-tint chip (`brand.soft` + `brand.ink`), never as a fully coloured card.
5. **Separation by space, not lines.** Use 16–24 px gaps and surface contrast before borders. Borders are `border.subtle` hairlines, used for inputs and tables only.
6. **Game scenes are calmer still.** During play the UI recedes: canvas ground, one soft illustration area, one action. No HUD clutter, no timers, no red/green right/wrong signals; feedback is motion and haptics plus a neutral word ("Clicked in").
7. **Never colour alone.** Match strength uses a word ("Strong match") plus a segmented bar; status uses an icon plus a label (about 1.4–5.75% of Pakistani males have some colour-vision deficiency).

---

## 3. Foundations

| Token | Values |
|---|---|
| Type | Headings **Bricolage Grotesque** 700; body **Inter** 400/500/600; Urdu **Noto Nastaliq Urdu** (line-height 1.8, never in fixed-height boxes) |
| Type scale (px) | 12 caption · 14 small · 16 body · 18 lead · 22 title · 28 headline · 36 display · 44 hero |
| Spacing (4 px base) | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72. Screen padding 20; card padding 16–20; section gap 24–32 |
| Radius | 12 small (chips, inputs) · 18 buttons · 22 cards · 28 hero sheets · 999 pills |
| Touch targets | ≥ 48 dp (buttons 52–56 dp tall) |
| Elevation | Light: one soft shadow for floating sheets only (`0 8 24 rgba(31,27,22,0.08)`). Dark: none; use `surface.sunken` / `raised` steps |
| Motion | 150–250 ms ease-out for state changes; 400 ms spring for reward reveals; all motion off under "reduce motion" |
| Haptics | Light tick on selection; medium on lock-in; success pattern on unlocks |
| Icons | 24 px outline, 2 px stroke, rounded caps |
| Copy | 6th-grade reading level, second person, no "test", "question", "score" or "correct" |

---

## 4. Gamified components (how progression looks without stress)

| Component | Tokens | Rule |
|---|---|---|
| **Week planner card** | raised; selected = `brand` 2 px ring + `brand.soft` fill | Choices, not answers; no right option |
| **Energy dots** | filled `reward`, empty `surface.sunken` | Shows a limit, not a score |
| **"Rahyaab knows you" meter** | track `surface.sunken`, fill `brand` | Progress = how sure the model is about you, so more play makes results more reliable (honest ML progress) |
| **Inner voices** (scene choices) | two soft bubbles: `brand.soft` and `clay.soft` | Two perspectives ("what I'd enjoy" / "what's expected"), never good vs bad |
| **Unlock / Blueprint reveal** | `reward` fill with `text.primary`, 400 ms spring | The only celebratory moment |
| **Match bands** | 5-segment bar, `brand` (strong) or `brand` at 60% (good) + label | Words and segments, no percentages |
| **Primary button** | `action.fill` / `action.on` | One per screen |
| **Secondary button** | raised + `border.subtle` + `text.primary` | Everything else |

No streaks, leaderboards, loot boxes or countdowns (UK Children's Code; SRS ethical rules).
