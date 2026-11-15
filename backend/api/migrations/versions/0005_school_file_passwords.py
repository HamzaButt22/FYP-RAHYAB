"""Schema v1.7: a sealed backup of each school-file password, so a lost password can be given again.

Idempotent, like 0002 to 0004. Only the admin command (owner role) reads it; the jobs role deletes old rows.

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-15
"""

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS school_file (
      id               uuid PRIMARY KEY,
      class_id         uuid NOT NULL REFERENCES school_class (id) ON DELETE CASCADE,
      kind             text NOT NULL CHECK (kind IN ('slips_and_register', 'class_list')),
      file_names       text NOT NULL CHECK (length(file_names) BETWEEN 1 AND 600),
      sealed_password  bytea NOT NULL,
      created_at       timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS school_file_class_id_idx ON school_file (class_id)",
    "REVOKE ALL ON school_file FROM PUBLIC",
    "GRANT SELECT, DELETE ON school_file TO jobs",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
