"""Register the models the first results use (model registry rows; FR-82, RFC-0003).

Results (recommendation, trait_estimate) reference a model_version row. These two are the F1 models:
- m1-counts-2026.11.0: the interim interest scorer (win counts; provisional until the Thurstonian IRT scorer);
- m3-congruence-2026.11.0: the congruence recommender with the streams.json rules engine.
Both are code in backend/scoring (no separate artifact file yet), so artifact_uri names the module and
artifact_sha256 says the results pin the version through input_hash instead. Idempotent.

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-15
"""

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

STATEMENTS = [
    """
    INSERT INTO model_version (id, kind, class_mode, artifact_uri, artifact_sha256, active)
    VALUES
      ('m1-counts-2026.11.0', 'irt', 'matric', 'code:backend/scoring/src/rahyaab_scoring/interests.py',
       'code-in-repo (pinned by each result''s input_hash)', true),
      ('m3-congruence-2026.11.0', 'congruence', 'matric',
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
