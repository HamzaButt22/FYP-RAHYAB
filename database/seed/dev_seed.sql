-- Synthetic development data only. Never load into staging or production. Safe to run more than once.
-- Class codes (development only): RYB-4K2 (class 9-A), RYB-7Q9 (class 10-B). Only their SHA-256 hashes are stored.
-- Consent-slip claim codes (development only):
--   DEVA-2222  class 9-A, Form A (parent), recorded, school register says 13-15
--   DEVA-3333  class 9-A, Form A (parent), printed but NOT recorded yet (cannot be claimed)
--   DEVS-4444  class 10-B, Form C (adult self-consent), recorded, school register says 18-19
-- Real codes are made with rahyaab_api.codes (random, no look-alike letters); these are easy to type on purpose.
INSERT INTO school (id, name, district, type, board)
VALUES ('00000000-0000-4000-8000-000000000001', 'Demo Model School', 'Rawalpindi', 'govt', 'FBISE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO school_class (id, school_id, grade, section, code_hash, code_expires_at) VALUES
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 9, 'A',
   '768a808b75c48e3b1ca14b0bcecdd3486e96e33704f07de56789e0c18224d9a5', now() + interval '90 days'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 10, 'B',
   'f05ee62d9b1b5f379ad8db8c7eb2500a99719f2b256991e53a767205cce0469a', now() + interval '90 days')
ON CONFLICT (id) DO UPDATE SET code_expires_at = EXCLUDED.code_expires_at;

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
   '8f6e95fe89d3e78e2cb52741412a053f802724ece1414e977eea43f475343db1', true, '2026-11', '00000000-0000-4000-8000-000000000301', now(), '13-15',
   now() + interval '60 days'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000101', 'parent', 'DEV-0002',
   '0ca912055b972c076acf79781531279e915aa040e3d3fffb0d60817d167493fa', false, '2026-11', NULL, NULL, NULL, now() + interval '60 days'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000102', 'self', 'DEV-0003',
   '5149b685c8782b9b7170cd57bbe8532a9190375863b1a13536bdbc0409def9da', false, '2026-11', '00000000-0000-4000-8000-000000000301', now(), '18-19',
   now() + interval '60 days')
ON CONFLICT (id) DO NOTHING;
