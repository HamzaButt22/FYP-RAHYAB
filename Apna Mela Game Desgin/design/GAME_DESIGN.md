# APNA MELA — Game Design Document

| | |
|---|---|
| **Document** | GAME_DESIGN.md · v1.0 (pre-production) |
| **Genre** | Narrative choice game with a light management theme, used as an interest and personality discovery tool |
| **Platform** | Desktop (Windows / Linux / macOS), Python 3.11+ with **pygame-ce**. Works fully offline on school computer labs. Mouse, touch screen or keyboard |
| **Logical resolution** | 1920 × 1080 (16:9), scaled to fit the window with letterboxing. Minimum window size is 1280 × 720 |
| **Languages** | English and Urdu, with full parity. Urdu uses a right-to-left layout |
| **Session** | 45–60 minutes in total, about 9–12 minutes per in-game day. The game auto-saves after every answer |
| **Audience** | School students aged about 13–18 (Pakistan, Grades 8–12) |
| **Related docs** | SCREEN_SPECIFICATIONS · UI_STYLE_GUIDE · CHARACTER_BIBLE · ASSET_MANIFEST · GAME_FLOW · ASSESSMENT_DESIGN · `mockups/APNA_MELA_MOCKUPS.html` |

---

## 1. Concept

> *"Five days, six stalls, one mela. Let's discover what makes you shine."*

**APNA MELA** ("Our Fair") is set during the five days before a Pakistani school's annual mela. The player is a newly appointed **Mela Volunteer**. Each day they choose which stalls to help at, pick jobs from each stall's **Kaam Board** (job board), handle small **twists** that come up, and talk with **Hudhud**, a hoopoe who keeps a private diary. On the last night the mela lights up and Hudhud reveals the player's **Mela Code**: their top three interest areas, based on everything they chose to do.

The game has two jobs, and **neither may weaken the other**:

1. **Be a game teenagers actually enjoy.** It should feel like a polished casual mobile game, with warm characters, quick decisions and satisfying feedback.
2. **Collect two separate sets of self-report data cleanly.** These are career **interests** (RIASEC) and **personality** (Big Five). They are collected through clearly separated mechanics and stored and reported separately. The full rules are in `ASSESSMENT_DESIGN.md`.

### 1.1 Design pillars

| Pillar | What it means in practice |
|---|---|
| **No wrong answers** | Every option gives the same reward, the same animation and the same friendly reaction. Nothing is locked or failed, and no choice is scored as "better" during play. |
| **Feels like a mela, feels like home** | The world is a Pakistani school: truck-art patterns, chaat, jhoola, dhol, neem trees, bilingual signs and familiar names. It should feel genuine rather than a tourist's view. |
| **Short and snappy** | Each decision fits on one screen and takes 5–15 seconds. Dialogue scenes are no longer than 6 lines. |
| **Private and respectful** | Hudhud's diary is "just between us". The game uses no accounts and no internet, collects only a nickname, and shows no personality labels to the student. |
| **Measurement first, decoration second** | Wherever a game mechanic could bias an answer (rewards, collecting, timers, praise), the measurement wins and the mechanic is removed. |

### 1.2 Player objectives

- **Story objective:** help get all six stalls ready for Mela Day.
- **Visible progress objective:** light all **100 mela lights** on the Mela Board. One light is earned per answered item, plus two per completed stall visit. Every player who finishes reaches exactly 100, whatever they chose.
- **Personal objective:** discover your **Mela Code**.

---

## 2. Target audience

