-- Rahyaab PostgreSQL 16 schema, version 1.4 (draft; the ERD in docs/architecture/diagrams/erd/ shows the same tables).
-- v1.1 (2026-11-05): student.age_band and student.situation; self-consent; route and help flags (FR-99..104).
-- v1.2 (2026-11-05): research_demographics (opt-in, separate role); staff password reset tokens.
-- v1.3 (2026-11-07, review fixes): consent slips; item keyed by content version; quarantine linked to the
--   student; trait_estimate versioned; content packs per class mode; shared auth state (OTP, MFA, sessions,
--   re-link codes, rate limits); integrity checks; model kinds per mode; FK indexes; explicit roles and grants.
-- v1.4 (2026-11-11, review fixes): age assurance from school records (consent_slip.kind and verified_age_band,
--   student.age_verified, flag 'age_mismatch'); slips exist before they are recorded; licences (pilot,
--   institution, individual) gate class-code joins.
-- The migrations live in backend/api/migrations (Alembic): 0001 applies this file to an empty database and
-- later revisions bring older databases up to date. This file is always the complete current design.
-- Conventions: snake_case; UUID keys (UUIDv7 for events); timestamptz in UTC; no personal data
-- outside guardian_contact, consent_slip (form serial only) and staff_user; every FK has an index.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------ identity and consent
CREATE TABLE school (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (length(name) <= 120),
  district    text NOT NULL,
  type        text NOT NULL CHECK (type IN ('govt', 'private', 'chain')),
  board       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE school_class (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        uuid NOT NULL REFERENCES school (id) ON DELETE CASCADE,
  grade            smallint NOT NULL CHECK (grade BETWEEN 8 AND 12),
  section          text NOT NULL CHECK (length(section) <= 8),
  code_hash        text NOT NULL UNIQUE,              -- sha256 of the class code
  code_expires_at  timestamptz NOT NULL,
  UNIQUE (school_id, grade, section)
);
CREATE INDEX ON school_class (school_id);

CREATE TABLE student (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id        uuid REFERENCES school_class (id) ON DELETE SET NULL,   -- null on the individual path
  nickname        text NOT NULL CHECK (length(nickname) BETWEEN 2 AND 20),
  grade           smallint NOT NULL CHECK (grade BETWEEN 8 AND 12),
  board           text,
  current_group   text,
  district        text,                               -- optional; library 'near you' only, never scored
  age_band        text NOT NULL CHECK (age_band IN ('13-15', '16-17', '18-19', '20-24', '25+')),  -- never the birth year
  age_verified    boolean NOT NULL DEFAULT false,     -- true when the band came from the school's admission register
                                                      -- (via a recorded consent slip), not from the student's own answer
  situation       text CHECK (situation IN ('repeating_class', 'private_candidate', 'returning_learner',
                                            'changed_board', 'o_a_level', 'dae', 'madrassa_or_foreign')),
  marks           jsonb CHECK (marks IS NULL OR (jsonb_typeof(marks) = 'object' AND pg_column_size(marks) <= 512)),
                                                      -- optional, subject -> 0..100 (keys and range checked in the API)
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_active_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON student (class_id);
CREATE INDEX ON student (last_active_at);           -- retention job

-- Licences (ADR-0015). A class code works only while its school holds an active pilot or institution licence;
-- individual subscriptions (post-MVP) attach to one student. No payment or card data is ever stored here:
-- institutions pay by invoice, individuals through the app store's billing.
CREATE TABLE licence (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('pilot', 'institution', 'individual')),
  school_id   uuid REFERENCES school (id) ON DELETE CASCADE,
  student_id  uuid REFERENCES student (id) ON DELETE CASCADE,
  seats       integer CHECK (seats IS NULL OR seats > 0),   -- null = unlimited (pilot)
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT licence_period_check CHECK (ends_at > starts_at),
  CONSTRAINT licence_holder_check CHECK (
    (kind = 'individual' AND student_id IS NOT NULL AND school_id IS NULL)
    OR (kind <> 'individual' AND school_id IS NOT NULL AND student_id IS NULL))
);
CREATE INDEX ON licence (school_id);
CREATE INDEX ON licence (student_id);

-- Restricted: only the guardian_rw role may read or write this table.
CREATE TABLE guardian_contact (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            uuid NOT NULL UNIQUE REFERENCES student (id) ON DELETE CASCADE,
  phone_e164_encrypted  bytea NOT NULL,             -- AES-256-GCM envelope (DATA_GOVERNANCE.md §4)
  relation              text NOT NULL
);

-- School path (FR-05a, FR-100): each paper form carries a one-time claim code on its tear-off slip.
-- A slip row is created when the form is printed (kind: 'parent' = Form A, signed by a parent for a student
-- under 18; 'self' = Form C, signed by a student aged 18+). When the signed form comes back, the teacher
-- records it AND copies the student's age band from the school's admission register (verified_age_band).
-- Only recorded slips can be claimed. The student's own birth-year answer never grants consent by itself.
-- The paper form stays with the school.
CREATE TABLE consent_slip (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id          uuid NOT NULL REFERENCES school_class (id) ON DELETE CASCADE,
  kind              text NOT NULL DEFAULT 'parent' CHECK (kind IN ('parent', 'self')),
  form_serial       text NOT NULL CHECK (length(form_serial) <= 20),   -- printed on the paper form
  claim_code_hash   text NOT NULL UNIQUE,               -- sha256 of the one-time claim code
  research_opt_in   boolean NOT NULL DEFAULT false,
  notice_version    text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),  -- printed
  recorded_by       uuid,                               -- FK added below (staff_user is defined later)
  recorded_at       timestamptz,                        -- null until the signed form is back
  verified_age_band text CHECK (verified_age_band IN ('13-15', '16-17', '18-19', '20-24', '25+')),
  claimed_at        timestamptz,
  expires_at        timestamptz NOT NULL,               -- unclaimed slips expire after 60 days
  UNIQUE (class_id, form_serial),
  CONSTRAINT consent_slip_recorded_check CHECK (
    (recorded_at IS NULL) = (recorded_by IS NULL) AND (recorded_at IS NULL) = (verified_age_band IS NULL)),
  CONSTRAINT consent_slip_kind_band_check CHECK (
    verified_age_band IS NULL OR (kind = 'parent') = (verified_age_band IN ('13-15', '16-17'))),
  CONSTRAINT consent_slip_claim_check CHECK (claimed_at IS NULL OR recorded_at IS NOT NULL)
);
CREATE INDEX ON consent_slip (class_id);

