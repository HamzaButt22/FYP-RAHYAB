# ADR-0006: Ship transparent baselines first; gate the learned ranker

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-05 |

## Context

There is no ground truth for "the right stream". ML recommenders can learn majority and gender bias. Students and parents need reasons they can check.

## Decision

Production starts with two transparent recommenders:
- **(a)** a counsellor AHP rule table;
- **(b)** a congruence score with weights 0.55 / 0.35 / 0.10.

A LightGBM LambdaRank model **(c)** replaces (b) only if both hold:
- it beats (b) by ≥ .05 NDCG@3, with a confidence interval that excludes 0;
- it passes the fairness thresholds (|difference| ≤ .10).

## Consequences

- **Good:** explanations come from exact contributions, and the system is safe by default.
- **Cost:** accuracy may be lower than a tuned model until pilot data exists.

## Alternatives considered

- **ML first:** rejected, because there are no labels and the bias risk is high.
- **An LLM that ranks streams:** rejected outright. The optional LLM (M4) only rephrases computed reasons.
