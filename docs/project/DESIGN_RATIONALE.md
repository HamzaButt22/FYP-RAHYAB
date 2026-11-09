# Design rationale: why each choice was made

This document explains, in one place, **why** Rahyaab looks, reads, plays and computes the way it does: the brand, colours, type, screens, words, game, frameworks, models, data, security, accessibility and technology. Each row gives the decision, the reason, and where the evidence or detail lives.

**Detailed sources:**
- brand: `BRAND_DECISIONS.md`;
- game: `design/game/GAME_DESIGN.md`;
- requirements and evidence tags: `SRS.md`;
- technology: `docs/architecture/adr/`;
- measurement: `SCIENTIFIC_BASIS.md`;
- accessibility: `design/specs/accessibility.md`.

## 1. Guiding principles

| Principle | What it changes |
|---|---|
| **A game, not a test.** Teens drop long questionnaires; families distrust "a quiz said so" | One story game; no rating scales; no timers or right/wrong feedback |
| **Guidance, not a verdict.** A wrong stream can cost two years | Top 3 + Plan B + confidence + "talk to your family"; costly routes never pushed |
| **Families decide together.** 82.6% of students rely on parents | Parent report through WhatsApp; Urdu first; read-aloud |
| **Cheap phones, weak internet** | Offline-first, ≤ 35 MB, no reaction-time scoring, 48 px targets |
| **Minors' privacy first** | No names, phone numbers or photos; consent gate; no third-party SDKs |
| **Explainable to a parent and an examiner** | IRT and congruence over black boxes; "Why this?" on every result |

## 2. Brand

| Decision | Reason | Evidence |
|---|---|---|
| **Name: Rahyaab (راہ یاب, "one who finds the way")** | Urdu, easy to say in both scripts, and says what the app does | BRAND_DECISIONS §1 |
| **Mascot: Hudhud, the hoopoe** | **Guide:** in Attar's *Conference of the Birds* the hoopoe guides the birds, who discover the answer was themselves. That matches "the answer is you". **Familiar:** the hoopoe is native to Pakistan and known from the story of Hazrat Suleman, so it feels local without being a cartoon child | BRAND_DECISIONS §1 |
| **Chubby (B2), flat style** | Friendly but not childish (v1 was rejected as "a children's story app"); simple shapes animate cheaply in Rive and read well at small sizes | BRAND_DECISIONS history |
| **Branch logo** | The "r" drawn as a branch with a dotted path: a choice of roads, growth, and an organic feel. Chosen by family vote | BRAND_DECISIONS final decisions |
| **Rejected:** midnight/AI-style palette, "Night hoopoe", roots, GT Road logo | Looked like a generic AI app, too dark, or too busy | BRAND_DECISIONS history |

## 3. Colour

| Colour | Light / dark | Why this colour | Why it is safe |
|---|---|---|---|
| **Terracotta** (primary, Dil) | `#B54A2F` / `#E07A5C` | The hoopoe's cinnamon body. Warm and earthy, close to Pakistani clay, brick and handicraft colours. It reads as "heart", which suits Dil's voice | White on it: 5.3:1 (light). Terracotta text uses `#A2401F` (5.6:1) |
| **Teal** (secondary, Duniya) | `#1F7A7A` / `#4FB3AE` | The cool complement of terracotta. Calm and practical, which suits Duniya's "head" voice. Dil and Duniya need two clearly different colours, and also differ by label | White on teal: 5.1:1 |
| **Parchment background** | `#F6EFE3` / `#121B1B` | Feels like paper and a letter, which matches the "letter from future you". It also avoids the cold white of generic apps. The dark mode is teal-tinted, not black, for warmth and less OLED smearing | Text on it: 13.9:1 (light), 14.9:1 (dark) |
| **Saffron accent** | `#F2B33D` | The hoopoe's crest; for celebration and highlights | **Never used for text**; dark text on saffron only (8.5:1) |
| **Success / danger** | `#2E7A52` / `#B42318` | Standard semantic colours, separate from the brand colours | ≥ 4.5:1, and always paired with an icon and words (never colour alone) |
| **RIASEC chart colours** | See SRS §8.4 | Six types must be told apart | Checked under protanopia, deuteranopia and tritanopia (red-green colour blindness affects about 1.4–5.8% of Pakistani males) |

