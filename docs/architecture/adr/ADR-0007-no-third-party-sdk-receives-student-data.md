# ADR-0007: No third-party SDK receives student data

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-29 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SRS ADR-06 |

## Context

Users are 14–18. Pakistan's draft Personal Data Protection Bill and the ICO Children's Code discourage behavioural profiling of children. Google Play's families and teen policies restrict SDKs in apps used by minors.

## Decision

The app includes no analytics, advertising, attribution or cloud crash-reporting SDK.
- **Crash and error reporting:** self-hosted **GlitchTip**, with personal data scrubbed.
- **O*NET:** called server-side only, without student data.
- **WhatsApp:** reached only through the OS share sheet, with no API.

## Consequences

- **Good:** a simple Data safety form ("no data shared") and a smaller breach surface.
- **Cost:** product analytics must be built in-house from consented events, and the team runs its own error tracking.

## Alternatives considered

- **Rejected:** Firebase Analytics and Crashlytics, PostHog Cloud, Sentry SaaS.