CREATE TABLE consent (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('parent', 'assent', 'research', 'teacher_visibility', 'self')),
  method          text NOT NULL CHECK (method IN ('school_form', 'otp', 'in_app', 'self')),   -- self = adult 18+
  notice_version  text NOT NULL,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  withdrawn_at    timestamptz,
  recorded_by     uuid,                                -- staff who recorded a school form (FK below)
  slip_id         uuid REFERENCES consent_slip (id) ON DELETE SET NULL, -- the paper slip it came from
  CHECK (method <> 'school_form' OR (recorded_by IS NOT NULL AND slip_id IS NOT NULL))
);
CREATE INDEX ON consent (student_id, type);
CREATE INDEX ON consent (recorded_by);
CREATE INDEX ON consent (slip_id);

CREATE TABLE device (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  device_tier  text NOT NULL CHECK (device_tier IN ('low', 'mid', 'high')),   -- coarse; no model name
  os_major     smallint NOT NULL,                     -- Android major version only
  public_key   text NOT NULL,                         -- Keystore key; refresh requests are signed with it
  ram_class    text CHECK (ram_class IN ('<=3GB', '4GB', '6GB', '>=8GB')),
  app_version  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON device (student_id);

CREATE TABLE refresh_token (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id    uuid NOT NULL REFERENCES device (id) ON DELETE CASCADE,
  family_id    uuid NOT NULL,                        -- reuse revokes the whole family
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  used_at      timestamptz,
  revoked_at   timestamptz
);
CREATE INDEX ON refresh_token (family_id);
CREATE INDEX ON refresh_token (device_id);

-- ------------------------------------------------------------------ content and gameplay
CREATE TABLE content_pack (
  id            text PRIMARY KEY,                    -- story-YYYY.MM.N
  class_mode    text NOT NULL CHECK (class_mode IN ('matric', 'inter', 'university', 'alevel')),
  min_app       text NOT NULL,
  sha256        text NOT NULL,
  signature     text NOT NULL,                       -- Ed25519 over the manifest
  manifest      jsonb NOT NULL,
  size_bytes    integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 20000000),
  storage_uri   text NOT NULL,                       -- served with HTTP Range support (resume on 3G)
  active        boolean NOT NULL DEFAULT false,
  activated_at  timestamptz,
  activated_by  uuid                                 -- FK added below
);
CREATE UNIQUE INDEX one_active_pack ON content_pack (class_mode) WHERE active;

