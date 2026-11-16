# ADR-0009: Write the story in Ink and run it with inkjs

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | GDD v3 §10 |

## Context

The game has about 1,200–1,500 dialogue lines, with branching, callbacks, flags and four weeks of scenes. Writers (Daniyal and the team) must be able to edit the story without touching code. Since 16 Nov 2026 the dialogue is English only (ADR-0016); the Roman Urdu and Urdu lines are removed.

## Decision

The story is written in **Ink** (inkle, MIT licence), compiled to JSON in CI, and run in the app by **inkjs**.
- Ink tags carry measurement metadata (`#pair:R-S`, `#voice:dil`, `#task:spatial`).
- External functions launch tasks, record choices and update the letter.
- A CI check verifies that the compiled story covers `pairs.json` (T-PAR-02).

## Consequences

- **Good:** easy for writers; golden playthroughs can be tested; content updates ship as content packs (RFC-0001).
- **Cost:** a custom bridge between Ink and the measurement model.
- **Cost:** Ink's tooling is English-centric, so story text lives in string tables keyed from Ink (`en.json`).

## Alternatives considered

- **Yarn Spinner:** a good tool, but its JavaScript runtime is less mature.
- **Hand-written JSON state machines:** hard for writers to edit.
