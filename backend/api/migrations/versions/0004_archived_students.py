"""Schema v1.6: removing a student archives them, so a mistake can be undone.

Idempotent, like 0002 and 0003. The nickname index is rebuilt so archived students free their nickname.

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-14
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

STATEMENTS = [
    "ALTER TABLE student ADD COLUMN IF NOT EXISTS archived_at timestamptz",
    "ALTER TABLE student ADD COLUMN IF NOT EXISTS archived_reason text "
    "CHECK (archived_reason IN ('left', 'stranger', 'misuse', 'other'))",
    "ALTER TABLE student DROP CONSTRAINT IF EXISTS student_archived_check",
    "ALTER TABLE student ADD CONSTRAINT student_archived_check "
    "CHECK ((archived_at IS NULL) = (archived_reason IS NULL))",
    "DROP INDEX IF EXISTS student_class_nickname_key",
    "CREATE UNIQUE INDEX student_class_nickname_key ON student (class_id, lower(nickname)) "
    "WHERE class_id IS NOT NULL AND archived_at IS NULL",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