CREATE TABLE item (
  id               text NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('planner_option', 'choice', 'reaction', 'task_item', 'value_dilemma')),
  construct        text NOT NULL,
  pair             text,                             -- e.g. R-S for forced-choice items
  content_version  text NOT NULL REFERENCES content_pack (id),
  params           jsonb NOT NULL DEFAULT '{}'::jsonb, -- TIRT loadings/thresholds, GRM a/b_k, Rasch b
  PRIMARY KEY (id, content_version)                   -- recalibrated items coexist with old ones (ADR-0005)
);
CREATE INDEX ON item (content_version);

CREATE TABLE sitting (
  id           uuid PRIMARY KEY,
  student_id   uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  device_id    uuid NOT NULL REFERENCES device (id) ON DELETE CASCADE,
  started_at   timestamptz NOT NULL,                  -- created by the run_start event (RFC-0002)
  ended_at     timestamptz,
  calibration  jsonb
);
CREATE INDEX ON sitting (student_id);
CREATE INDEX ON sitting (device_id);

CREATE TABLE game_run (
  id               uuid PRIMARY KEY,
  sitting_id       uuid NOT NULL REFERENCES sitting (id) ON DELETE CASCADE,
  week             smallint NOT NULL CHECK (week BETWEEN 0 AND 4),
  story_version    text NOT NULL,
  content_version  text NOT NULL REFERENCES content_pack (id),
  practice         boolean NOT NULL DEFAULT false,
  completed        boolean NOT NULL DEFAULT false,
  flags            jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX ON game_run (sitting_id);
CREATE INDEX ON game_run (content_version);

-- Append-only. Partitioned by month on event_id: UUIDv7 keys sort by creation time, so each month
-- is a UUID range, and event_id alone can stay the primary key (needed for ON CONFLICT dedupe, RFC-0002).
-- The API accepts only version-7 UUIDs whose embedded time is within [now - 60 days, now + 1 day]; others
-- (dead or reset phone clocks, tampering) go to quarantine with reason 'clock', so the default partition
-- stays empty in normal operation. A monthly maintenance task (run as rahyaab_owner) creates the next two partitions
-- (bounds = the first and last millisecond of the month as a 48-bit hex prefix, zero-filled) and drops
-- partitions older than 12 months; the retention job also deletes default-partition rows older than 12 months.
-- (run_id, seq) uniqueness and per-run monotonic time are enforced by the API before insert (a unique index
-- on a partitioned table must include the partition key); duplicates are rejected with reason 'sequence'.
CREATE TABLE raw_event (
  event_id      uuid NOT NULL,                       -- UUIDv7 from the device
  run_id        uuid NOT NULL REFERENCES game_run (id) ON DELETE CASCADE,
  seq           integer NOT NULL CHECK (seq >= 0),
  type          text NOT NULL,
  monotonic_ms  double precision NOT NULL CHECK (monotonic_ms >= 0),
  item_id       text,                                -- with content_version, checked against item by the API
  a11y_mode     boolean NOT NULL DEFAULT false,
  data          jsonb NOT NULL CHECK (pg_column_size(data) <= 1024),
  received_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id),
  CHECK (substr(event_id::text, 15, 1) = '7')         -- UUID version 7 (PG 16 has no uuid_extract_version)
) PARTITION BY RANGE (event_id);
CREATE INDEX ON raw_event (run_id, seq);
-- 2026-11-01T00:00Z = 0x01A19467E800 ms; 2026-12-01T00:00Z = 0x01A22EE6B000 ms (UUIDv7 48-bit time prefix)
CREATE TABLE raw_event_2026_11 PARTITION OF raw_event
  FOR VALUES FROM ('01a19467-e800-0000-0000-000000000000') TO ('01a22ee6-b000-0000-0000-000000000000');