| Factor | Design response |
|---|---|
| **Ages 13–18, wide range** | Visual style that is cute but not childish: chunky shapes, confident colours and humour that respects the player. Characters are 14–16, so younger players look up to them and older players still relate. |
| **Mixed English reading ability** | Plain English at about Grade 6–7 reading level, a maximum of about 22 words per card option, and a full Urdu version. Optional read-aloud voice pack. |
| **Shared school computers** | Offline only, one save slot, a clearly visible "Delete my data" option, and an optional shared-computer mode (see Approvals). |
| **Varied gaming experience** | One input action (tap/click/Enter). No dexterity or reaction-time challenges. A tutorial is built into Day 1. |
| **Gender and cultural inclusivity** | A balanced cast (2 girls, 2 boys, 1 adult man, 1 bird). Avatars include hijab and non-hijab options and four skin tones. No job is presented as being "for" a particular gender. Characters are deliberately shown in roles that go against stereotypes (Sara and the camera/workshop, Bilal with the help desk, etc.). |
| **Sensitive data (minors)** | No personality labels are shown to the student. Interest results are framed as "what you enjoy, not what you're good at". |

---

## 3. Story & narrative

### 3.1 Setting
**Gulshan Model School** (fictional), a mid-sized co-educational school in a Pakistani city. The school's annual **Apna Mela** fundraiser is five days away. Its ground holds a jhoola (Ferris wheel), a small stage and six stalls arranged around a sandy oval path. An old neem tree stands by the gate.

### 3.2 Premise
This year's mela is in trouble: the banner has torn, half the volunteers have exam clashes, and the stalls are bare. **Ustad Karim**, the warm and slightly dramatic teacher in charge, appoints the player as a volunteer. That evening a hoopoe wearing tiny golden spectacles lands on the neem tree. This is **Hudhud**, who has watched every mela at this school "since before the jhoola squeaked". Hudhud offers to keep a diary of the player's week, *"so that on the last night we can see what made you shine."*

**Cultural note.** In Farid ud-Din Attar's *Mantiq-ut-Tair* (The Conference of the Birds), a classic of the Persian and Urdu literary world, the hoopoe guides the other birds on a journey that turns out to be about discovering themselves. Hudhud plays the same part here. The game hints at this in Ustad Karim's lines and never lectures about it.

### 3.3 Narrative structure
- **Act 1 (Day 1):** setup, tutorial and meeting the friends.
- **Act 2 (Days 2–4):** each day centres on one friend and a small, low-stakes story problem.
- **Act 3 (Day 5):** Mela Day, the crowds, the final rush, and the night reveal.

The story is **linear and identical for every player**. Choices change only the wording of short acknowledgements ("You hung the lights!"), never the plot, the rewards or the characters' opinions. This keeps every player's assessment experience the same.

### 3.4 Daily storylines

| Day | Title | Buddy | Story beat (same for all players) | Morning hook → evening close |
|---|---|---|---|---|
| **1** | *Banner Down!* | **Zain** | Ustad Karim announces the mela and the torn banner. Zain shows the player around (tutorial: map → stall → Kaam Board → cards). Hudhud appears at dusk. | "We're volunteers now, yaar!" → Hudhud: "Shall I start a diary for you?" |
| **2** | *The Big List* | **Hira** | Hira, head of the mela committee, has a 40-item checklist and a sky full of rain clouds. The rain never comes. | Hira's clipboard bursts with notes → "Fine. The list is… mostly done." |
| **3** | *Stage Fright* | **Bilal** | The stage goes up. Bilal must give the opening announcement and is secretly nervous. He jokes his way through. | Bilal: "Who needs a mic when you have lungs?" → Bilal practises his lines with the player. |
| **4** | *Picture Perfect* | **Sara** | Sara photographs every stall for the Mela Board. New volunteers join and the board fills up. Tomorrow is the big day. | Sara: "Smile! No, a real smile!" → The night before: everyone looks at the board. |
| **5** | *Mela Day!* | **Ustad Karim** (+ everyone) | The gates open, families arrive, the judges come early and the jhoola lights up. At night the closing ceremony leads into the **Final Reveal**. | "Bismillah, open the gates!" → Fireworks and the Mela Code. |

Each storyline uses **at most 3 dialogue scenes** (morning, buddy hand-off and evening), with up to 6 lines each. The dialogue structure is in §9.

---

## 4. Characters (summary)

The full visual specification is in `CHARACTER_BIBLE.md`.