Every text pair meets **WCAG 2.2 AA (4.5:1)**. A high-contrast theme reaching 7:1 is required by NFR-64.

## 4. Typography and icons

| Choice | Reason |
|---|---|
| **Bricolage Grotesque 800** for headings | Warm and characterful without being childish; reads well at large sizes; free (OFL) |
| **Plus Jakarta Sans** for text | Very legible at 15–17 px on low-resolution screens; open shapes; free (OFL) |
| **Gulzar** for Urdu | A Nastaliq face designed for screens; line heights are generous (34 px) so Nastaliq is never cut off |
| **Atkinson Hyperlegible** (optional reading font) | Designed for low vision; offered in the accessibility settings |
| **Lucide icons**, outline, 2 px | One consistent free set (ISC licence); the outline style matches the type weight |

## 5. Screens: why each one exists

| Screen | Why it exists | Key design choice and reason |
|---|---|---|
| S-00 Splash / loading | Brand moment while the app starts | Hudhud lands on the branch in 1.5 s, then the app loads. Long waits show what is happening ("Digging through your four weeks…") instead of a spinner |
| S-01 Language | Urdu and English speakers start equal | Asked first, before any text that needs reading |
| S-02 Welcome | Set expectations: no right answers, no clock | Reduces test anxiety; introduces the letter hook |
| S-03 Join (S-03e field help) | Join a class **without** personal data | Class code + nickname only; pickers instead of typing; help that never leaks (forms spec) |
| S-04 Family consent | The law and ethics need a parent's OK for minors | QR code + WhatsApp, because parents may not have the app |
| S-05/S-06 Profile, avatar | Board and group are needed for the rules; the avatar gives identity | Modest dress options (hijab, dupatta, cap) so every student can see themselves |
| S-07 Home | One place to continue | Only this week's 3 slots and the letter; no feed, no streaks |
| S-08 Week player | The game itself | Two voices, Dil (heart) and Duniya (world), make choices feel like a story, not a test |
| S-09 Diary, S-21 Letter | Natural breaks and visible progress | The letter's readability shows the model's real certainty (honest uncertainty) |
| S-10/S-10b/S-11 Blueprint, Why this? | The result, with reasons | Top 3 with fit bands in words, doors with sources, Plan B; "Why this?" for trust |
| S-10c Group fit | Students already in a group need guidance too | Open options first; costly routes only on request or with strong evidence |
| S-12/S-13/S-16 Explore | Students know few careers | Offline stream pages with tests, doors and alternatives |
| S-14/P-01 Share, parent report | Families decide | Preview exactly what the parent sees; Urdu-first page with Listen |
| S-18 You and accessibility | Control and inclusion | All accessibility settings in one place |
| S-25 Family | Show who can see what | Transparency about sharing; stop sharing at any time |
| S-28 Offline, S-29 Re-link | Real conditions: no internet, new phones | Clear "saved on your phone" message; teacher re-link instead of a password |
| S-31 Class check-in | Students move up a class or change situation | Keep results; update paths |
| D-01–D-12 Dashboard | Teachers need class progress, not individual verdicts | Roster, flags, and a summary of consented students only; small groups hidden |
| A-01–A-05 Admin | Run schools, models and data rights safely | Every action audited; model activation needs an evaluation report |

**No subscription or payment screens.** The app is free for students, contains no ads or in-app purchases, and Play's policies for apps used by minors are strict. Paid plans are future work only (SCREENS.md §5).

## 6. Words and tone

| Rule | Reason |
|---|---|
| Grade 6 reading level or lower; at most 2 lines per message | Mixed literacy; teens skim |
| Roman Urdu dialogue, Urdu-script UI option, English toggle | How Pakistani teens actually text; Urdu script for read-aloud |
| Never "wrong", "fail", "score", "verdict" | Reduces anxiety; results are a starting point |
| Confidence in words ("fairly sure"), and uncertainty as frequency ("in 10 versions of you, 6 fit…") | People understand frequencies better than probabilities |
| Gender-neutral wording; Urdu verbs follow the student's chosen form | Inclusion |
| Errors say the problem, the fix and an example, but stay generic about secrets | Helpful to users, useless to attackers (forms spec §4) |

