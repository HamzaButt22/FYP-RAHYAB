# Rahyaab brand guidelines

Rahyaab (راہ یاب, "the one who finds the way") is a career guidance app for Pakistani students in classes 8 to 12. Students play "Your Year", a story game, and get stream and course suggestions they can talk through with their family. This system is the single source for its colours, type, logo, mascot and core components, in light and dark.

**Promise:** Find your raah, and bring your family with you.
**Taglines:** "Play your year. Find your raah." (English-led) · "Apni raah. Apni kahani." (Urdu-led)

## Who it is for, and what that means for design

- **Students in classes 8 to 12 (about 13 to 18), mostly on mid and low-end Android phones, often shared.** Keep screens light: flat colour, SVG art, no heavy imagery. Every tap target is at least `touch-min` (48px). Text never goes below `caption` (12px).
- **They want to be treated as near-adults.** No cartoon pep, no streaks, no leaderboards, no "great job!". Hudhud is a calm older-cousin guide, not a cheerleader.
- **Parents decide and pay.** Parent and teacher screens use the same tokens but stay quieter: `bg` and `surface`, `text`, `secondary-text` for fit labels, the logo only and no mascot.
- **Bilingual.** The student app has two languages, chosen on S-01: **English** (with Roman Urdu dialogue) and **Urdu** (Urdu script, right-to-left, read aloud by an Urdu voice; SRS FR-01, `design/specs/accessibility.md`). Parent views are Urdu-first. Set Urdu text in the `urdu-*` styles only (title, body-l, body, label); Nastaliq needs the tall line height. Roman Urdu is never read by a text-to-speech voice.
- **Bright outdoor light and cheap screens.** Every text pair below is WCAG AA (4.5:1) or better in both themes. Graphics that carry meaning are 3:1 or better. `accent` (saffron) is only about 1.6:1 on `bg`, so it is decorative: a saffron "new" dot always has a 1.5px `text`-coloured ring or a "New" label. The high-contrast theme (`contrast` in tokens.json) gives 7:1 text and ≥ 3:1 control borders.

## Colour

Terracotta leads, teal answers, saffron sparks. Never add a fourth hue to the UI.

- **Grounds:** `bg` for screens, `surface` for cards and sheets, `sunken` for inputs, tracks, chips and the Hudhud note. Light mode is parchment, not white; dark mode is a deep teal night, not black.
- **Text:** `text` on `bg`, `surface` and `sunken`. `muted` for secondary text and for control borders.
- **Terracotta (`primary`):** the one primary button per screen and selected states. The two choice cards (Dil and Duniya) are **equal in weight**: both use a `surface` card with a 2px border in the voice's colour and the voice's icon and name, so neither looks like the default or "right" answer. Put `on-primary` on it. For terracotta words and links use `primary-text`, never `primary`.
- **Teal (`secondary`):** secondary buttons, the Duniya choice, info. Put `on-secondary` on it. For teal words and "strong fit" labels use `secondary-text`.
- **Saffron (`accent`):** highlights only, such as a "new" dot, celebration confetti and the mascot's crown. It is never a text colour. Put `on-accent` on it if text is unavoidable.
- **States:** `success` and `danger` are text and icon colours on `bg` and `surface`; always pair them with a word or an icon, never colour alone.
- **Focus:** a 2px solid `focus` ring with a 2px offset on every interactive element.
- **Dark mode:** `primary` and `secondary` get lighter, and their `on-` tokens flip to the dark ground colour. Do not reuse light-mode white text on dark-mode fills.

| Pair | Light | Dark |
|---|---|---|
| `text` on `bg` | 13.9 | 14.9 |
| `muted` on `bg` | 6.4 | 8.1 |
| `on-primary` on `primary` | 5.3 | 5.9 |
| `on-secondary` on `secondary` | 5.1 | 7.0 |
| `primary-text` on `bg` | 5.6 | 7.7 |
| `secondary-text` on `bg` | 5.6 | 9.2 |
| `on-accent` on `accent` | 8.5 | 9.4 |
| `success` on `bg` | 4.6 | 9.2 |
| `danger` on `bg` | 5.8 | 7.7 |

## Logo: the Branch

An **r** drawn as a living branch: the dotted line straight up is the path everyone expects, and the branch that curves away and grows leaves is the path you choose. Its colours adapt to the ground, so the logo always holds 3:1 or better.

