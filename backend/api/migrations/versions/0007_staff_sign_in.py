"""Schema v1.8: staff sign-in with a two-step code and password reset (FR-71, FR-106).

- staff_user.mfa_last_step: the last 30-second step a code was accepted for, so a code works only once;
- staff_session.mfa_pending_secret: a new authenticator key (sealed) until its first code is entered;
- password_reset.purpose: 'invite' (made by the admin command, 72 hours) or 'reset' (30 minutes);
- email_outbox: staff emails queued by the API and sent by the jobs worker.

Idempotent, like 0002 to 0005.

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-17
"""

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None

STATEMENTS = [
    "ALTER TABLE staff_user ADD COLUMN IF NOT EXISTS mfa_last_step bigint",
    "ALTER TABLE staff_session ADD COLUMN IF NOT EXISTS mfa_pending_secret bytea",
    """
    ALTER TABLE password_reset ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'reset'
      CHECK (purpose IN ('reset', 'invite'))
    """,
    """
    CREATE TABLE IF NOT EXISTS email_outbox (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      to_address  text NOT NULL CHECK (length(to_address) <= 254),
      template    text NOT NULL CHECK (template IN ('staff_invite', 'staff_reset', 'staff_password_changed')),
      link        text CHECK (length(link) <= 500),
      attempts    smallint NOT NULL DEFAULT 0,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
    """,
    "CREATE INDEX IF NOT EXISTS email_outbox_created_at_idx ON email_outbox (created_at)",
    "REVOKE ALL ON email_outbox FROM PUBLIC",
    "GRANT INSERT ON email_outbox TO api_rw",
    "GRANT SELECT, UPDATE, DELETE ON email_outbox TO jobs",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
