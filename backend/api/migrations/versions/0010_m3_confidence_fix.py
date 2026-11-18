"""Register m3-congruence-2026.11.1, the recommender with the corrected evidence and confidence rules.

What changed (persona simulation, 18 Nov 2026; FR-43, FR-51, NFR-60): before ranking, the answers must show a
clear and consistent pattern (differentiation and repeated-pair agreement); "fairly sure" needs both to be
high; a low-confidence result never says "strong"; an extra-week result on thin evidence is only "worth a
look". The interim scorer's SE no longer decides confidence. Results made by 2026.11.0 stay as they were
(results are immutable and pinned by input_hash); new computes use 2026.11.1. Idempotent.

Revision ID: 0010
Revises: 0009
Create Date: 2026-11-18
"""

from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

STATEMENTS = [
    "UPDATE model_version SET active = false WHERE id = 'm3-congruence-2026.11.0'",
    """
    INSERT INTO model_version (id, kind, class_mode, artifact_uri, artifact_sha256, active)
    VALUES ('m3-congruence-2026.11.1', 'congruence', 'matric',
            'code:backend/scoring/src/rahyaab_scoring/recommend.py',
            'code-in-repo (pinned by each result''s input_hash)', true)
    ON CONFLICT (id) DO NOTHING
    """,
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
