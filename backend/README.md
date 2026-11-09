# Backend

| Package | What |
|---|---|
| `api/` | The FastAPI service (`rahyaab_api`): routers, settings, the jobs worker, Alembic migrations and the Docker image |
| `scoring/` | The scoring package (`rahyaab_scoring`): pure functions only, so every result can be reproduced (RFC-0003) |

Each package has its own `pyproject.toml` and `uv.lock`; the API depends on the scoring package by path.

## Run and test

```bash
cd backend/api && uv sync && uv run pytest
```

```bash
cd backend/api && APP_ENV=development DATABASE_URL=postgresql+psycopg://api_rw:change-me-locally@localhost:5432/rahyaab uv run uvicorn rahyaab_api.main:app --reload
```

Without `APP_ENV`, the API applies production rules on purpose (it then needs a strong `JWT_SIGNING_KEY` and turns the docs off), and it always needs `DATABASE_URL`.

Open http://localhost:8000/v1/health and, in development, the interactive docs at http://localhost:8000/v1/docs.

```bash
cd backend/scoring && uv sync && uv run pytest
```

The same checks CI runs: `uv run ruff check .`, `uv run ruff format --check .`, `uv run mypy src`, `uv run pytest`.

## What exists and what comes next

- **Exists:** application factory, `/v1/health`, an API-inventory test (every route must be in `docs/api/openapi.yaml`), settings that fail closed, exact-origin CORS, problem+json errors that never echo input, settings that refuse unsafe production values, the jobs worker shell, migration `0001` (applies `database/schema.sql`), the congruence ranking with tests.
- **Next (FYP-1 demo slice):** join with class code and consent slip, `/events:batch`, results compute; then the interest and ability estimators. The contract is `docs/api/openapi.yaml`; the rules are in `docs/security/SECURITY.md`.

## Docker image

Built from the repository root, because it also needs `database/schema.sql`:

```bash
docker build -f backend/api/Dockerfile -t rahyaab-api .
```

The same image runs the API, the jobs worker (`python -m rahyaab_api.jobs`) and migrations (`alembic upgrade head`).
