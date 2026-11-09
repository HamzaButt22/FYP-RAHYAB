# Approved designs

Everything the team has signed off, and where its editable master lives. When something here changes, update this file in the same PR.

| # | Decision | Approved | Editable master | Exports |
|---|---|---|---|---|
| 1 | **Logo: "Branch"**, an adaptive mark. Twig and leaf in light mode; cream and green in dark mode; white and peach on terracotta | Oct 2026, chosen by family vote over "Fork", roots and GT Road variants | `brand/logo/svg/branch-*.svg`, `lockup-horizontal-*.svg` | `brand/logo/png/` |
| 2 | **Mascot: chubby Hudhud (B2)** in terracotta and teal. The same bird in light and dark; in dark mode it gets a cream die-cut edge | Oct 2026 | `brand/mascot/svg/hudhud-*.svg` (10 poses, each with a `-dark` version) | `brand/mascot/png/` (@1x, @2x, @3x) |
| 3 | **App icon and splash** built from the Branch mark | Oct 2026 | `brand/app-icon/svg/` | `brand/app-icon/png/` |
| 4 | **Palette and tokens:** terracotta #B54A2F, teal #1F7A7A, accent #F2B33D; light and dark sets | Nov 2026 | `tokens/tokens.json` (master), mirrored in `tokens.css`, `theme.ts`, `tokens.dtcg.json` and the Figma variables | — |
| 5 | **Type:** Bricolage Grotesque (display), Plus Jakarta Sans (UI), Gulzar (Urdu), Atkinson Hyperlegible (reading-font option) | Nov 2026 | `tokens/tokens.json`, `brand/BRAND_GUIDELINES.md` | — |
| 6 | **Icons:** Lucide, outline, 2 px stroke, 24 px | Nov 2026 | — | — |
| 7 | **Store feature graphic** | Nov 2026 | `brand/store/` | `play-feature-graphic-1024x500.png` |
| 8 | **App screens:** 55 screens, light and dark, final brand: student app, parent pages, dashboard, admin and tablet layouts | Nov 2026 | `screens/*.html`; Figma pages 02 and 03 (24 imported; the 31 newer screens are pending import) | `screens/png/`, `screens/png/store/` |
| 9 | **Design system sheet** | Nov 2026 | Figma page 01 (`figma/README.md`); `figma/rahyaab-design-system.html` | — |
| 10 | **Game design ("Your Year", GDD v3) and frameworks** | Nov 2026 | `game/GAME_DESIGN.md`, `game/frameworks/*.json` | — |
| 11 | **Accessibility spec** | Nov 2026 | `specs/accessibility.md` | — |
| 12 | **Forms, errors and help spec** | Nov 2026 | `specs/forms-and-errors.md` | — |

**Rejected, and kept out of this folder:**
- the P3 "Night hoopoe" mascot;
- the AI-app and storybook looks;
- the Fern design system (in `docs/archive/`);
- the roots and GT Road logo ideas.

`docs/project/BRAND_DECISIONS.md` records why each option was rejected.

**Engineering design** (architecture, API, data model, security, tests) lives in `docs/`. Start at `docs/README.md`.
