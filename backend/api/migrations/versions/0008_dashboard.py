"""Schema v1.9: the teacher dashboard (FR-72, FR-73, FR-78).

consent_slip.teacher_visibility is set when the teacher records a signed form with the box ticked; a claim of
that slip then gives the student a 'teacher_visibility' consent, and only those students appear on the
staff dashboard. The jobs worker raises and closes flags (not started, stalled, low confidence), so it may
read runs and write flags. Idempotent, like 0002 to 0007.

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-18
"""

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

STATEMENTS = [
    "ALTER TABLE consent_slip ADD COLUMN IF NOT EXISTS teacher_visibility boolean NOT NULL DEFAULT false",
    "GRANT SELECT ON sitting, game_run TO jobs",
    "GRANT INSERT, UPDATE ON flag TO jobs",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