CREATE TABLE raw_event_default PARTITION OF raw_event DEFAULT;

-- Rejected events (RFC-0002). Linked to the student so erasure and consent withdrawal remove them too;
-- deleted after 30 days by the retention job. Insert with ON CONFLICT (event_id) DO NOTHING.
CREATE TABLE quarantine (
  event_id     uuid PRIMARY KEY,
  student_id   uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  run_id       uuid,                                 -- may not exist yet (order-dependent rejection)
  reason       text NOT NULL CHECK (reason IN ('schema', 'unknown_run', 'sequence', 'monotonic', 'size',
                                               'unknown_version', 'unknown_item', 'clock', 'consent')),
  payload      jsonb NOT NULL CHECK (pg_column_size(payload) <= 2048),
  received_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON quarantine (student_id);
CREATE INDEX ON quarantine (received_at);

-- ------------------------------------------------------------------ results and library
CREATE TABLE model_version (
  id               text PRIMARY KEY,                 -- e.g. m3-congruence-2026.11.0
  kind             text NOT NULL CHECK (kind IN ('irt', 'ability', 'values', 'congruence', 'ranker', 'rules', 'explainer')),
  class_mode       text NOT NULL CHECK (class_mode IN ('matric', 'inter', 'university', 'alevel')),  -- one row per mode
  artifact_uri     text NOT NULL,
  artifact_sha256  text NOT NULL,
  eval_report_uri  text,                             -- required before activation (checked in the API)
  image_digest     text,                             -- scorer container image used to build it
  lockfile_sha256  text,                             -- dependency lockfile hash (RFC-0003 reproducibility)
  active           boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_model ON model_version (kind, class_mode) WHERE active;

CREATE TABLE trait_estimate (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  construct      text NOT NULL,                      -- R..C, SPA ABS NUM LOG PLN VRB, six work values
  theta          double precision,                   -- null when not measured (FR-98)
  se             double precision,
  band           text,
  model_version  text NOT NULL REFERENCES model_version (id),
  content_version text NOT NULL,
  input_hash     text NOT NULL,                      -- same canonical ScoringInput hash as the recommendation
  computed_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, input_hash, construct)
);
CREATE INDEX ON trait_estimate (student_id, computed_at DESC);
CREATE INDEX ON trait_estimate (model_version);

-- Exactly 3 path cards with distinct stream ids and valid fit bands.
CREATE FUNCTION ranked_ok(r jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT jsonb_typeof(r) = 'array'
     AND jsonb_array_length(r) = 3
     AND (SELECT count(DISTINCT e->>'stream_id') FROM jsonb_array_elements(r) e) = 3
     AND (SELECT bool_and(e->>'fit_band' IN ('strong', 'good', 'worth_a_look')) FROM jsonb_array_elements(r) e)
$$;

CREATE TABLE recommendation (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  mode             text NOT NULL CHECK (mode IN ('matric', 'inter', 'university', 'alevel')),
  ranked           jsonb NOT NULL,                   -- exactly 3 path cards
  features         jsonb NOT NULL,
  contributions    jsonb NOT NULL,
  rules_applied    jsonb NOT NULL,
  confidence       text NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  model_version    text NOT NULL REFERENCES model_version (id),   -- the M3 model
  model_versions   jsonb NOT NULL,                   -- every model used: {irt, ability, values, m3, rules, explainer}
  content_version  text NOT NULL,
  input_hash       text NOT NULL,                    -- sha256 of the canonical ScoringInput (RFC-0003)
  supersedes       uuid REFERENCES recommendation (id),   -- the result this one replaces (newest = latest)
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, input_hash),
  CHECK (ranked_ok(ranked))
);
CREATE INDEX ON recommendation (student_id, created_at DESC);
CREATE INDEX ON recommendation (model_version);

CREATE TABLE share_link (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash         text NOT NULL UNIQUE,           -- sha256 of the 128-bit token
  student_id         uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  recommendation_id  uuid REFERENCES recommendation (id) ON DELETE CASCADE,
  scope              text NOT NULL CHECK (scope IN ('report', 'consent')),
  show_task_strengths boolean NOT NULL DEFAULT true,
  expires_at         timestamptz NOT NULL,
  revoked_at         timestamptz,
  views              integer NOT NULL DEFAULT 0,
  CHECK ((scope = 'report') = (recommendation_id IS NOT NULL))
);
CREATE INDEX ON share_link (student_id);
CREATE INDEX ON share_link (recommendation_id);
CREATE INDEX ON share_link (expires_at);

CREATE TABLE stream (
  id                 text PRIMARY KEY,
  level              text NOT NULL CHECK (level IN ('matric', 'inter', 'university', 'alevel')),
  names              jsonb NOT NULL,                 -- {ur, en}
  riasec_profile     double precision[6] NOT NULL,
  ability_support    jsonb NOT NULL,
  subjects_by_board  jsonb NOT NULL,
  entry_tests        jsonb NOT NULL DEFAULT '[]'::jsonb,
  doors              jsonb NOT NULL DEFAULT '[]'::jsonb,
  plan_b             jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources            jsonb NOT NULL DEFAULT '[]'::jsonb,
  last_verified      date NOT NULL
);

CREATE TABLE eligibility_rule (
  id              text PRIMARY KEY,
  stream_id       text NOT NULL REFERENCES stream (id) ON DELETE CASCADE,
  board           text NOT NULL,
  condition       jsonb NOT NULL,                    -- JSON Logic, evaluated without eval()
  effect          text NOT NULL CHECK (effect IN ('closed', 'extra_step')),
  source_url      text NOT NULL,
  effective_from  date NOT NULL,
  effective_to    date,
  last_verified   date NOT NULL
);
CREATE INDEX ON eligibility_rule (stream_id);

CREATE TABLE career (
  onet_code    text PRIMARY KEY,
  title_en     text NOT NULL,
  title_ur     text,
  summary_ur   text,
  pk_route     text,
  attribution  text NOT NULL,
  fetched_at   timestamptz NOT NULL
);

CREATE TABLE stream_career (
  stream_id  text NOT NULL REFERENCES stream (id) ON DELETE CASCADE,
  onet_code  text NOT NULL REFERENCES career (onet_code) ON DELETE CASCADE,
  PRIMARY KEY (stream_id, onet_code)
);
CREATE INDEX ON stream_career (onet_code);

CREATE TABLE saved_item (
  student_id  uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('stream', 'career')),
  ref_id      text NOT NULL,
  saved_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, kind, ref_id)              -- ref_id is a stream id or an O*NET code, checked by the API
);

