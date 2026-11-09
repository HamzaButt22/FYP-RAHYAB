# Responsive rules

One design adapts to every screen. Get the rules from `getLayout(width)` in `design/tokens/theme.ts`, or from the same breakpoints in `tokens.css`.

| Size class | Width | Layout |
|---|---|---|
| `compact` | 0px and up | Small phones under 360px (older Androids). Single column, 16px gutter, scale display type down one step. |
| `phone` | 360px and up | Most phones 360–599px. Single column, 16px gutter, bottom tab bar. |
| `tablet` | 600px and up | Tablets and foldables 600–1023px. Content max 640px centred, 24px gutter, two-column cards where useful. |
| `desktop` | 1024px and up | Web dashboard for teachers and schools, 1024px and up. Side navigation, 12-column grid, content max 1200px. |

## Rules for every screen

1. **Single column first.** Design at 360px, then let tablet and desktop add room, not new content.
2. **Side gutters:** 16px on compact and phone, 24px on tablet, 32px on desktop. Respect safe areas (notches, home indicator) with `react-native-safe-area-context`.
3. **Max width:** student screens never stretch wider than 640px. Centre them on tablet and web. Teacher dashboards use up to 1200px.
4. **Touch:** every control is at least 48 × 48px, with 8px or more between targets.
5. **Text scaling:** support the OS font size up to 200%.
   - Body text simply grows.
   - Display styles (`display-xl`, `display-l`) cap their scale at 1.3 with `maxFontSizeMultiplier`, so headings don't push content off screen.
   - Nothing truncates important text; it wraps instead.
6. **Compact phones (under 360px):**
   - display type is multiplied by `displayScale` (0.85);
   - Dil and Duniya cards stack vertically;
   - the mascot strip hides the bird and keeps the line.
7. **Orientation (WCAG 1.3.4):** the app is not locked. In landscape on phones and tablets, reading and story screens use the tablet two-pane layout (scene on the left, choices on the right); task screens keep their board centred and letterboxed with controls beside it. Rotation is tested on every screen in usability round 1.
8. **Urdu and RTL:** Urdu screens mirror the layout (`I18nManager.forceRTL` for Urdu-only views) and use `urdu-body`, whose line height is 34 at 18px. Numbers stay as Western digits.
9. **Dark mode:** follow the system setting by default, with an override in You → Look.
   - Use `getColors(scheme)`.
   - Swap `branch-light` ↔ `branch-dark` and `hudhud` ↔ `hudhud-dark`.
10. **Images:**
    - use SVG for the logo and mascot (`react-native-svg`);
    - use the PNG @1x/@2x/@3x exports only where SVG is not possible (notifications, share images).

## Device test list

| Device | Width | Notes |
|---|---|---|
| Small Android (e.g. Galaxy A03) | 320–360px | compact class, 720p, low RAM |
| Typical Android (e.g. Redmi Note) | 393px | phone class, the main target |
| iPhone 15 | 393px | phone class, notch and home indicator |
| Android tablet / iPad mini | 744–800px | tablet class |
| Laptop browser (teacher dashboard) | 1280–1440px | desktop class |

`design/previews/home.html` shows the sample Home screen at each of these widths.

**Choice cards:** side by side only when the window is at least 400px wide and the font scale is at most 1.15; otherwise stacked (components.md).
