# App screens (final brand)

55 screens of the Rahyaab app, the parent pages, the teacher dashboard and the admin console, in light and dark. Phones are 390 × 844, tablets 768 × 1024, and the dashboard and admin console 1280 × 800. Screen IDs match `docs/project/SCREENS.md` and the SRS.

**Ways to open them:**
- **Figma:** [page "02 App screens" (light)](https://www.figma.com/design/X9jZDn1tm89JOfKNlmpq36?node-id=1-58) and [page "03 Dark mode, parent & teacher" (dark)](https://www.figma.com/design/X9jZDn1tm89JOfKNlmpq36?node-id=1-59). The screens are grouped into five flow sections, and every layer is editable.
  - **Not in Figma yet:** the 31 screens added on 5 Nov 2026 (everything except the original 24). The Figma Starter plan's MCP call limit was reached. Import them later with `../figma/rahyaab-screens-light.html` and `-dark.html`, which already include all 55 (html.to.design plugin, or the Figma MCP when the limit resets).
- **Browser:** open `index.html` for the gallery, or any screen file directly. Add `?theme=dark` for dark mode. With no parameter, each file follows the system setting.
- **Images:** `png/` holds @2x PNGs (`<screen>-light.png`, `<screen>-dark.png`); `png/store/` holds the Play Store screenshots.

## 1. Files

| File | What |
|---|---|
| `S-*.html`, `P-01-*.html`, `D-03-*.html` | One editable HTML file per screen: 390 × 844 for phones, 1280 × 800 for the dashboard |
| `screens.css` | Shared screen styles. Every colour, radius and font comes from `../tokens/tokens.css`; there are no hex values except the code block in S-23 and the QR card |
| `index.html` | Gallery of all screens |
| `store/*.html` | The 8 Play Store screenshots (1080 × 1920): a caption plus the real screen |
| `png/` | Exports |
| `tools/render_png.py` | Re-exports every PNG with headless Microsoft Edge (`python design/screens/tools/render_png.py`, or pass part of a file name to export only that screen). It needs Pillow |

## 2. Screens

| Flow | Screens |
|---|---|
| 0 System | **S-00 Splash** · **S-00b Loading (building the Blueprint)** · **S-28 Offline** · **S-19 Profiles and PIN** · **S-29 Re-link on a new phone** |
| 1 Onboarding | S-01 Language · S-02 Welcome · S-03 Join · **S-03e Join with field help** · **S-03i Join without a code (parent OTP; post-MVP)** · S-04 Family OK slip · S-05 Profile · S-06 Avatar |
| 2 Play a week | S-07 Home · S-08a Plan your week · S-08b Scene with Dil/Duniya · S-08c Task (pack the boot, with button controls) · S-08d Value moment · S-09 Sunday diary · S-21 The letter |
| 3 Results | S-10 Blueprint slide · S-10b Your paths · **S-10c Is your group right for you?** · S-11 Why this? · S-14 Share with family |
| 4 Explore, family, you | S-12 Explore · S-13 Stream detail · **S-15 Saved** · **S-16 Career detail** · **S-17 History** · S-23 Try a day · S-25 Family · S-18 You, with the Accessibility settings · **S-20 Help** · **S-26 School** · **S-27 Reminders** · **S-31 Class check-in** |
| 5 Parent web | P-01 Parent report (with Listen) · **P-01b My children** · **P-02 Parent consent (OTP)** |
| 6 Dashboard | **D-01 Staff login** · **D-01b Two-step code** · **D-01c Forgot password** · **D-02 Classes** · D-03 Class roster · **D-04 Student summary** · **D-08 Panel labelling** · **D-09 School and teachers** · **D-11 Consent records** |
| 7 Admin | **A-01 Schools and classes** · **A-03 Models** · **A-04 Audit log** · **A-05 Data requests** |
| 8 Tablet (responsive) | **T-07 Home** and **T-10b Your paths** at 768 px: the tabs become a side rail and cards sit in two columns (`../specs/responsive.md`) |

## 3. Accessibility built into the screens

These follow `../specs/accessibility.md`:
- A **read-aloud** speaker button on every story, task, diary and letter screen, and **Listen** on the parent page.
- **S-18** has the settings: read aloud, auto-read, text size, high contrast, easy read, reading font and reduce motion.
- **Tasks:** drag is never the only way. S-08c has rotate and place buttons, and "Ask a friend to help".
- **Not colour alone:** Dil and Duniya are labelled; fit bands use words and dots; doors use ✓ / ↗ / ✕.
- **Touch and labels:** touch targets are 48 px or larger. Icon buttons carry `aria-label`s, which map to `accessibilityLabel` in React Native.

## 4. Play Store screenshots

Order and captions for the listing (`docs/project/STORE_AND_SEARCH.md` §1.4). The files are in `png/store/`.

| # | File | Screen | Caption (English) | Caption (Urdu) |
|---|---|---|---|---|
| 1 | `01-letter.png` | S-21 | Read a letter from future you | مستقبل کے اپنے آپ کا خط پڑھیں |
| 2 | `02-plan-week.png` | S-08a | Plan your week, your way | اپنا ہفتہ اپنی مرضی سے بنائیں |
| 3 | `03-dil-duniya.png` | S-08b | Choose what you'd really do | وہ چنیں جو آپ واقعی کریں گے |
| 4 | `04-everyday-task.png` | S-08c | Solve everyday puzzles | روزمرہ کی پہیلیاں حل کریں |
| 5 | `05-blueprint.png` | S-10 | Get your Blueprint | اپنا بلیو پرنٹ حاصل کریں |
| 6 | `06-family-report.png` | P-01 | Share a report with family | گھر والوں کے ساتھ رپورٹ شیئر کریں |
| 7 | `07-explore.png` | S-12 | Explore every stream | ہر گروپ کے بارے میں جانیں |
| 8 | `08-safe-accessible.png` | S-18 | Private, safe, read aloud | محفوظ، نجی، آواز کے ساتھ |

Have a native Urdu editor review the Urdu captions before launch. For the Urdu listing, make a copy of each `store/*.html` file, set `dir="rtl"`, use the Urdu caption in Gulzar, and point the frame at the Urdu version of the screen once it exists.

## 5. Changing a screen

1. Edit the screen's HTML, or `screens.css` for a shared style. Colours come only from tokens.
2. Re-export: `python design/screens/tools/render_png.py S-07`.
3. **Updating Figma:** edit the layers there, or re-import with `../figma/rahyaab-screens-light.html` and `../figma/rahyaab-screens-dark.html` (see `../figma/README.md`).

**Sample content:** names, schools and results are invented. "Ayesha_10" is a nickname, as the app never asks for a real name.

**Placeholders:** the scene illustration (S-08b) and the avatar (S-06) are placeholder shapes until the illustration and Rive work is done.

**Not drawn, on purpose:**
- S-22 City map, P-03 PDF, P-04 Upgrade, D-05 Class insights, A-02 Content packs: these are post-MVP (`docs/project/MVP.md`).
- Subscription and payment screens: the app has no payments.
- Student login and password screens: students join with a class code and use a PIN, and the re-link code replaces a password (ADR-0011).
