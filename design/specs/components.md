# Component specs

Built from the tokens in `design/tokens`. Every component works in light and dark, at every size class. To see them live, open `design/previews/index.html`.

## Button

One primary action per screen in terracotta; a teal outline for the alternative; a quiet text button for skipping.

- **Primary:** `primary` fill, `on-primary` label, `radius-md`, height `touch-min`, label style `label`. Use once per screen (Start week, Continue, Save path).
- **Secondary:** transparent with a 1.5px `secondary` inset border and `secondary-text` label.
- **Quiet:** text only in `primary-text`, still 48px tall for touch.
- **Disabled:** `sunken` fill and `muted` label. Explain why nearby instead of hiding the button.
- **Focus:** 2px `focus` ring, 2px offset.
- **Consumer provides:** the label (a verb that says what happens), and the handler. No icons-only buttons without an accessible name.

## ChoiceCard

The two inner voices in a scene: Dil (heart) in terracotta and Duniya (world) in teal, shown as a pair.

- Always show exactly two: side by side when the window is at least 400px wide **and** the font scale is at most 1.15; stacked otherwise (so 360px phones and large text stack). responsive.md uses the same rule.
- **Equal weight:** both cards use a `surface` fill, `text` colour and a 2px border in the voice's colour (`primary` for Dil, `secondary` for Duniya), with the voice's icon and name. Neither card is filled, so neither looks like the default or recommended answer (choice bias would distort the interest model). The voices swap left and right between scenes; the colours stay with the voice. A chosen card gets a filled check icon and the `selected` state for TalkBack.
- Label in caps (`caption` weight 700), line in `body` weight 600, quoted.
- Selected: a 3px `text` outline with a 3px offset, plus `aria-pressed="true"`. Never show which is "right".
- **Consumer provides:** both lines, which side each voice is on, and the selection handler.

## KnowsYouMeter

How sure the model is about the student, shown as 12 segments in the hoopoe's barred-wing pattern.

- Filled segments `text`, empty `sunken`, radius 4px, gap 4px, height 12px.
- The value comes from the interest model's real certainty; it may go down. Never animate it up without new play.
- Always show the words ("7 of 12") next to it, and expose it as `role="meter"`.
- **Consumer provides:** current value (0 to 12).

## HudhudNote

The mascot's one-line comment, docked at the bottom of scenes, the planner, loading and empty states.

- `sunken` strip, `radius-lg`, Hudhud at 56px on the left (use `hudhud-light.svg` in light, `hudhud-dark.svg` in dark), name in `muted` caption, line in `body` weight 600.
- One line, under 90 characters. Voice rules are in the brand book.
- Never on parent, teacher, payment or consent screens.
- **Consumer provides:** the line and the current theme's mascot asset.

## PathCard

One recommended stream or course in the Blueprint, Explore and the parent report.

- `surface` card, `radius-lg`, `shadow-card` in light, `border` hairline in dark.
- Title in `title`; fit label in `secondary-text` as words ("Strong fit", "Good fit", "Worth a look"), never a percentage.
- Description in `muted` `body`; "Why we think this" link in `primary-text` opens the explanation.
- **Consumer provides:** path name, fit level, a one-sentence description, the explanation link.

## LogoLockup

The Branch mark with the lowercase wordmark and the Urdu name; the three app icons below.

- Use `branch-light.svg` on light grounds and `branch-dark.svg` on dark ones (adaptive colours table in the brand book).
- Wordmark in `display` 800, letter-spacing −4%, gap between mark and word half the mark's width.
- App icons: `app-icon.svg` (default), `app-icon-terracotta.svg` (alternative), `app-icon-dark.svg` (dark launchers).
- Minimum mark size 24px; below 32px drop the dotted line.

## Screen shell

- **Top bar:**
  - 56px tall;
  - logo at 28px on the left, the week chip in the centre on tablet and up, the avatar on the right;
  - `bg` background, no border until the content scrolls under it.
- **Bottom tab bar** (phone and compact):
  - 64px plus the safe-area inset;
  - 4 tabs: Home, Explore, Family, You;
  - icons 24px with `label` text;
  - active tab: `primary-text` label in bold, a filled icon and a 3px pill indicator above it; inactive tabs: `muted`, outline icons. Colour is never the only cue (the two text colours differ by only about 1.1:1). The active tab exposes `accessibilityState={{ selected: true }}`;
  - `surface` background with a top hairline in `border`.
- **Side navigation** (desktop):
  - 248px wide, on `surface`;
  - the same destinations as the tab bar, plus Classes and Reports for teachers.
- **Content:**
  - side gutter from `getLayout()`;
  - sections `space-5` apart;
  - cards with `radius-lg`.