| Character | Role in the game | Personality (for writers) | Signature colour |
|---|---|---|---|
| **Hudhud** (hoopoe) | Guide and narrator. Keeps the private diary and presents the final reveal. Speaks only to the player. | Wise, gently funny, a little vain about his crest. Never judges. | Haldi Yellow / cinnamon |
| **Zain** (15) | Day 1 buddy and tutorial guide. The player's friend. | Energetic, loyal, talks fast, says "yaar" a lot. | Kesar Orange |
| **Hira** (16) | Day 2 buddy. Head of the mela committee. | Organised, caring, a little anxious, glasses, clipboard. | Neel Blue + teal hijab |
| **Bilal** (14) | Day 3 buddy. | Funny, kind, always snacking, quietly nervous about the stage. | Mehndi Green |
| **Sara** (15) | Day 4 buddy. Mela photographer (provides the Mela Board photos). | Sporty, curious, upbeat, always holding her camera. | Jamun Purple |
| **Ustad Karim** (50s) | Teacher in charge of the mela. Opens and closes each day; Day 5 buddy. | Warm, theatrical, quotes poetry, secretly sentimental. | Peacock Teal accents, brown waistcoat |
| **Player avatar** | The volunteer. One of 8 presets, with an optional nickname. | Silent protagonist (never speaks in voiced lines). | Rani Pink Volunteer T-shirt |

**Neutrality rule for all characters:** no character ever recommends a stall, praises one kind of job over another, or reacts differently depending on what the player chose. Buddies are attached to **days**, not to stalls, so no character is associated with one interest type.

---

## 5. Five-day progression

| | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|
| Stall visits | 2 | 2 | 2 | 2 | 2 |
| What cards (RIASEC) | W01–W04 | W05–W08 | W09–W12 | W13–W16 | W17–W20 |
| Loved-it ratings (RIASEC) | 4 | 4 | 4 | 4 | 4 |
| How cards (Big Five) | H01–H06 | H07–H12 | H13–H18 | H19–H24 | H25–H30 |
| Diary statements (Big Five) | D01–D02 | D03–D04 | D05–D06 | D07–D08 | D09–D10 |
| Lights earned | 20 | 20 | 20 | 20 | 20 |
| Extra | Tutorial prompts | — | — | — | Crowds on the map, Final Reveal |

**Totals:** 10 stall visits · 20 What cards · 20 Loved-it ratings · 30 How cards · 10 diary statements = **80 answers + 10 stall choices**.

Each day the What cards cover every interest type **exactly twice**, and the How cards cover all five Big Five domains (plus one rotating extra). This balance means that stopping partway, for example after Day 3, still gives an even sample. See ASSESSMENT_DESIGN §3–4.

---

## 6. Core gameplay loop

```
DAY START ─► Morning scene (Ustad Karim + today's buddy)
   │
   ├─► MELA MAP ─► SIX-STALL SELECTION ─► STALL VISIT ──┐
   │        ▲                                          │   ×2 per day
   │        └──────────── visit complete ◄─────────────┘
   │
   ├─► Evening ─► HUDHUD DIARY (2 statements) ─► DAILY SUMMARY ─► (Mela Board)
   │
   └─► next day … Day 5 evening ─► FINAL REVEAL ─► RIASEC RESULTS ─► Ending
```

**Inside one stall visit (5 steps, about 90 seconds):**

| Step | Screen | Data |
|---|---|---|
| 1 | **Task**: What card (pick 1 of 3 jobs) → Loved-it rating (1–5 hearts) | RIASEC |
| 2 | **Twist**: How card (pick 1 of 2 responses) | Big Five |
| 3 | **Task**: What card → Loved-it rating | RIASEC |
| 4 | **Twist**: How card | Big Five |
| 5 | **Twist**: How card | Big Five |
| — | "Visit complete" toast: +2 lights, a photo from Sara, back to the map | — |

The **Task, Twist, Task, Twist, Twist** stepper is always visible during a visit, so players know how much is left.

