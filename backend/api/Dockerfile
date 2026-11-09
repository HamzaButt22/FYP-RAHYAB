# Rahyaab API image. Build from the repository root:
#   docker build -f backend/api/Dockerfile -t rahyaab-api .
# Multi-stage, non-root, no build tools in the final image. The same image runs the API, the jobs
# worker (python -m rahyaab_api.jobs) and migrations (alembic upgrade head).
FROM python:3.13-slim AS build
ENV PIP_NO_CACHE_DIR=1 PYTHONDONTWRITEBYTECODE=1 UV_COMPILE_BYTECODE=0 UV_LINK_MODE=copy
RUN pip install uv==0.9.*
WORKDIR /app
COPY backend/scoring/ backend/scoring/
COPY backend/api/pyproject.toml backend/api/uv.lock backend/api/
WORKDIR /app/backend/api
# Dependencies first (cached layer); uv.lock is required: --frozen fails if it is missing or stale.
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/api/ ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PATH="/app/backend/api/.venv/bin:$PATH"
RUN useradd --uid 10001 --create-home app \
 && mkdir -p /backups && chown 10001:10001 /backups   # a new named volume copies this owner
WORKDIR /app/backend/api
COPY --from=build /app/backend /app/backend
COPY database/schema.sql /app/database/schema.sql
USER 10001
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/v1/health')"
CMD ["uvicorn", "rahyaab_api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers"]
