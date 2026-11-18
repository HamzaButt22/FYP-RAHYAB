# ADR-0017: Enforce staff data scope in the API; defer Row-Level Security

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-18 |
| **Deciders** | Hamza Butt (team review pending: Zahid Bashir, Daniyal Sarwar; supervisor Zeeshan Ali to be informed) |
| **Requirements** | FR-78, NFR-42, NFR-43; closes the open item "Row-Level Security" in `docs/security/SECURITY.md` §9.2 |

## Context

The teacher dashboard (FR-72..78) is the first part of Rahyaab where one staff member can read many students' data. Two things must hold on every request: staff see only their own classes (teachers and counsellors their assigned classes, a school admin their school, a platform admin everything), and only students whose parent (or adult self) consent and teacher-visibility consent are both in force (FR-78).

`SECURITY.md` §9.2 asked for a decision, with the first dashboard API, on whether PostgreSQL Row-Level Security (RLS) should be a second wall behind the API's own checks. RLS would attach a policy to every student-linked table (student, consent, recommendation, trait_estimate, flag, note, …), keyed by the caller's school and classes, set on each request with `SET LOCAL`. A missed check in the API would then return nothing instead of another school's data.

## Decision

**For the pilot, the API enforces the scope, in one place, and RLS is deferred.**

- Every `/dash/*` query uses the same two SQL fragments in `backend/api/src/rahyaab_api/routers/dashboard.py`: `_MY_CLASSES` (which classes the caller may see, from the session's role, staff id and school; never from the request) and `_VISIBLE` (not archived, both consents in force). No dashboard query reads student data without them.
- Anything outside the scope answers `404`, so its existence is not revealed; researchers get `403` on the dashboard.
- Tests pin it down: the route-by-role matrix (TC-SEC-05), own classes only (TC-DASH-02), consented students only (TC-DASH-03), run against PostgreSQL in CI.
- Every read of student data is written to the audit log with the staff id (NFR-43), so a wrong read would be visible afterwards.
- The API's database role (`api_rw`) still cannot read `guardian_contact`, research tables or `school_file`, and the jobs role cannot read sessions' secrets: table grants remain the database-level wall.

## Why not RLS now

- **Size:** the pilot is one or two schools and a handful of staff accounts. The data a mistake could expose is small, and the audit log would show it.
- **Cost:** RLS on about ten tables, a per-request `SET LOCAL` in every route (students' routes too), and policies that must match the API's rules exactly. That is roughly a week of work and a new class of bugs (a forgotten `SET LOCAL` silently returns nothing) in the weeks before the FYP-1 demo.
- **The same rule in two places:** RLS policies would duplicate `_MY_CLASSES` and `_VISIBLE` in SQL that is harder to test and review than one Python module with route tests.

## Consequences

- One shared filter is now the only thing standing between a staff member and another class's data. Any new dashboard query **must** use `_MY_CLASSES` and `_VISIBLE`; code review checks this, and each new route gets a matrix test.
- **Revisit before** Rahyaab serves more than the pilot schools (licensed schools, ADR-0015), or if a second service starts reading the database. Adding RLS then is additive: the filters already exist and become the policies.
- `SECURITY.md` §9.2 records this decision instead of an open gap.
