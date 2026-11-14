"""Schema v1.5: nicknames unique within a class, and blocked devices.

Idempotent, like 0002: on a new database (0001 applies the current schema.sql) every statement is a no-op.
Existing duplicate nicknames in a class get a number added (Ali_10, Ali_10_2, ...) before the unique index
is built; that can only happen on development data, since the pilot has not started.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-14
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

STATEMENTS = [
    """
    WITH d AS (
      SELECT id, row_number() OVER (PARTITION BY class_id, lower(nickname) ORDER BY created_at, id) AS n
      FROM student WHERE class_id IS NOT NULL
    )
    UPDATE student s SET nickname = left(s.nickname, 17) || '_' || d.n
    FROM d WHERE s.id = d.id AND d.n > 1
    """,
    "CREATE UNIQUE INDEX IF NOT EXISTS student_class_nickname_key "
    "ON student (class_id, lower(nickname)) WHERE class_id IS NOT NULL",
    """
    CREATE TABLE IF NOT EXISTS blocked_device (
      key_hash    text PRIMARY KEY,
      reason      text NOT NULL CHECK (length(reason) BETWEEN 1 AND 200),
      blocked_by  text NOT NULL,
      blocked_at  timestamptz NOT NULL DEFAULT now()
    )
    """,
    "REVOKE ALL ON blocked_device FROM PUBLIC",
    "GRANT SELECT ON blocked_device TO api_rw",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
