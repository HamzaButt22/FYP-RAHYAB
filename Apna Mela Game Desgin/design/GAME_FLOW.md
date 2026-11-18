# APNA MELA — Game Flow

| | |
|---|---|
| **Document** | GAME_FLOW.md · v1.0 |
| **Purpose** | The exact order of play, the state machine, save points and timing, for programmers and testers. Screen IDs (S01–S30) refer to SCREEN_SPECIFICATIONS.md. Item IDs refer to ASSESSMENT_DESIGN.md. |

---

## 1. Whole-game flow

```mermaid
flowchart LR
  A[Boot] --> B{First launch?}
  B -- yes --> C[Language] --> D[Before We Start]
  B -- no --> M[Main Menu]
  M -- PLAY --> D
  M -- Continue --> R[(Resume point)]
  D --> E[Avatar] --> F[Opening Story]
  F --> G1[Day 1] --> G2[Day 2] --> G3[Day 3] --> G4[Day 4] --> G5[Day 5]
  G5 --> H[Closing Ceremony] --> I[Final Reveal] --> J[RIASEC Results] --> K[Ending] --> M
  R -.-> G1 & G2 & G3 & G4 & G5
```

## 2. One day

```mermaid
flowchart TD
  T[S09 Day Intro card] --> MS[S08 Morning: Ustad Karim + buddy]
  MS --> MAP[S10 Mela Map]
  MAP --> SEL[S11 Six-Stall Selection]
  SEL -->|stall chosen, record STALL| V[Stall visit · 5 steps]
  V --> TOAST[S16 Visit complete +2 lights]
  TOAST -->|visit 1 done| MAP
  TOAST -->|visit 2 done| EV[S17 Evening transition]
  EV --> DI[S18 Hudhud Diary · 2 statements]
  DI --> SUM[S19 Daily Summary]
  SUM -->|Day < 5| T
  SUM -->|Day 5| CC[S21 Closing Ceremony]
```

## 3. One stall visit

```mermaid
stateDiagram-v2
  [*] --> Arrive: S12 (buddy arrival line)
  Arrive --> Task1: tap Kaam Board
  state Task1 {
    [*] --> What1: S13 What card
    What1 --> Loved1: confirm → S14
    Loved1 --> [*]: confirm
  }
  Task1 --> Twist1: S15 How card
  Twist1 --> Task2: confirm
  state Task2 {
    [*] --> What2: S13
    What2 --> Loved2: S14
    Loved2 --> [*]
  }
  Task2 --> Twist2: S15
  Twist2 --> Twist3: S15
  Twist3 --> Done: confirm
  Done --> [*]: S16 toast
```

Every confirm triggers **save** (§6) and **+1 light**. Completing the visit gives **+2 lights**.

## 4. Item schedule

Within each day: **visit 1** uses the day's first 2 What cards and first 3 How cards; **visit 2** uses the next 2 What and next 3 How. The card sequence does **not** depend on which stall is chosen.

| Day | Visit | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 | Evening |
|---|---|---|---|---|---|---|---|
| 1 | 1 | W01 + L01 | H01 | W02 + L02 | H02 | H03 | — |
| 1 | 2 | W03 + L03 | H04 | W04 + L04 | H05 | H06 | D01, D02 |
| 2 | 1 | W05 + L05 | H07 | W06 + L06 | H08 | H09 | — |
| 2 | 2 | W07 + L07 | H10 | W08 + L08 | H11 | H12 | D03, D04 |
| 3 | 1 | W09 + L09 | H13 | W10 + L10 | H14 | H15 | — |
| 3 | 2 | W11 + L11 | H16 | W12 + L12 | H17 | H18 | D05, D06 |
| 4 | 1 | W13 + L13 | H19 | W14 + L14 | H20 | H21 | — |
| 4 | 2 | W15 + L15 | H22 | W16 + L16 | H23 | H24 | D07, D08 |
| 5 | 1 | W17 + L17 | H25 | W18 + L18 | H26 | H27 | — |
| 5 | 2 | W19 + L19 | H28 | W20 + L20 | H29 | H30 | D09, D10 |

(The mockups show Day 2, visit 2 at the Jugnu Science Tent: W07 → L07 → H10.)

## 5. Game state machine (top level)

