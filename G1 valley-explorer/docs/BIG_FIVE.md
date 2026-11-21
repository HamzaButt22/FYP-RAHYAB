# Big Five in Valley Explorer (implemented 16 Nov 2026)

**Decision:** at the project's request, Valley Explorer now measures both RIASEC interests and Big Five personality, so that advice rests on more than one kind of evidence. This replaces the earlier proposal document, which had kept Big Five switched off pending approval. Record the supervisor's sign-off in the project file.

## What the student does
After each of the 8 stops, a **Traveller's Journal** page shows 2–3 short statements, one at a time ("I like order."). The student taps how much it is like them on a 5-point scale (growing dots, not faces, so no answer looks better), or skips. 20 statements in total, about 2 minutes spread over the journey. Answers earn no coins, so there is nothing to gain by rushing. A page interrupted by an app kill comes back on restart.

## Instrument
The **Mini-IPIP** (Donnellan, Oswald, Baird & Lucas, 2006, *Psychological Assessment* 18, 192–203): 20 items, 4 per trait, from the public-domain International Personality Item Pool (ipip.ori.org). Wording and keying were checked against the IPIP key page. Adaptations: "I" added at the start of each statement; short glosses under the two "party" items (family gathering/wedding), the two "abstract ideas" items and "feel blue". Scored text is unchanged. Item → stop assignment: `core/bigfive/items.ts` (`JOURNAL_PAGES`); every trait is spread over at least 3 stops.

## Scoring (`core/bigfive/scoring.ts`, Python port `analytics/valley_bigfive.py`)
- Reverse-keyed items score 6 − answer. Trait = mean of answered items (1–5), shown as (mean − 1) / 4 × 100.
- Reported only when ≥ 3 of the trait's 4 items were answered.
- Bands for wording only: mean ≥ 3.5 "higher", ≤ 2.5 "lower", else "middle". No percentiles (no norms exist for Pakistani adolescents).
- The integration test checks the app and the backend give identical numbers for a full journey.

## Behaviour estimates (research only, never shown to students)
Transparent gameplay indicators beside the questionnaire, so the research team can test whether play agrees with self-report:
- **Openness:** share of valley signs read before the gate; variety of activities tried.
- **Conscientiousness:** share of started activities finished; share of optional steps done; scored puzzles not skipped.
- **Neuroticism (very weak):** giving up after a wrong practice answer.
- **Extraversion, Agreeableness: not estimated.** The only game signals (leading roles, helping activities) are already counted as RIASEC Leading/Helping; estimating them would make the two measures look like they agree when they are the same data.
The per-trait difference (questionnaire − behaviour) is in `AssessmentOutput.bigfive.comparison` and on the dashboard.

## What the student sees
"How you usually are": one plain sentence per reported trait. Both ends of every trait are described as strengths or neutral; Neuroticism is shown as "Staying calm". No numbers, no labels such as "introvert". "Ideas to explore" combines both measures: example fields for the top interests (Holland areas), "How you might like to work" tips from personality, and a note when an interest and a trait point the same way (e.g. Helping + Caring about others).

## Limits (say these in the report and viva)
- Four items per trait is short; precision is limited. Self-report by adolescents can be affected by mood and wanting to look good.
- English wording only; an Urdu version needs translation and back-translation by people, then piloting.
- No local norms; agreement between the questionnaire and gameplay is a research question, not an assumption.
- Personality is offered as context for a conversation with family, teachers or counsellors, never as a decision.