## 7. Game design

| Decision | Reason | Rejected alternative |
|---|---|---|
| **One story game ("Your Year"), not mini-games** | Narrative satisfaction predicts engagement (β = .40); one world remembers your choices | Four separate games (v1), which felt like a test battery |
| **Forced choices between two attractive options** | Limit faking and "everything is good" answers; a proven model for scoring them (Thurstonian IRT) | Likert ratings or swipe cards, which feel like a questionnaire |
| **Week planner** | A natural ranking task that adds evidence without extra questions | — |
| **Untimed tasks, first attempt scored** | Cheap phones lag by 50–200 ms; timing would favour rich students and raise stress | Reflex or action games |
| **Puzzle families modelled on ICAR** | A validated design for each ability | Invented puzzles with unknown properties |
| **The letter from future you** | A hook that shows the model's real uncertainty | A fake progress bar |
| **No streaks, leaderboards or loss framing** | Wellbeing; ICO Children's Code (no nudges) | Engagement tricks |
| **"Try a day" simulations, not scored** | Thinking about real work is what changed career knowledge (like2be study), but simulations are too short to measure | Scoring the simulations |

## 8. Frameworks and models

| Choice | Reason | Rejected |
|---|---|---|
| RIASEC interests as the core | Most-validated career model; maps to every O*NET occupation and to Pakistani streams | Big Five (weak link to stream choice; privacy risk) |
| ICAR-style abilities | Public-domain, validated item types | Proprietary tests (licences) |
| O*NET work values, for tie-breaks only | What students care about; gives parents a language | Using values for ranking (too few dilemmas to be reliable) |
| **M1 Thurstonian IRT + GRM** | Standard for forced choice; gives a score **and** an error; explainable | Deep learning (only ~60 data points per student; not explainable) |
| **M2 staircase → Rasch/2PL** | Adaptive and standard for ability items | Raw percent-correct (ignores item difficulty) |
| **M3 congruence first; LightGBM only if clearly better and fair** | No ground truth for "right stream"; explainable baseline; ML can learn bias | ML-first; an LLM choosing streams (bias shown in pilots) |
| **M4 LLM optional, wording only, self-hosted** | Warmer explanations without sending minors' data out or letting AI decide | A cloud chatbot |

## 9. Data, privacy and security

| Choice | Reason |
|---|---|
| Nickname and class code; no names, phone numbers, emails or photos | Data that is never collected cannot leak |
| Consent gate on the server | Uploads are impossible without valid consent |
| Age stored as a band; gender only in an opt-in research table | Minimisation; gender is never a recommender input |
| Server-side scoring; append-only events | The phone can't be trusted; results can be reproduced |
| argon2id, MFA, single-use reset tokens, CORS allowlist, generic errors | Industry practice (OWASP ASVS L2) |
| Parent links instead of parent accounts; children saved only in the parent's own browser | No extra passwords to steal; no sibling data on the server |

## 10. Accessibility

Read-aloud (Urdu included), text up to 200%, high contrast, easy read, a reading font, reduce motion, button alternatives for every drag, and TalkBack and Switch Access support. Unmeasurable tasks are **not measured**, never failed. Reason: WCAG 2.2 AA, and fairness. The details are in `design/specs/accessibility.md`.

## 11. Technology

Each choice has an ADR in `docs/architecture/adr/`:
- the native Expo app (ADR-0002);
- FastAPI + PostgreSQL self-hosted (ADR-0003);
- server scoring (ADR-0004);
- append-only events (ADR-0005);
- transparent baselines (ADR-0006);
- no third-party SDKs (ADR-0007);
- the server-rendered parent page (ADR-0008);
- Ink (ADR-0009);
- the offline outbox (ADR-0010);
- pseudonymous identity (ADR-0011);
- the modular monolith (ADR-0012);
- no certificate pinning (ADR-0013);
- the monorepo (ADR-0014).
