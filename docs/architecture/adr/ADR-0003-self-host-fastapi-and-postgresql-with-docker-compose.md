# ADR-0003: Self-host FastAPI and PostgreSQL with Docker Compose

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-02 |

## Context

The backend handles:
- pseudonymous accounts, consent, event ingestion and scoring;
- parent share pages and the teacher dashboard.

The data concerns minors, so it must be movable to a Pakistani or university host (NFR-48). The FYP proposal committed to FastAPI, and the scoring code is Python.

## Decision

- **API:** a **FastAPI** (Python 3.13) application.
- **Database:** **PostgreSQL 16+**.
- **Hosting:** both run with **Docker Compose** on one Linux VM, behind **Caddy** for TLS.
- **Other containers on the same host:** jobs (rescore, retention, O*NET cache) and GlitchTip.

## Consequences

- **Good:** no vendor lock-in; the same compose file runs on staging, production or the university server.
- **Good:** the API imports the scoring package directly.
- **Cost:** the team owns patching, backups and monitoring (see `docs/devops/CI_CD.md` and `docs/security/DATA_GOVERNANCE.md`).
- **Risk:** one VM is a single point of failure. That is acceptable for the pilot (≤ 1,000 students), with restore drills planned.

## Alternatives considered

- **Supabase:** fast to start, but ties auth and storage to a third party. Kept as a fallback.
- **Firebase:** rejected, because a third party would process student data (ADR-0007).
- **Kubernetes:** too much to operate for a three-person team.
