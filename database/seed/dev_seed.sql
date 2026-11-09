-- Synthetic development data only. Never load into staging or production.
-- Class codes (development only): RYB-4K2 (class 9-A), RYB-7Q9 (class 10-B). Only their SHA-256 hashes are stored.
INSERT INTO school (id, name, district, type, board)
VALUES ('00000000-0000-4000-8000-000000000001', 'Demo Model School', 'Rawalpindi', 'govt', 'FBISE');

INSERT INTO school_class (id, school_id, grade, section, code_hash, code_expires_at) VALUES
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 9, 'A',
   '768a808b75c48e3b1ca14b0bcecdd3486e96e33704f07de56789e0c18224d9a5', now() + interval '90 days'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 10, 'B',
   'f05ee62d9b1b5f379ad8db8c7eb2500a99719f2b256991e53a767205cce0469a', now() + interval '90 days');
