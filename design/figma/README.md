# Figma

**File:** [Rahyaab – Final Design v1](https://www.figma.com/design/X9jZDn1tm89JOfKNlmpq36?node-id=2-2)

**Page "01 Brand & design system"** holds the frame "Rahyaab – Design system". It has:
- the cover;
- every logo and mascot asset;
- the light and dark colour tokens;
- the type scale;
- live examples of Button, ChoiceCard, KnowsYouMeter, HudhudNote, PathCard and LogoLockup.

Every element is an editable Figma layer.

The file also has **58 variables** in the collection "Rahyaab tokens":
- colours, as `light/<token>` and `dark/<token>`;
- `space-*`, `radius-*` and `touch-min`.

The free (Starter) plan allows one variable mode and three pages. That is why light and dark are two groups rather than two modes. With a Professional or Education plan, merge them into one collection with Light and Dark modes.

**Page "02 App screens"** holds 24 screens in light mode. **Page "03 Dark mode, parent & teacher"** holds the same 24 in dark mode. The 31 screens added on 5 Nov 2026 are **not imported yet**, and 5 imported screens (S-07, S-08b, S-12, S-18, S-25) are out of date since the 9 Nov change to the choice cards (equal weight) and the tab bar (pill indicator). Automated import is blocked by the Figma Starter plan's MCP call limit (hit again on 9 Nov 2026).

**To finish the import yourself (about 10 minutes, free):**
1. In Figma, open the file and install the free **html.to.design** plugin (Plugins → search "html.to.design").
2. Go to page **02 App screens**. Run the plugin, choose **Import from file**, and pick `import-pending-light.html` from this folder. It holds exactly the 36 screens to add or replace.
3. Delete the 5 old frames it replaces: S-07, S-08b, S-12, S-18 and S-25 (light).
4. Go to page **03 Dark mode, parent & teacher** and repeat with `import-pending-dark.html`; delete the 5 old dark frames.
5. Rename frames if needed to the pattern "S-07 Home · light".

`rahyaab-screens-light.html` and `rahyaab-screens-dark.html` in this folder contain all 55 screens, already updated. The pages include the parent report (P-01) and the teacher dashboard (D-03). On both pages, the screens are grouped into five sections:
1. Onboarding;
2. Play a week;
3. Results;
4. Explore, family, you;
5. Parent web and teacher dashboard.

Each frame is named with its screen ID, for example "S-07 Home · light". The screens are editable layers, but they are not yet linked to components or variables. Linking them is a good first task in Figma: swap the buttons and cards for the components on page 01, and bind fills to the variables.

## Files in this folder

| File | Use |
|---|---|
| `rahyaab-design-system.html` | The design-system sheet as a self-contained web page. Re-import it into any Figma file with the free **html.to.design** plugin, or open it in a browser. |
| `rahyaab-screens-light.html`, `rahyaab-screens-dark.html` | All screens on one self-contained page per theme, for re-importing in the same way. The source files are in `design/screens/`. |
| `import-pending-light.html`, `import-pending-dark.html` | Only the 36 screens per theme still to import or replace (see the steps above) |

## Keeping Figma and code in sync

`design/tokens/tokens.dtcg.json` is in the W3C design-token format.
- **Importing into Figma:** the free **Tokens Studio** plugin can import it (Load from file) into Figma variables.
- **After changing a colour in Figma:** export it back to that file, then update `tokens.json`, `tokens.css` and `theme.ts` with the same value.
