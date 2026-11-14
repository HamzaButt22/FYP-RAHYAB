-- Synthetic development data only. Never load into staging or production. Safe to run more than once.
-- Load it with `python tools/dev.py seed`: the codes are stored as keyed hashes (HMAC with the local CODE_PEPPER
-- from infra/docker/.env), which dev.py computes and passes in as psql variables (:'h_...').
-- Class codes (development only): RYB-4K2 (class 9-A), RYB-7Q9 (class 10-B).
-- Consent-slip claim codes (development only):
--   DEVA-2222  class 9-A, Form A (parent), recorded, school register says 13-15
--   DEVA-3333  class 9-A, Form A (parent), printed but NOT recorded yet (cannot be claimed)
--   DEVS-4444  class 10-B, Form C (adult self-consent), recorded, school register says 18-19
-- Real codes are made only by the admin command (python -m rahyaab_api.admin; random, no look-alike letters).
-- These are fixed and easy to type on purpose, so everyone tests with the same ones.
INSERT INTO school (id, name, district, type, board)
VALUES ('00000000-0000-4000-8000-000000000001', 'Demo Model School', 'Rawalpindi', 'govt', 'FBISE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_class (id, school_id, grade, section, code_hash, code_expires_at) VALUES
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 9, 'A',
   :'h_class_9a', now() + interval '90 days'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 10, 'B',
   :'h_class_10b', now() + interval '90 days')
ON CONFLICT (id) DO UPDATE SET code_hash = EXCLUDED.code_hash, code_expires_at = EXCLUDED.code_expires_at;

-- A free pilot licence, so the class codes work (ADR-0015).
INSERT INTO licence (id, kind, school_id, ends_at)
VALUES ('00000000-0000-4000-8000-000000000201', 'pilot', '00000000-0000-4000-8000-000000000001', now() + interval '1 year')
ON CONFLICT (id) DO UPDATE SET ends_at = EXCLUDED.ends_at;

-- A teacher who records consent slips (no password: staff login is not built yet).
INSERT INTO staff_user (id, school_id, email, password_hash, role)
VALUES ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000001',
        'teacher@demo.invalid', '!', 'teacher')
ON CONFLICT (id) DO NOTHING;

INSERT INTO consent_slip (id, class_id, kind, form_serial, claim_code_hash, research_opt_in, notice_version,
                          recorded_by, recorded_at, verified_age_band, expires_at) VALUES
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000101', 'parent', 'DEV-0001',
   :'h_slip_2222', true, '2026-11', '00000000-0000-4000-8000-000000000301', now(), '13-15',
   now() + interval '60 days'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000101', 'parent', 'DEV-0002',
   :'h_slip_3333', false, '2026-11', NULL, NULL, NULL, now() + interval '60 days'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000102', 'self', 'DEV-0003',
   :'h_slip_4444', false, '2026-11', '00000000-0000-4000-8000-000000000301', now(), '18-19',
   now() + interval '60 days')
ON CONFLICT (id) DO UPDATE SET claim_code_hash = EXCLUDED.claim_code_hash;
