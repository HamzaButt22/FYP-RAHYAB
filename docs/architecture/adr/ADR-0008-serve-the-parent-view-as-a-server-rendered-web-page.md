# ADR-0008: Serve the parent view as a server-rendered web page

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-07 |

## Context

Many parents have low-end phones, little storage, and limited Urdu or English literacy. Asking them to install an app would lose most of them.

## Decision

The parent report (P-01) and consent page (P-02) are **server-rendered Jinja2 pages** behind a share token, opened from a WhatsApp link.
- No third-party scripts.
- Each page is 150 KB or less, for 3G.
- A "Listen" (read-aloud) button.

## Consequences

- **Good:** no install; works in any browser; fast; easy to lock down with a strict CSP.
- **Cost:** limited interactivity, which is fine for a report.

## Alternatives considered

- **A parent app:** rejected, because installing it is too much friction.
- **A single-page app:** rejected, because it is heavier and shows nothing without JavaScript.