---

## 7. Mechanics

### 7.1 Stall selection
- There are six stalls (see the table below). The player chooses **2 different stalls per day** from the Six-Stall Selection screen, which opens from the Mela Map. Tapping a tent on the map opens the same screen with that stall pre-selected.
- A stall visited **today** is greyed out and cannot be chosen again that day. Stalls **can** be revisited on later days. Revisits are meaningful data and are never discouraged.
- Stalls are shown in a **fixed grid order** (R, I, A / S, E, C positions). The order is never animated, shuffled or highlighted. No stall is "featured", "new", "recommended", locked or more rewarding.
- **No collection mechanics**: no stamps, achievements or "visit all six" prompts, because these would push players to choose stalls for completionism rather than interest.
- Stall choice is recorded as a secondary RIASEC signal (stall → type mapping), kept separate from the card data.

| Stall (EN / UR) | Tagline | Look | Hidden type |
|---|---|---|---|
| **Karigar Workshop** · کاریگر ورکشاپ | Build it. Fix it. | Orange tent, tools, bamboo, kites | R |
| **Jugnu Science Tent** · جگنو سائنس خیمہ | Ask why. Find out. | Blue tent, flasks, telescope | I |
| **Rang Mahal Art Stall** · رنگ محل | Make it beautiful. | Purple tent, paint, truck-art panels | A |
| **Madad Markaz Help Desk** · مدد مرکز | Help people out. | Green tent, first-aid box, info desk | S |
| **Chatkhara Chaat Stall** · چٹخارہ چاٹ | Sell it. Run it. | Red tent, chaat counter, price board | E |
| **Hisaab Ghar Ticket Office** · حساب گھر | Count it. Sort it. | Teal booth, ticket rolls, ledgers | C |

The RIASEC mapping is never shown to the player during play.

### 7.2 What cards (activity choice → RIASEC)
- Each card offers **three jobs from three different interest types**. The 20 cards together are **all 20 possible combinations** of 3 types out of 6, so each type appears 10 times and every pair of types appears together equally often (4 times).
- **Jobs are mela-wide.** The Kaam Board at each stall lists jobs from the whole mela committee, so the jobs offered do **not** depend on which stall the player is at. This separates the stall signal from the card signal.
- Option order on screen is **randomised per card per player**, and the order shown is saved with the answer.
- Interaction: tap a card to select it (it lifts and glows), tap again or press "Yeh wala! This one" to confirm. Before confirming, the player can change their selection freely. After confirming, the answer is locked.
- Each job card has a **neutral illustration**. Card art never uses stall colours or stall icons.

### 7.3 Loved-it rating (enjoyment of the chosen job → RIASEC)
- Shown immediately after each What card. A 3-second vignette shows the avatar doing the chosen job, followed by: *"How much did you love doing this?"* with 1–5 hearts (labels "Not for me" … "Loved it!").
- The rating attaches to the RIASEC type of the job just chosen. This gives a measure of **how strongly** the player likes their chosen type, alongside the measure of **which** type they choose.

### 7.4 How cards (behaviour in a situation → Big Five)
- Each card is a short mela situation ("A big crowd arrives at the stall all at once") with **two responses**. Both responses express the **same** Big Five domain, one at the higher end and one at the lower end. Neither is written as better or worse.
- The left/right position of each response is **randomised**.
- The question asked is "What would you do?" / "Choose the one that sounds most like you." There is no timer, and the same neutral reaction ("Got it!") follows every answer.

### 7.5 Hudhud's diary (self-report → Big Five)
- Each evening Hudhud opens the diary: a short recap of the day (with no evaluation), then **2 statements** to rate on a **5-point "How much is this like you?"** scale.
- **The 10 statement wordings, the response scale and the scoring keys must come from the approved Big Five instrument** (see ASSESSMENT_DESIGN §5). The game supplies only the presentation. The mockup wording is a labelled sample.
- Framing: *"This diary is just between us."* (It is stored locally. What staff can see is explained in Privacy, §10.)

