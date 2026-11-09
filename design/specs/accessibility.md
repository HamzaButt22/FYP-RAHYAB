# Accessibility and accommodations

Rahyaab must work for students who are blind or have low vision, are deaf or hard of hearing, have motor or dexterity limits, or have learning, attention or reading differences. It must also work for students with low literacy and those on shared, cheap phones.

**Standards:**
- WCAG 2.2 AA for the app, the parent page and the dashboard;
- Android accessibility guidance (TalkBack, Switch Access, font scaling).

**Requirements:** SRS FR-96 to FR-98 and NFR-64 to NFR-65 (plus the existing NFR-22 to NFR-28).

**Rule zero:** an accommodation never changes what a choice means and never lowers a result. Where a task cannot be made accessible for a student, it is **not measured** (missing data), never scored as a failure.

## 1. Settings (You → Accessibility, S-18)

Every option is off by default except where Android already has a matching setting, which the app follows.

| Setting | What it does | Default |
|---|---|---|
| **Read aloud** | A speaker button on every scene line, choice, task instruction, diary, letter and Blueprint slide | On (buttons shown) |
| **Auto-read** | Reads each new line automatically with the app's voice; choices are read in order, then "Choose one" | Off. Stays off while TalkBack is running (TalkBack already announces new lines; a second voice would overlap). The speaker button on each line still works with TalkBack |
| **Reading speed** | 0.75× · 1× · 1.25× · 1.5× | 1× |
| **Text size** | Follows Android font scale up to 200%; an in-app slider for 100–200% | System |
| **High contrast** | A third theme, `contrast` in `design/tokens/tokens.json`: 7:1 or better for all text and ≥ 3:1 borders on every control (measured 7.4–21:1) (NFR-64) | Off |
| **Easy read** | The same information in shorter sentences, one idea per line, with icons next to key words. Lines are rewritten, never removed, so every choice is based on the same facts (checked by the content review and the DIF-by-mode analysis) | Off |
| **Reading font** | Atkinson Hyperlegible (OFL, designed for low vision) with extra letter and line spacing | Off |
| **Reduce motion** | Follows Android; turns off parallax, celebration and slide animations | System |
| **Haptics** | Light vibration on choices | On |
| **Sound and music** | Optional lo-fi music; never carries meaning | Off |

## 2. Read aloud (FR-96)

- **App engine:** the phone's own text-to-speech through `expo-speech`. Nothing is sent to a server, and no third party hears the student.
- **Languages:**
  - English text uses an English voice.
  - In Urdu mode the app reads the Urdu-script version of each line with an Urdu voice (`ur-PK`), when the phone has one.
  - Roman Urdu is never read by an Urdu voice, because it would sound wrong. Every dialogue line is therefore written in **Urdu script as well**.
- **Checking the voice:** at first use, `Speech.getAvailableVoicesAsync()` checks for an Urdu voice.
  - If none is installed, the app shows a one-time hint: "Install the Urdu voice in Google Text-to-Speech, or use the recorded voice."
  - It then falls back to the **recorded audio pack** (FR-32): whole clips for fixed text (instructions, prologue), and **assembled clips** for personalised text (the letter, the Blueprint and the parent report are built from recorded stream names, fit phrases and sentence templates). If neither covers a line, the screen says plainly "This line has no audio yet" instead of staying silent. The parent page uses the same clips when the browser has no Urdu voice.
- **While reading:**
  - the sentence being read is highlighted;
  - tapping again stops it;
  - reading pauses when the app goes to the background.
- **Parent page (P-01):** a "Listen" button using the browser's Web Speech API, with the same Urdu fallback. Many parents read Urdu slowly or not at all.

## 3. Screen readers (TalkBack and VoiceOver)

- Every control has an `accessibilityLabel` in the current language, a role (button, header, adjustable, link) and a state (selected, disabled).
- Story text sits in a live region so new lines are announced. Focus moves to the first new line, then to the choices.
- Dil and Duniya cards are announced with their voice and text: "Dil says: Let me open it up. Button, 1 of 2."
- Focus order follows reading order. Nothing traps focus. Every screen has a heading.
- Images that carry meaning have text alternatives; Hudhud's pose is described only when it matters ("Hudhud is waiting for your family's OK").
- Charts (interest and task-strength bars) are also a list: "Investigative: strong. Social: good."

## 4. Tasks without barriers (FR-98)

Every task family has an **accessible mode** with buttons instead of drag, and announced state.

| Family | Accessible mode | With a screen reader |
|---|---|---|
| Numerical | Choice buttons or a large keypad | Fully accessible (spoken amounts) |
| Logic | List of clues; "rule out" buttons per person | Fully accessible |
| Planning | Steps as a list with "move up / move down" | Fully accessible |
| Verbal | Messages read aloud; pick one | Fully accessible |
| Spatial | Rotate-left / rotate-right / place buttons | Depends on vision: **not measured** when TalkBack is on, unless the student chooses to try |
| Abstract | Options as large tiles with descriptive labels | Depends on vision: **not measured** when TalkBack is on, unless the student chooses to try |

