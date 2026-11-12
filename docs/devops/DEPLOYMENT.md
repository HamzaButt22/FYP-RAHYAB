# Deployment: Docker, environments, staging, production and Kubernetes

How Rahyaab runs, from a developer laptop to the pilot server.

**Related:**
- `CI_CD.md` (pipelines);
- ADR-0003 (self-hosted FastAPI and PostgreSQL);
- ADR-0012 (modular monolith);
- `docs/security/DATA_GOVERNANCE.md` (backups and encryption).

**Templates:** in [`infra/docker/`](../../infra/docker/). They move to `infra/` when the monorepo is set up in Sprint 1.

## 1. Decisions at a glance

| Question | Decision | Why |
|---|---|---|
| Containers? | **Yes: Docker** for every server process (API, jobs, PostgreSQL, Caddy, GlitchTip, Uptime Kuma) | The same image runs on a laptop, staging and production; there is no "works on my machine" |
| Orchestrator? | **Docker Compose** on one VM per environment | 3 developers; pilot ≤ 1,000 students (5,000 tested, NFR-57); one VM is enough and simple to run |
| Kubernetes? | **Not for the pilot, but ready.** The pilot runs on one VM with Docker Compose. Kubernetes manifests (Kustomize base + staging and production overlays) are in `infra/k8s/` for when the conditions in §7 are met, and the release workflow can deploy to either target | Running Kubernetes (control plane, ingress, certificates, storage) costs more time than it saves at pilot scale; having the manifests ready keeps the option open |
| Mobile app hosting | **Google Play**, built by EAS Build or `eas build --local`; internal → closed → production tracks | The standard Android path |
| Dashboard hosting | Static files served by **Caddy** on the same VM | No extra service |
| TLS certificates | **Caddy** obtains and renews Let's Encrypt certificates automatically | Zero-maintenance HTTPS |
| Registry | **GitHub Container Registry (GHCR)**, private images | Free with the repository |
| Secrets | `.env` files on the server (`chmod 600`) and GitHub environment secrets; never in Git | DATA_GOVERNANCE §4 |
| Backups | Nightly `pg_dump`, encrypted with `age`, copied off-site; restore tested weekly (staging) and each semester (production) | RPO ≤ 24 h, RTO ≤ 4 h (NFR-34) |

## 2. Environments

| | **Local (dev)** | **Staging** | **Production (pilot)** |
|---|---|---|---|
| Who | Each developer | Team, supervisor demos | Pilot schools |
| Where | Laptop with Docker Desktop (you have it installed) | Small VM (1 vCPU / 2 GB) or the university server | VM: 4 vCPU / 8 GB / 80 GB SSD, Ubuntu 24.04 LTS, region by measured latency (p95 ≤ 150 ms from Pakistani carriers). Memory budget: PostgreSQL 2 GB, API (2 workers) 1 GB, jobs 0.5 GB, GlitchTip with its worker and queue 2 GB, Caddy 0.1 GB, headroom ≈ 2 GB |
| Data | Synthetic seed only | Synthetic + team test accounts | Real, consented data |
| Deployed by | `docker compose up` | Automatic on merge to `main` | A version tag + manual approval |
| URL | `http://localhost:8000` | `https://staging.api.rahyaab.pk` (placeholder) | `https://api.rahyaab.pk` (placeholder) |
| Mobile build | Expo development build (`pnpm android`; Expo Go cannot run the app) | EAS `preview` APK (internal testers) | EAS `production` AAB (Play closed track) |
| Debug tools | On | Off (release-like) | Off; no debug routes (NFR-66) |

## 3. Local development with Docker

```bash
cp infra/docker/.env.example .env
```

```bash
docker compose -f infra/docker/docker-compose.yml up -d db
```

```bash
docker compose -f infra/docker/docker-compose.yml up --build api
```

- **The mobile app** runs outside Docker (`pnpm --filter mobile start`) and points at `http://<your-LAN-IP>:8000/v1`.
- **The database** is on `localhost:5432`, and the seed script loads synthetic schools, classes and consent.

## 4. Staging and production on a VM

