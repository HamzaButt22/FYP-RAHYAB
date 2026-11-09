# ADR-0013: Trust system CAs only; no certificate pinning

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-11-04 |
| **Deciders** | Zahid Bashir, Hamza Butt, Daniyal Sarwar (supervisor Zeeshan Ali consulted) |
| **Was** | SECURITY §3 |

## Context

Certificate pinning blocks interception, but it has two costs for us:
- it breaks behind school proxies;
- if a certificate rotates, the app cannot connect until an update ships, which would strand students mid-week.

## Decision

- **TLS:** the Android network security config allows **TLS 1.2+ to system CAs only** (never user-added CAs) and **no cleartext**.
- **Pinning:** used only in CI integration tests, not in the shipped app.
- **Play Integrity:** optional (NFR-68); it raises trust in client requests.

## Consequences

- **Good:** reliable connections and safe certificate rotation.
- **Cost:** a device with a malicious *system* CA could intercept traffic. That needs a rooted phone, which is outside the pilot's threat model.

## Alternatives considered

- **Public-key pinning with backup pins:** reconsider after the pilot if the threat model changes.