- **Never scored:** time, speed and number of taps. All tasks are already untimed.
- **"Ask a friend"** is always available and counts as missing data.
- **Missing tasks:** when tasks are not measured, the Blueprint says so plainly ("We used your choices more than tasks"), and M3 renormalises its weights (SRS §12.6). The confidence level reflects the smaller amount of evidence.
- **Research check:** only the fact that a task was played in accessible mode (and so not measured) is stored. Which assistive technology a student uses (TalkBack, Switch Access) is never recorded, because it can reveal a disability. The DIF-by-mode check (SRS §14.5) uses that one flag, for students who opted into research.

## 5. Low vision and colour

- Text contrast is 4.5:1 or better everywhere, and 7:1 in high contrast. Every token pair is listed in `design/tokens` and SRS §8.2.
- Layouts work at 200% text with no clipped text. Nastaliq never sits in a fixed-height box.
- Meaning never depends on colour alone:
  - Dil and Duniya carry their names, not just colour;
  - bands use dots and words;
  - doors use ✓ / ↗ / ✕ and words.
- The RIASEC chart colours stay distinguishable under protanopia, deuteranopia and tritanopia.

## 6. Hearing

- No information is given by sound alone. Music is optional and off by default.
- Any recorded audio (instructions, simulations) has captions on by default.
- Haptics are never the only feedback.

## 7. Motor and dexterity

- **Touch targets:** at least 48 × 48 dp, with 8 dp gaps; primary buttons 56 dp.
- **Gestures:**
  - no drag-only, long-press-only or multi-finger gestures;
  - no shaking or tilting needed (parallax tilt is decoration only);
  - no time limits or double-tap requirements.
- **Other input methods:** works with **Switch Access**, a keyboard, a D-pad and external mice.
- **One-handed use:** main actions sit in the bottom half of the screen.

## 8. Learning, attention and reading differences

- **Plain language:** Grade 6 reading level or lower, short lines, one instruction per screen, icons next to key words.
- **Easy read:**
  - halves line length;
  - shows one line at a time with "Next";
  - keeps the same choices, so measurement does not change.
- **Reading font option:** Atkinson Hyperlegible with extra spacing (OFL).
- **Breaks and focus:**
  - "Read again" everywhere;
  - progress saved after every choice;
  - stop at any moment with no penalty;
  - a break suggested after each week;
  - reduce motion removes parallax and moving decoration.
- **No anxiety triggers:** no timers, scores, "wrong", countdowns, streaks or loss framing.

## 9. Parent page and dashboard (web)

- Semantic HTML: landmarks, headings, real buttons, labelled form fields, visible focus.
- 200% zoom and 320 px width work without horizontal scrolling.
- Parent page: "Listen" button (Web Speech API), Urdu-first, no app or login.
- Dashboard: keyboard-only use, data tables with proper headers, CSV export as an alternative to charts.

## 10. Testing

| Check | When |
|---|---|
| Android Accessibility Scanner on every screen; axe-core on web pages | Every release |
| TalkBack walkthrough of onboarding, one full week, the Blueprint and sharing, in English and Urdu | Every release |
| Switch Access and keyboard walkthrough | Every release |
| 200% font, high contrast, reduced motion, greyscale and CVD-simulated screenshots | Every release |
| Usability round including at least 2 students with a disability (with consent), for example a low-vision student and a student with dyslexia | Usability rounds 1 and 2 |
| Urdu TTS on 3 budget phones; fallback audio path when no Urdu voice exists | Before the pilot |

### WCAG 2.2 checklist: the criteria new in 2.2

WCAG is written for the web; for the native app we apply it criterion by criterion, as EN 301 549 does for software.

| Criterion | How Rahyaab meets it |
|---|---|
| 2.4.11 Focus Not Obscured (AA) | Screens scroll the focused element clear of the 56px top bar and the bottom tab bar; sticky bars never cover a focused control (checked with TalkBack and a keyboard) |
| 2.5.7 Dragging Movements (AA) | Every drag has buttons (FR-98) |
| 2.5.8 Target Size (AA) | All targets ≥ 48dp, well above the 24px minimum |
| 3.2.6 Consistent Help (A) | The "?" help button sits in the same place on every screen (FR-103) |
| 3.3.7 Redundant Entry (A) | Class, board and group are asked once and reused; the check-in pre-fills them |
| 3.3.8 Accessible Authentication (AA) | Class codes, claim codes, re-link codes and OTPs allow paste and autofill (`textContentType="oneTimeCode"`); the profile PIN has an alternative that needs no memory (a teacher re-link code or a parent OTP); staff TOTP fields allow paste from an authenticator app |
