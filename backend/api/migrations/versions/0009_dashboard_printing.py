"""Schema v1.10: teachers print consent forms from the dashboard (D-11, FR-05a).

The API writes the sealed copy of each school-file password (as the admin command does), so it gets INSERT on
school_file. It still cannot read, change or delete it: only the admin command shows a lost password again.

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-18
"""

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None

STATEMENTS = [
    "GRANT INSERT ON school_file TO api_rw",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
