# Database (PostgreSQL 16)

| File | What |
|---|---|
| `schema.sql` | The reviewed schema design (v1.3): tables, constraints, roles, grants and triggers. The ERDs in `docs/architecture/diagrams/erd/` follow it. |
| `set_role_passwords.sql` | Sets the passwords of the least-privilege roles (`api_rw`, `jobs`, `research_ro`, `guardian_rw`) once per environment, from psql variables |
| `seed/dev_seed.sql` | Synthetic data for local development only (one school, two classes). Never load it into staging or production. |

**How the schema reaches a database.** Migrations live with the API, in `backend/api/migrations/` (Alembic). The first migration (`0001`) applies `schema.sql`. Every later change is a new, backward-compatible migration (expand → migrate → contract), and `schema.sql` is updated in the same pull request so the design and the migrations never drift.

**Local development**

```bash
docker compose -f infra/docker/docker-compose.yml up -d db
```

```bash
docker compose -f infra/docker/docker-compose.yml --profile migrate run --rm migrate
```

```bash
docker compose -f infra/docker/docker-compose.yml exec -T db psql -U rahyaab_admin -d rahyaab -v api_pw=change-me-locally -v jobs_pw=change-me-locally -v research_pw=change-me-locally -v guardian_pw=change-me-locally < database/set_role_passwords.sql
```

```bash
docker compose -f infra/docker/docker-compose.yml exec -T db psql -U rahyaab_admin -d rahyaab < database/seed/dev_seed.sql
```

**Roles.** The container's admin (`POSTGRES_USER`) runs migrations and owns the objects. The API connects as `api_rw` and the jobs worker as `jobs`, which have only the grants in `schema.sql`.

**Rules** (from `docs/security/`): no personal data outside `guardian_contact`, `consent_slip` (form serial only) and `staff_user`; the API runs as `api_rw`, never as the owner; backups are encrypted with `age` and copied off-site nightly.