**One-time server setup:**
1. Create the VM with Ubuntu 24.04 LTS and attach an encrypted disk.
2. Create a non-root user, allow SSH by key only, disable root login and password login.
3. Firewall: open 22 (team IPs only) and 443 (plus 80 for certificate issuing).
4. Install Docker Engine and the Compose plugin **v2.24 or newer** (the prod file uses `!reset`), and enable unattended security upgrades.
5. Create `/srv/rahyaab` with `.env` (`chmod 600`), copied from `infra/docker/.env.example`, with real secrets.
6. Point DNS (`api.`, `dashboard.`, `staging.` subdomains) at the VM.

**Deploy (CI does this; the manual equivalent is shown):**

```bash
ssh deploy@server 'cd /srv/rahyaab && export COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml && docker compose pull && docker compose --profile migrate run --rm migrate && docker compose up -d'
```

Migrations run **before** the new API starts, in a one-shot `migrate` container with the owner role (the API container is read-only and has no schema rights). Every migration is backward-compatible (expand → migrate → contract), so the old API keeps working against the new schema during the switch.

**Blue/green on one host:**
1. Start the new `api` container next to the old one.
2. Check `/health`.
3. Switch Caddy's upstream.
4. Keep the old container for 24 hours.

**Rollback:** redeploy the previous image tag (target ≤ 10 minutes).

## 5. Capacity, measured

The targets come from NFR-09 and NFR-57, and the tests are TC-PERF-03 and TC-PERF-05 to 08.

| Measure | Target | How it's checked |
|---|---|---|
| Normal peak | 50 concurrent users; `/events:batch` and `/results` p95 ≤ 800 ms | Locust, nightly smoke and release run |
| Spike | 300 joins in 60 s, ≥ 99% success after retries | `resilience.yml` weekly |
| Soak | 8 h at 60% load: memory growth ≤ 10%, p95 flat | Weekly |
| Break point | ≥ 3× pilot peak before failure, failing gracefully (429/503) | Each milestone |
| Volume | 20 million events, 5,000 students: roster p95 ≤ 500 ms | Pre-pilot |
| Recovery | Database down, worker killed, disk full: no data loss, automatic recovery | Chaos tests, monthly |

**Sizing rule:** if the break point falls below 3× the pilot peak, first raise Uvicorn workers to 4 and add PostgreSQL indexes. Next, move the VM to 4 vCPU / 8 GB. Only then consider §7.

## 6. Monitoring and operations

| Concern | Tool |
|---|---|
| Errors | GlitchTip (self-hosted, PII scrubbed) |
| Uptime and certificates | Uptime Kuma on a **separate** small machine (or a free external monitor), checking `/v1/health` and TLS expiry; a monitor on the same VM could not report the VM being down |
| Logs | Docker logs with a 30-day rotation; IPs truncated |
| Alerts (email to two admins) | 5xx > 1% over 5 min; failed logins > 20 per 10 min; disk > 80%; backup failure |
| Backups | `jobs` container nightly: `pg_dump` → encrypted with `age` (public key on the server, private key offline) → copied the same night to object storage in another location (`rclone`, credentials as a Docker secret). Nightly automated restore test: the newest off-site dump is restored into a throwaway PostgreSQL container on staging and checked (row counts, schema version), then the container is removed; staging data is never touched (TC-OPS-01) |
| Patching | Unattended upgrades; base images rebuilt weekly (Dependabot) |

## 7. When to switch to Kubernetes (manifests ready in `infra/k8s/`)

Move to Kubernetes (k3s on two or three VMs, or a managed service) **only if at least two** of these become true after the FYP:
- more than ~20,000 active students, or several provinces with separate data-residency needs;
- a need for zero-downtime deploys across several hosts, or for horizontal autoscaling;
- a separate team operating the platform.

**Migration path (already prepared in `infra/k8s/`, see its README):** the same Docker images become a Kubernetes `Deployment` (api, jobs) with a `StatefulSet` or managed PostgreSQL. Caddy becomes an ingress controller, and the `.env` file becomes `Secret`s. No application code changes, because the API is stateless (NFR-57).

## 8. Checklist before the pilot goes live

- [ ] Production VM hardened (§4); firewall and SSH key-only checked.
- [ ] Secrets only in `.env` (600) and GitHub environments; gitleaks clean.
- [ ] TLS A+ on an SSL test; HSTS on; CORS allowlist correct (TC-SEC-09).
- [ ] Backups running; a restore drill passed (TC-CHAOS-07).
- [ ] Monitoring and alerts firing in a test.
- [ ] Pentest done with no open critical or high findings (NFR-70).
- [ ] Data region recorded in the DPIA.