| Ground | Twig | Leaf | Asset |
|---|---|---|---|
| Light (`bg`, white, sky, yellow, pink) | `#8A5A3A` (`logo-twig`) | `#3E8A5A` (`logo-leaf`) | `brand/logo/svg/branch-light.svg` |
| Dark (`bg` dark, black, navy, forest) | `#FBF3E6` | `#6FCF97` | `brand/logo/svg/branch-dark.svg` |
| Terracotta tile | `#FFFFFF` | `#FBD9A8` | `brand/app-icon/svg/icon-terracotta.svg` |

- **App icon:** `brand/app-icon/svg/icon-ios-expo.svg` (branch on parchment) is the default store icon; `brand/app-icon/svg/icon-terracotta.svg` is the alternative; `brand/app-icon/svg/icon-dark.svg` is for dark launchers.
- **Wordmark:** "rahyaab" in lowercase, `display` family at 800, letter-spacing −4%, set to the right of the branch with a gap of half the mark's width. Urdu lockup: راہ یاب in `urdu`.
- **Minimum size:** 24px. Below 32px, drop the dotted line.
- **Do not:** recolour the branch outside this table, put it on a photo, add a shadow or outline, or use the textured versions (road, log, pencil) as the logo. Those are illustration only.

## Mascot: Hudhud

A chubby hoopoe (B2). In Attar's *Conference of the Birds* the hoopoe guides the birds on a long journey to find their king and they discover it was themselves; Rahyaab's promise in one story. Hoopoes live across Pakistan.

- **Colours:** body `mascot-body`, wing, beak, tail and crest tips `mascot-ink`, wing bars and belly `mascot-light`. On dark grounds the body brightens to `#D9643F` and the bird gets a 1.5px `mascot-outline` die-cut edge (`brand/mascot/svg/hudhud-dark.svg`), so the dark wing and beak never disappear.
- **Poses in this system:** the default `hudhud-light` / `hudhud-dark` (profile) plus nine poses: `listening`, `curious`, `thinking`, `reading`, `headphones`, `sleeping`, `waving`, `celebrating` (Blueprint reveal only) and `messenger`. Where each one is used is listed in `mascot/README.md`, which is the single source for pose use.
- **Expression comes from the crest and head angle, never a smile:** folded = listening, half = curious or thinking, full fan = delighted (rare).
- **Where:** onboarding, the Hudhud note strip in scenes, loading, empty states, the Blueprint. **Never** on parent or teacher screens, error dialogs about money, or consent screens.
- **Size:** 56px in the HudhudNote strip (components.md), 96 to 160px in empty states and loading. Never smaller than 32px (icon-size uses only).

## Type

- `display` (Bricolage Grotesque 800) for `display-xl`, `display-l` and `heading`: one display style per screen. `heading` carries scene narration.
- `sans` (Plus Jakarta Sans) for everything else: `title`, `body-l` for choices and reading, `body` as the default, `label` for buttons and tabs, `caption` for small caps meta.
- `urdu` (Gulzar) for all Urdu via `urdu-body`, right to left.
- A fourth font, **Atkinson Hyperlegible**, is the optional reading font (You → Accessibility, FR-97); it covers Latin text only.
- All four are free Google Fonts under the OFL; bundle them in the app (do not load from the network at runtime). Budget: only the weights in use (Bricolage 800; Jakarta 500, 600, 700; Gulzar 400; Atkinson 400), subset to the scripts needed, about 1.2 MB in total.

## Space, shape, depth

- Screens use a 16px side gutter (`screen-gutter`, `space-4`); sections are `space-5` apart.
- `radius-md` for buttons and inputs, `radius-lg` for cards and choice cards, `radius-xl` for sheets and Blueprint slides.
- Flat by default. Light mode may lift a card on `bg` with `shadow-card`; dark mode separates with `border` instead. No 3D button lips, no gradients.

## Voice

Hudhud speaks like a calm, well-travelled older cousin, in English with light Roman Urdu. Short sentences. It never judges, never says "correct" or "wrong", and never claims more certainty than the model has.

- First launch: "Salaam! I'm Hudhud. Birds have followed me on long journeys before. This one's yours."
- Planner: "Three things this week. You can't do everything, and nobody can."
- Surprise: "Oh, didn't see that coming. Good. Tell me more next week."
- Blueprint close: "A starting point, not a verdict. Ghar walon ko dikhao?" (family, not a fixed pair of parents, so it fits every household)
- Error: "Something broke on our side. Try again?"

UI copy says what happens: "Start week 2", "Link a parent", "Save path". No emoji in UI text.

## Iconography

Use **Lucide** (ISC licence; `lucide-react-native` in the app, `lucide-react` on the dashboard): outline, 2px stroke, rounded joins, 24px, coloured `text` or `muted`, and `primary-text` when active. Always pair icons with a text label in navigation and results.
