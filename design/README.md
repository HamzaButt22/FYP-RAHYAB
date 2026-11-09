# Rahyaab design files

Everything a developer needs to build Rahyaab's look, in one folder. Nothing outside `design/` was changed.

**Final brand:** the Branch logo, the chubby Hudhud mascot, and the terracotta and teal palette with light and dark modes.
**Live references:**
- [Figma](https://www.figma.com/design/X9jZDn1tm89JOfKNlmpq36?node-id=2-2)
- `previews/index.html` (open it in a browser)

## What's here

| Folder | What | Editable masters |
|---|---|---|
| `brand/logo/` | Branch logo: light, dark, on terracotta, one colour, lockups | `svg/` (PNG exports in `png/`) |
| `brand/app-icon/` | iOS/Expo icon, Android adaptive set, splash and favicon | `svg/`; `README.md` explains how to swap them into `assets/` |
| `brand/mascot/` | Hudhud in 10 poses × light/dark | `svg/` (PNG @1x/@2x/@3x in `png/`) |
| `brand/store/` | Google Play feature graphic | — |
| `brand/BRAND_GUIDELINES.md` | Rules for colour, logo, mascot, type, voice | — |
| `tokens/` | Design tokens: `tokens.json` (master), `tokens.dtcg.json` (Figma / Tokens Studio), `tokens.css` (web), `theme.ts` (React Native) | `tokens.json` |
| `screens/` | The 55 app, parent, dashboard, admin and tablet screens in light and dark, the PNG exports, and the 8 Play Store screenshots | `screens/*.html` and the Figma file |
| `specs/` | Component specs, responsive rules, accessibility and accommodations (`accessibility.md`), and forms, errors and help (`forms-and-errors.md`) | — |
| `figma/` | Figma link, plus importable copies of the design-system sheet and the screens | the Figma file |
| `previews/` | Live, responsive previews in light and dark | — |
| `game/GAME_DESIGN.md` | The final game design (v3): format, story, characters, tasks, frameworks, ML models, datasets, validation, scope | text |
| `game/frameworks/` | RIASEC, Dil/Duniya pair schedule, abilities, work values, streams and gates, scoring settings, as JSON | JSON |

`APPROVED.md` lists every approved design and its editable master.

Project documents, research, and the engineering design (architecture, API, security, tests) are in `docs/`. Start with `docs/README.md`.

## Using it in the app

1. **Fonts:**

   ```bash
   npx expo install expo-font @expo-google-fonts/bricolage-grotesque @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/gulzar
   ```

2. **SVG logo and mascot:**

   ```bash
   npx expo install react-native-svg
   ```

   Then add `react-native-svg-transformer` to import `.svg` files as components.

3. **Theme:**
   - Copy `tokens/theme.ts` to `src/theme/theme.ts`.
   - Read `useColorScheme()` and `useWindowDimensions()`, then call `getColors(scheme)` and `getLayout(width)`.
   - Never hard-code a hex value in a component.

4. **Icons:** follow `brand/app-icon/README.md` when you want the new icons in the build.

## Changing something

**Colours, type, spacing:**
1. Edit `tokens/tokens.json` first.
2. Mirror the change in `tokens.css`, `theme.ts` and `tokens.dtcg.json`.
3. Update the Figma variables.

**Logo or mascot:**
1. Edit the SVG in `svg/` (Figma, Illustrator, Inkscape or any text editor).
2. Re-export the PNG sizes listed in each folder's README.

## Still to design

- **Scene illustrations and the avatar builder:** the screens use placeholder shapes for these.
- **High-contrast theme tokens:** NFR-64 needs 7:1 contrast; see `specs/accessibility.md`.
- **Urdu (right-to-left) versions** of the screens.

Icons are decided: **Lucide** (ISC licence; `lucide-react-native`), outline, 2px stroke, 24px (SRS §8.7).