-- ------------------------------------------------------------------ staff and operations
CREATE TABLE staff_user (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             uuid REFERENCES school (id),
  email                 text NOT NULL UNIQUE,
  password_hash         text NOT NULL,               -- argon2id
  mfa_secret_encrypted  bytea,                       -- null until TOTP enrolment is finished (first login)
  role                  text NOT NULL CHECK (role IN ('teacher', 'counsellor', 'school_admin', 'admin', 'researcher')),
  disabled_at           timestamptz,
  failed_logins         smallint NOT NULL DEFAULT 0,
  locked_until          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (role IN ('admin', 'researcher') OR school_id IS NOT NULL)
);
CREATE INDEX ON staff_user (school_id);

ALTER TABLE consent_slip ADD FOREIGN KEY (recorded_by) REFERENCES staff_user (id);
ALTER TABLE consent ADD FOREIGN KEY (recorded_by) REFERENCES staff_user (id) ON DELETE SET NULL;
CREATE INDEX ON consent_slip (recorded_by);
ALTER TABLE content_pack ADD FOREIGN KEY (activated_by) REFERENCES staff_user (id);

CREATE TABLE staff_class (
  staff_id  uuid NOT NULL REFERENCES staff_user (id) ON DELETE CASCADE,
  class_id  uuid NOT NULL REFERENCES school_class (id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, class_id)
);
CREATE INDEX ON staff_class (class_id);

