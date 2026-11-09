"""Initial schema: applies database/schema.sql (the reviewed design, v1.3).

Revision ID: 0001
Revises:
Create Date: 2026-11-09
"""

from pathlib import Path

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

# backend/api/migrations/versions/ -> repository root -> database/schema.sql (same layout inside the image)
SCHEMA = Path(__file__).resolve().parents[4] / "database" / "schema.sql"


def upgrade() -> None:
    # Sent through the raw psycopg connection with no parameters at all, so '::jsonb' casts and the '%'
    # placeholders inside PL/pgSQL RAISE messages reach PostgreSQL unchanged (same transaction as Alembic).
    raw = op.get_bind().connection.driver_connection
    raw.execute(SCHEMA.read_text(encoding="utf-8"))


def downgrade() -> None:
    raise RuntimeError("The initial schema is not reversible; restore from a backup instead.")