### 7.6 Mela lights (progress currency)
- 1 light per answered item (What, Loved-it, How, Diary = 80) + 2 per completed visit (20) = **100**.
- Lights show up in the HUD counter, on the Daily Summary and as bulbs on the Mela Board. **Lights never depend on which answer was given.** They cannot be spent and do not unlock anything.

### 7.7 Mela Board
- A keepsake corkboard with five day columns. Each completed visit adds a **polaroid** taken by Sara, showing that day's buddy and the avatar at the stall. A string of bulbs lights up as lights are earned.
- It can be opened from the HUD, from the Daily Summary and from the Results screen. It is view-only.

### 7.8 Final Mela Reveal
- **Day 5 evening:** the closing ceremony (Ustad Karim speech, 4 lines). The lights come on, fireworks go off, and Hudhud flies to centre stage and opens the diary.
- The top three interest types appear as **medallions** one at a time (0.9 s apart, each with its stall icon, letter and friendly name: *Doer, Thinker, Creator, Helper, Persuader, Organiser*).
- The player continues to **RIASEC Results**: the 3-letter code, relative bars for all six types (no numbers, percentiles or norms), and career ideas to explore for the top three types.
- Final message: *"This shows what you enjoy, not what you are good at. Interests grow and change. Talk to your teacher or counsellor about it."*
- **Big Five results are not shown in the game** (see §8 and Approvals).

---

## 8. RIASEC and Big Five: kept separate

| | RIASEC (interests) | Big Five (personality) |
|---|---|---|
| Mechanics | Stall selection · What cards · Loved-it ratings | How cards · Hudhud diary |
| Screens | Six-Stall Selection, What Card, Loved-it | How Card, Hudhud Diary |
| Item IDs | `STALL-dN-vN`, `W01–W20`, `L01–L20` | `H01–H30`, `D01–D10` |
| Code namespace | `R I A S E C` | `B-O B-C B-E B-A B-N` (the prefix avoids clashing with RIASEC C and E) |
| Save file | `save/riasec.json` | `save/bigfive.json` |
| Scoring module | `assess/riasec.py` (imports nothing from Big Five) | `assess/bigfive.py` (imports nothing from RIASEC) |
| Shown to student | Yes: Final Reveal + Results | **No** (default; see Approvals) |
| Visual language | Cards with illustrations, hearts | Speech bubble "Twist!" (purple), diary pages |

**Rules:**
- No combined score, index, chart, export column or narrative mixes the two.
- The game never uses a result from one model to change items in the other.
- How cards never mention jobs or stall types, and What cards never ask how the player *would behave*.

Full details are in `ASSESSMENT_DESIGN.md`.

---

## 9. Dialogue & content structure

