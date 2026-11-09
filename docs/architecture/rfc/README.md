# Requests for comments (RFCs)

An RFC is a design proposal that needs discussion before it is built. Write one when a change:
- touches more than one component (app, API, scoring, content, dashboard);
- changes a public contract (API, event schema, content-pack format);
- or is hard to reverse.

Small decisions go straight to an [ADR](../adr/README.md).

## Process

1. **Draft:** copy the template below to `RFC-NNNN-short-title.md`, set the status to *Draft*, and open a PR labelled `rfc`.
2. **Review:** at least one teammate from each affected component comments. Open the review for **5 working days**, or until the next sprint review. Raise it with the supervisor if it changes scope.
3. **Decide:** the status becomes *Accepted*, *Rejected* or *Withdrawn*. An accepted RFC lists the ADRs it produced, and any SRS or OpenAPI changes.
4. **Build:** the issues that implement it link back to the RFC.

## Index

| RFC | Title | Status | Produces |
|---|---|---|---|
| [RFC-0001](RFC-0001-content-pack-format.md) | Content pack format and versioning | Accepted | ADR-0009; FR-81–83 |
| [RFC-0002](RFC-0002-telemetry-sync-protocol.md) | Telemetry sync protocol (envelope v3) | Accepted | ADR-0010; `POST /v1/events:batch` |
| [RFC-0003](RFC-0003-scoring-service-and-model-registry.md) | Scoring service and model registry | Accepted | ADR-0004, ADR-0005, ADR-0006 |
| [RFC-0004](RFC-0004-parent-share-and-consent-links.md) | Parent share and consent links | Accepted | ADR-0008; FR-66–68 |

## Template

```markdown
# RFC-NNNN: <title>

| | |
|---|---|
| **Status** | Draft / Accepted / Rejected / Withdrawn |
| **Author(s)** | |
| **Reviewers** | |
| **Created / decided** | YYYY-MM-DD / YYYY-MM-DD |
| **Requirements** | FR-/NFR- IDs |

## Summary
One paragraph.

## Motivation
The problem, and why now.

## Proposal
The design in enough detail to build it: data shapes, flows, error cases.

## Security, privacy and accessibility
What changes for minors' data, attack surface and accessible use.

## Alternatives
What else was considered.

## Rollout and testing
Migration, feature flags, tests (T- IDs).

## Open questions
```
