# ADR-0015: Sell institutional licences and individual subscriptions

| | |
|---|---|
| **Status** | Accepted (licence data and the join check are built; payments are post-MVP) |
| **Date** | 2026-11-11 |
| **Deciders** | Hamza Butt (team review pending: Zahid Bashir, Daniyal Sarwar; supervisor Zeeshan Ali to be consulted) |
| **Requirements** | FR-107, FR-108 |

## Context

Rahyaab will be offered in two ways:
- an **institution** (a school, a school chain or an academy) buys access for its students, who then join with class codes;
- a **student or family** buys an individual subscription.

The MVP pilot is free and runs only through schools (MVP §2.1). Before any sale, the data model must already say who may use the app and until when. It must also do this without handling payment data or weakening the privacy design (ADR-0007, ADR-0011).

## Decision

- **One `licence` table** (database/schema.sql v1.4), three kinds:
  - `pilot`: free, for pilot schools, usually without a seat limit;
  - `institution`: a school buys a number of **seats** for a period;
  - `individual`: one student's subscription (post-MVP).

  Each licence has `starts_at` and `ends_at`.
- **A class code works only while its school holds an active pilot or institution licence** (FR-107). **A seat is used only when a student's consent is granted** (a recorded slip, claimed at join or later through `POST /consents:claim`). Joining without consent uses no seat, so anyone holding a class code cannot exhaust a school's seats with fake profiles; never-consented profiles are deleted after 30 days. *(Changed on 12 Nov 2026: seats were first counted at join.)* Otherwise the join answers `403 school_access_inactive` ("Your school's Rahyaab access isn't active right now. Please tell your teacher."). This answer only follows a valid class code, so it reveals nothing to a code guesser.
- **What a lapsed licence does to joined students:** they keep their results, the stream library and their parent link. The yearly re-check uses the licence.
- **Individual subscriptions (FR-108, post-MVP):**
  - bought through the app store's own billing, by the parent's account for a minor (Google Play requires an adult account holder);
  - consent through the parent OTP path (FR-05b);
  - the app receives only an entitlement (a store purchase token checked on the server), never card details.
- **Institutions are invoiced** outside the app; an admin records the licence (FR-80 admin tools).
- **No payment data is ever stored by Rahyaab.** The licence row holds kind, holder, seats and dates only.
- **Pricing does not affect scoring.** The game, the scores and the recommendations are identical for every kind of licence. This keeps the research valid and the guidance fair.

## Consequences

- **Good:**
  - Schools can be sold seats without code changes.
  - The pilot uses the same check, with a free licence.
  - The privacy design is unchanged.
- **Cost:**
  - Seat counting is per school: students with active parent or self consent in any of its classes. Concurrent claims are serialised on the licence row, so seats are not over-sold.
  - Admin screens to issue licences come with FR-80 (scripts in F1, screens in F2).
- **Open:** prices, refund terms and a written agreement with schools (data-processing terms) need legal review before the first sale.

## Alternatives considered

- **Free app with ads:** rejected. Ads would bring third-party SDKs and tracking near minors' data (ADR-0007).
- **Payment inside the app for minors:** rejected. Children should not pay; the parent's store account pays.
- **Per-student codes bought by families for school use:** rejected for the MVP. It complicates consent and the class link.
