# ADR-0001: Record architecture decisions

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | — |

## Context

Decisions about Rahyaab's architecture were spread across the SRS (§12.1, ADR-01 to ADR-07), the game design document and chat. New team members, the supervisor and the FYP examiners need to see **what** was decided, **why**, and **what was rejected**, in one place that changes only through reviewed pull requests.

## Decision

We record every significant architecture decision as a short Markdown file in `docs/architecture/adr/`, using a lightweight MADR layout: context, decision, consequences, alternatives.

- Files are numbered `ADR-NNNN-short-title.md` and are never renumbered.
- An accepted ADR is not edited for substance. To change a decision, write a new ADR that **supersedes** it, and mark the old one "Superseded by ADR-NNNN".
- Larger proposals that need discussion first start as an RFC in `docs/architecture/rfc/`. An accepted RFC produces one or more ADRs.
- The SRS's ADR-01 to ADR-07 are carried over as ADR-0002 to ADR-0008 (see the index).

## Consequences

- Decisions are traceable to requirements and reviewable in Git history (LO3, LO6 evidence).
- A small writing cost per decision (about 20 minutes).

## Alternatives considered

- Keep decisions only in the SRS: rejected, because the SRS is a requirements document and is already long.
- A wiki: rejected, because it sits outside code review.