CREATE TABLE note (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  staff_id    uuid NOT NULL REFERENCES staff_user (id) ON DELETE CASCADE,
  text        text NOT NULL CHECK (length(text) <= 500),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON note (student_id);
CREATE INDEX ON note (staff_id);
-- Notes and resolved flags are deleted at the end of the academic year, or when the student leaves the class (max 12 months).

CREATE TABLE flag (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('not_started', 'stalled', 'mixed_signals', 'low_confidence', 'quality',
                                         'route_question', 'help_requested', 'age_mismatch')),
  details      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolved_by  uuid REFERENCES staff_user (id) ON DELETE SET NULL
);
CREATE INDEX ON flag (student_id) WHERE resolved_at IS NULL;

CREATE TABLE audit_log (
  id       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor    text NOT NULL,                            -- staff id or 'system:<job>'
  action   text NOT NULL,
  object   text NOT NULL,
  at       timestamptz NOT NULL DEFAULT now(),
  ip_hash  text
);
CREATE INDEX ON audit_log (at);

-- Research-only demographics for the fairness audit (FR-48, T-FAIR). Opt-in with research consent only.
-- Never read by the recommender, the app or the dashboard; only the research_ro role can read it.
CREATE TABLE research_demographics (
  student_id   uuid PRIMARY KEY REFERENCES student (id) ON DELETE CASCADE,
  gender       text CHECK (gender IN ('girl', 'boy', 'another', 'prefer_not_to_say')),
  medium       text CHECK (medium IN ('urdu', 'english', 'both', 'other')),
  collected_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE password_reset (
  token_hash   text PRIMARY KEY,                     -- sha256 of a 128-bit single-use token
  staff_id     uuid NOT NULL REFERENCES staff_user (id) ON DELETE CASCADE,
  expires_at   timestamptz NOT NULL,                 -- 30 minutes
  used_at      timestamptz
);
CREATE INDEX ON password_reset (staff_id);

-- ------------------------------------------------------------------ shared auth state (all API workers)
-- Kept in PostgreSQL so both Uvicorn workers see the same counters and challenges; no Redis needed at pilot scale.
CREATE TABLE otp_challenge (                          -- parent consent OTP (individual path)
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id uuid NOT NULL REFERENCES share_link (id) ON DELETE CASCADE,
  code_hash     text NOT NULL,                        -- sha256 of the 6-digit code
  attempts      smallint NOT NULL DEFAULT 0 CHECK (attempts <= 5),
  expires_at    timestamptz NOT NULL,                 -- 10 minutes
  used_at       timestamptz
);
CREATE INDEX ON otp_challenge (share_link_id);

CREATE TABLE relink_code (                            -- FR-12: teacher-issued code to move a profile to a new phone
  code_hash   text PRIMARY KEY,
  student_id  uuid NOT NULL REFERENCES student (id) ON DELETE CASCADE,
  issued_by   uuid NOT NULL REFERENCES staff_user (id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,                   -- 24 hours, single use
  used_at     timestamptz
);
CREATE INDEX ON relink_code (student_id);
CREATE INDEX ON relink_code (issued_by);

CREATE TABLE staff_session (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      uuid NOT NULL REFERENCES staff_user (id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,
  mfa_passed_at timestamptz,                          -- null while the TOTP step is pending
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),   -- idle timeout 30 min
  expires_at    timestamptz NOT NULL,                 -- absolute 8 h
  revoked_at    timestamptz
);
CREATE INDEX ON staff_session (staff_id);

CREATE TABLE rate_limit (                             -- fixed-window counters, keyed e.g. 'join:code:<hash>'
  key           text NOT NULL,
  window_start  timestamptz NOT NULL,
  hits          integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX ON rate_limit (window_start);            -- old windows purged hourly

CREATE TABLE panel_label (                          -- research schema in production
  vignette_id     text NOT NULL,
  rater_id        uuid NOT NULL REFERENCES staff_user (id),
  ranked_streams  jsonb NOT NULL CHECK (jsonb_array_length(ranked_streams) = 3),
  at              timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vignette_id, rater_id)
);
CREATE INDEX ON panel_label (rater_id);

-- ------------------------------------------------------------------ roles (least privilege)
-- rahyaab_owner owns every object and runs migrations only. No role is a superuser at run time.
-- Passwords are set at deploy time from secrets, never here.
CREATE ROLE rahyaab_owner NOLOGIN;
CREATE ROLE api_rw      LOGIN;   -- the FastAPI service
CREATE ROLE guardian_rw LOGIN;   -- the small guardian-contact module (parent OTP path)
CREATE ROLE jobs        LOGIN;   -- retention, partitions, rescoring, O*NET refresh, backups
CREATE ROLE research_ro LOGIN;   -- de-identified research views only

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO api_rw, guardian_rw, jobs, research_ro;

-- api_rw: reads and writes application tables; append-only tables get INSERT/SELECT only.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  school, school_class, student, consent_slip, device, refresh_token, sitting, game_run, saved_item,
  share_link, staff_user, staff_class, note, flag, password_reset, otp_challenge, relink_code,
  staff_session, rate_limit
  TO api_rw;
GRANT SELECT, INSERT, UPDATE ON licence TO api_rw;      -- licences are never deleted by the API
GRANT SELECT ON content_pack, item, model_version, stream, eligibility_rule, career, stream_career TO api_rw;
GRANT SELECT, INSERT ON consent, raw_event, quarantine, trait_estimate, recommendation, audit_log TO api_rw;
GRANT UPDATE (withdrawn_at) ON consent TO api_rw;     -- withdrawal is the only change to a consent row
GRANT INSERT ON research_demographics TO api_rw;       -- write-only for the API
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO api_rw, jobs;

-- guardian_rw: the guardian table only.
GRANT SELECT, INSERT, UPDATE, DELETE ON guardian_contact TO guardian_rw;

-- jobs: retention deletes, rescoring and library refresh (partition DDL runs as the owner).
GRANT SELECT, DELETE ON student, raw_event, quarantine, trait_estimate, recommendation, share_link,
  note, flag, consent, consent_slip, otp_challenge, relink_code, staff_session, rate_limit, password_reset TO jobs;
GRANT INSERT ON trait_estimate, recommendation, audit_log TO jobs;
GRANT SELECT, INSERT, UPDATE ON career, stream_career, model_version TO jobs;
GRANT SELECT ON licence TO jobs;

-- research_ro: never reads base tables directly; it gets de-identified views in a separate schema
-- (created with the research export job) plus the opt-in demographics and panel labels.
GRANT SELECT ON research_demographics, panel_label TO research_ro;

-- Immutable rows: no role may UPDATE or DELETE these outside retention.
CREATE FUNCTION forbid_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME;
END $$;
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER recommendation_immutable BEFORE UPDATE ON recommendation
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER trait_estimate_immutable BEFORE UPDATE ON trait_estimate
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER raw_event_immutable BEFORE UPDATE ON raw_event
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
-- audit_log is kept 2 years; older rows are removed only by the owner role during a reviewed purge.