| Content | Count | Structure |
|---|---|---|
| Opening story | 4 panels | Image + 1–2 caption lines each |
| Morning scenes | 5 | Ustad Karim (2–3 lines) → buddy (2–3 lines) |
| Buddy stall-arrival lines | 4 buddies × 6 stalls = 24 (+6 Karim on Day 5) | 1 line of flavour about the **stall's setting only** (never "this is the best stall") |
| Task acknowledgement | 60 | "You [job, past tense]!" One per job, all with the same tone |
| Twist intro lines | 30 | The buddy reads out the situation (the card's scenario text) |
| Neutral reactions | ≥8 shared | "Got it!", "Noted!", "Okay, let's go!" Picked at random, never linked to the answer |
| Visit complete | 6 shared | e.g. "That's a wrap here!" |
| Evening diary intro | 5 | Hudhud recaps the day (which stalls were visited, with no judgement) |
| Day close / tomorrow teaser | 5 | Next buddy is introduced |
| Closing ceremony | 1 scene | Ustad Karim, 4 lines |
| Final reveal | 1 scene | Hudhud, 3 lines + medallions |
| Help / How to Play | 6 cards | Map, stalls, Kaam Board, twists, diary, lights |

**Writing rules:**
- Use simple English, with Pakistani flavour words (yaar, chalo, pakka, shabash) kept to **one per line at most** and always understandable from context.
- **Urdu is a full translation, not a transliteration.** It is reviewed by a native Urdu-speaking teacher.
- No sarcasm aimed at the player, no body jokes, no stereotypes.
- All text is stored in `data/strings_en.json` and `data/strings_ur.json` under shared keys. No text is baked into images, so localisation stays possible.

---

## 10. Accessibility & privacy

### 10.1 Accessibility (target: WCAG 2.2 AA principles applied to games)
| Need | Provision |
|---|---|
| Reading | Plain language, text size options (100 / 125 / 150 %), a full Urdu version, an optional read-aloud voice pack, no time limits, no auto-advancing text. |
| Vision | Body text contrast ≥ 4.5:1, large text ≥ 3:1. **Colour is never the only cue:** stalls always show an icon and a name. High-contrast mode (white panels, thicker outlines, no background textures). |
| Motor | One-button play. Targets ≥ 96 px at 1080p. Mouse, touch, or keyboard (Tab/Arrows + Enter/Space, Esc to pause). No dragging, double-clicking or holding. |
| Motion and photosensitivity | "Reduce motion" setting (replaces movement with fades and turns off screen shake and parallax). Fireworks and flashes stay **below 3 flashes per second**, with no full-screen strobing. |
| Hearing | Audio is never needed to understand anything. All speech appears as text. |
| Cognitive | A progress stepper on every visit, a "Today's plan" card, and the option to pause and resume at any point. Every confirm button has a single meaning. |

### 10.2 Privacy (designed for minors)
- **Offline only.** The game makes no network calls and includes no analytics, advertising, or third-party code that sends data anywhere.
- **Data minimisation:** stores a nickname (optional, first name only), the chosen avatar, settings, progress and item responses. It collects **no** surname, roll number, school ID, email, photos, location or device identifiers.
- **Local storage** under the game's own folder in three separate files (`profile.json`, `riasec.json`, `bigfive.json`).
- **"Delete my data"** in Settings, with two confirmations, removes all three files.
- **The student sees:** their own RIASEC results. **The student never sees** Big Five scores or any comparison with other students.
- **Staff access** (if approved): an explicit, PIN-protected "Export for counsellor" action writes separate RIASEC and Big Five CSV files. This needs consent from the school and parents under the school's own policy (see Approvals).
- The About & Privacy screen explains all of this in plain English and Urdu.

---

## 11. Game rules & progression

1. **New Game** → Language (first launch only) → Before-we-start notice → Avatar → Opening Story → Day 1.
2. Days are played **in order**. A day ends only when both visits and the diary are complete.
3. **2 stall visits per day**, at 2 different stalls. Each visit is always 5 steps, and steps cannot be skipped.
4. **Answers lock on confirm.** There is no undo after confirming and no replaying a day. This protects the data and is explained up front: *"Go with your first honest answer!"*
5. The game **auto-saves after every confirmed answer**. Continue resumes at the next unanswered item. A visit that was interrupted resumes at the same step.
6. **Pause** is available at any time except during a 0.4 s transition. Pausing never discards answers.
7. **No failure states, timers, scores or rankings** while playing.
8. **Completion:** the Day 5 diary leads to the Final Reveal, then Results, then the Ending. The Main Menu then shows **"My Mela Code"** in place of Continue, which reopens Results.
9. **New Game while a save exists** asks for confirmation and makes clear this deletes the previous answers. Only one profile exists at a time.
10. Skipping **dialogue** (Skip button, or holding Enter) is always allowed. Skipping **items** is never allowed.

---

## 12. Out of scope (deliberately excluded)

Multiplayer and leaderboards; shops, currencies to spend, or cosmetics unlocked by choices; mini-games that test skill (these would mix ability with interest); daily login rewards; cloud saves; an AI chatbot; combined "personality type" reports; any feature that sends data off the device.
