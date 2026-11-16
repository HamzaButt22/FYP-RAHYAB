# ADR-0016: English-only interface

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-16 |
| **Deciders** | Hamza Butt (team review pending: Zahid Bashir, Daniyal Sarwar; supervisor Zeeshan Ali to be informed) |
| **Requirements** | Supersedes the Urdu and right-to-left requirements of SRS v1.4 (§7.4 and the FRs, NFRs and test cases marked *Removed 16 Nov 2026*) |

## Context

Until 15 Nov 2026 Rahyaab was designed and partly built in English and Urdu: an Urdu interface with right-to-left layout, the Gulzar Nastaliq font, Roman Urdu dialogue, Urdu read-aloud audio, an Urdu store listing, an Urdu parent page and dashboard, and a native-speaker review of every Urdu string.

That work had a real cost. Nastaliq needed its own type scale and repeated fixes for clipped letters on Android (PR #41, #45). Every screen had to be designed, built and tested twice. Native review and Urdu audio needed people the team does not have. The FYP-1 demo is in weeks 17–18 (14–25 Dec 2026), and the plan's slack is about 3%.

## Decision

**The app, the teacher dashboard, the parent page, the store listing, notifications, read-aloud and the privacy notice and terms are English only.**

- Removed: the Urdu interface and strings, right-to-left layout, Urdu fonts and type styles, the language choice screen (S-01), Roman Urdu dialogue, Urdu read-aloud and recorded Urdu audio (WBS 6.5), the Urdu store listing, and the native review of app copy.
- Requirement IDs are not renumbered: requirements that existed only for Urdu are marked *Removed 16 Nov 2026 (ADR-0016)*; others are reworded to English only.
- The game–app contract becomes 2.0.0: `GameContext` no longer has `locale` or `rtl`, and a module's `title` is one English string (RFC-0005).

**Kept on purpose:**
- **The paper consent and assent forms for parents (Forms A and B) keep their Urdu versions.** Parents must understand what they agree to; the ethics office is likely to require it. They still need a native speaker's review before submission.
- **The translation setup** (i18next with `en.json`) stays, with English as the only language. All copy stays in one file for review, and a language could be added later without touching screens.
- **The Urdu-script check on nicknames** stays: students can still type their real name in Urdu letters on their phone's keyboard, and the full-name block (FR-102) must catch it.
- **A school's medium of instruction** (`school.medium`: Urdu, English, both) stays in the data model as a research covariate.

## Consequences

- **Good:**
  - One interface to design, build and test; no Nastaliq clipping work.
  - No dependence on a native Urdu editor or voice recordings for the app.
  - Smaller app (no Urdu font) and simpler code (no right-to-left paths).
- **Bad, and how we handle it:**
  - **Students from Urdu-medium schools may read English less fluently.** This can lower engagement and add measurement error unrelated to interests or abilities. Mitigations: all copy at about a Grade 6 reading level (AGENTS.md), English read-aloud on every screen, icons and pictures beside text, short sentences, and teachers can explain the app in class. Analysis records each school's medium and reports results by medium; this is stated as a limitation in the final report.
  - **Parents who read only Urdu** see an English parent page. The paper consent form remains in Urdu, and the parent page uses short plain English.
  - Earlier design work (Urdu screens, the Gulzar type scale, the Figma Urdu frames) is set aside. The history stays in `docs/archive/`, `docs/research/` and Git.
- **Reversible:** adding a language later means a new strings file and, for Urdu, the right-to-left and font work again. The Git history keeps the removed implementation (`main` at e189353, 16 Nov 2026).

## Alternatives

- **Keep both languages:** best reach, but doubles design and test work at a time the schedule has no slack.
- **Urdu only:** most accessible for Urdu-medium students, but English is the language of streams, careers and university programmes in the stream library, and most of the team's materials are in English.
- **English app with an Urdu glossary or audio only:** still needs a native speaker and Urdu audio; postponed rather than chosen.