```mermaid
stateDiagram-v2
  [*] --> Boot
  Boot --> FirstRun: no profile
  Boot --> Menu: profile ok
  Boot --> SaveError: profile unreadable
  FirstRun --> Onboarding
  Menu --> Onboarding: PLAY (confirm overwrite if needed)
  Menu --> Playing: Continue
  Menu --> Results: My Mela Code (completed)
  Onboarding --> Playing: avatar chosen + story done
  state Playing {
    [*] --> DayIntro
    DayIntro --> Morning
    Morning --> Map
    Map --> StallSelect
    StallSelect --> Map: back
    StallSelect --> Visit
    Visit --> Map: visit 1 done
    Visit --> Evening: visit 2 done
    Evening --> Diary
    Diary --> Summary
    Summary --> DayIntro: day < 5
    Summary --> [*]: day = 5
  }
  Playing --> Paused: Esc / Pause
  Paused --> Playing: Resume
  Paused --> Menu: Save & Main Menu
  Playing --> Finale
  Finale --> Results
  Results --> Ending
  Ending --> Menu
  SaveError --> Menu: restore backup / start fresh
```

## 6. Saving & resuming

| Event | What is written | File |
|---|---|---|
| Language, avatar or settings change | profile | `profile.json` |
| Stall chosen (S11 confirm) | stall choice record + `progress.cursor` | `riasec.json` + `profile.json` |
| What / Loved-it confirm | item record + cursor + lights | `riasec.json` + `profile.json` |
| How / Diary confirm | item record + cursor + lights | `bigfive.json` + `profile.json` |
| Visit complete, day complete | cursor + lights + board photos | `profile.json` |

- **How writes are done:** each file is written to a `*.tmp` file, flushed, then renamed over the original (an atomic replace). The previous version is kept as `*.bak`.
- **Order of writes:** the item file is written **before** the cursor. If the game crashes in between, the resume logic checks whether the next item already has a record and skips past it, so no answer is ever duplicated or lost.
- **Cursor format:** `{"day":2,"visit":2,"step":1,"sub":"loved"}`. The resume point is the next screen after the cursor (S12 for a visit start, otherwise the exact card).
- **Pause → Save & Main Menu** never discards an answer that has been confirmed. A card that has been selected but **not confirmed** is not saved, and the card is shown again (with a new random order) on resume.

## 7. Timing budget (target)

| Segment | Time | Count | Total |
|---|---|---|---|
| Onboarding (language, notice, avatar, story) | 3–4 min | 1 | ~4 min |
| Day intro + morning dialogue | 40 s | 5 | ~3.5 min |
| Map + stall choice | 20 s | 10 | ~3.5 min |
| Stall visit (5 steps) | 90–110 s | 10 | ~17 min |
| Diary + summary | 70 s | 5 | ~6 min |
| Finale + results | 3 min | 1 | ~3 min |
| **Total** | | | **~37–45 min** (plus reading time for slower readers, up to ~60 min) |

This fits one double period, or two single periods with a save between them.

## 8. Input map

| Action | Mouse/Touch | Keyboard |
|---|---|---|
| Select / confirm | Tap | Enter / Space |
| Move focus | — | Tab / Shift+Tab, arrow keys |
| Advance dialogue | Tap anywhere | Enter / Space |
| Skip dialogue | Skip pill | Hold Enter 0.6 s |
| Pause | Pause button | Esc |
| Back (in menus) | Back button | Backspace / Esc |

## 9. Day-by-day content beats

| Day | Morning (Karim → buddy) | Map tip | Evening recap (Hudhud) | Teaser |
|---|---|---|---|---|
| 1 | Mela announced, torn banner, "You're a volunteer!" → Zain explains the map and the Kaam Boards (tutorial prompts) | "Pick any stall. There's no wrong one!" | First diary: "This diary is just between us." | Hira's big list |
| 2 | Karim: "Hira has a list." → Hira, clipboard, clouds | "Rain or not, the jobs won't wait!" | Recap of today's stalls | Bilal and the stage |
| 3 | The stage frame arrives → Bilal, jokes, nerves | "The stage needs everyone today." | Recap | Sara's camera |
| 4 | New volunteers join → Sara photographs everything | "Strike a pose at every stall!" | Recap + "tomorrow is the day" | Mela Day! |
| 5 | Gates open, crowds → Karim joins the player | "Families are here, let's go!" | Last diary | → Closing ceremony |
