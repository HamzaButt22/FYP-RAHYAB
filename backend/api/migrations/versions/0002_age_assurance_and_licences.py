"""Schema v1.4: age assurance from school records, slips that exist before they are recorded, licences.

Brings a v1.3 database (created by 0001 before 11 Nov 2026) to the design in database/schema.sql v1.4.
Every statement is idempotent, because 0001 applies the current schema.sql: on a new database these are
no-ops, and on an older one they add what is missing.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-11
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

BANDS = "('13-15', '16-17', '18-19', '20-24', '25+')"

STATEMENTS = [
    # Age assurance: the band is verified when it comes from the school's admission register.
    "ALTER TABLE student ADD COLUMN IF NOT EXISTS age_verified boolean NOT NULL DEFAULT false",
    # Consent slips: printed first, recorded later with the verified age band; Form A (parent) or A2 (self).
    "ALTER TABLE consent_slip ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'parent' "
    "CHECK (kind IN ('parent', 'self'))",
    "ALTER TABLE consent_slip ADD COLUMN IF NOT EXISTS verified_age_band text "
    f"CHECK (verified_age_band IN {BANDS})",
    "ALTER TABLE consent_slip ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now()",
    "ALTER TABLE consent_slip ALTER COLUMN recorded_by DROP NOT NULL",
    "ALTER TABLE consent_slip ALTER COLUMN recorded_at DROP NOT NULL",
    "ALTER TABLE consent_slip ALTER COLUMN recorded_at DROP DEFAULT",
    # v1.3 slips were all recorded but had no verified band; they predate the pilot, so none exist in use.
    "DELETE FROM consent_slip "
    "WHERE recorded_at IS NOT NULL AND verified_age_band IS NULL AND claimed_at IS NULL",
    "ALTER TABLE consent_slip DROP CONSTRAINT IF EXISTS consent_slip_recorded_check",
    "ALTER TABLE consent_slip ADD CONSTRAINT consent_slip_recorded_check CHECK ("
    "(recorded_at IS NULL) = (recorded_by IS NULL) AND (recorded_at IS NULL) = (verified_age_band IS NULL)) "
    "NOT VALID",
    "ALTER TABLE consent_slip DROP CONSTRAINT IF EXISTS consent_slip_kind_band_check",
    "ALTER TABLE consent_slip ADD CONSTRAINT consent_slip_kind_band_check CHECK ("
    "verified_age_band IS NULL OR (kind = 'parent') = (verified_age_band IN ('13-15', '16-17')))",
    "ALTER TABLE consent_slip DROP CONSTRAINT IF EXISTS consent_slip_claim_check",
    "ALTER TABLE consent_slip ADD CONSTRAINT consent_slip_claim_check CHECK "
    "(claimed_at IS NULL OR recorded_at IS NOT NULL)",
    # A student whose own answer disagrees with the school record gets a flag for the teacher.
    "ALTER TABLE flag DROP CONSTRAINT IF EXISTS flag_type_check",
    "ALTER TABLE flag ADD CONSTRAINT flag_type_check CHECK (type IN ('not_started', 'stalled', "
    "'mixed_signals', 'low_confidence', 'quality', 'route_question', 'help_requested', 'age_mismatch'))",
    # Licences (ADR-0015).
    """
    CREATE TABLE IF NOT EXISTS licence (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      kind        text NOT NULL CHECK (kind IN ('pilot', 'institution', 'individual')),
      school_id   uuid REFERENCES school (id) ON DELETE CASCADE,
      student_id  uuid REFERENCES student (id) ON DELETE CASCADE,
      seats       integer CHECK (seats IS NULL OR seats > 0),
      starts_at   timestamptz NOT NULL DEFAULT now(),
      ends_at     timestamptz NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT licence_period_check CHECK (ends_at > starts_at),
      CONSTRAINT licence_holder_check CHECK (
        (kind = 'individual' AND student_id IS NOT NULL AND school_id IS NULL)
        OR (kind <> 'individual' AND school_id IS NOT NULL AND student_id IS NULL))
    )
    """,
    "CREATE INDEX IF NOT EXISTS licence_school_id_idx ON licence (school_id)",
    "CREATE INDEX IF NOT EXISTS licence_student_id_idx ON licence (student_id)",
    "REVOKE ALL ON licence FROM PUBLIC",
    "GRANT SELECT, INSERT, UPDATE ON licence TO api_rw",
    "GRANT SELECT ON licence TO jobs",
]


def upgrade() -> None:
    for statement in STATEMENTS:
        op.execute(statement)


def downgrade() -> None:
    raise RuntimeError("Not reversible; restore from a backup instead.")
