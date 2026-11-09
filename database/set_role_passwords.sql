-- Run once per environment, as the admin, after the first migration:
--   psql -v api_pw='...' -v jobs_pw='...' -v research_pw='...' -v guardian_pw='...' -f database/set_role_passwords.sql
-- Passwords come from the secret store; they are never written into a file in the repository.
ALTER ROLE api_rw      PASSWORD :'api_pw';
ALTER ROLE jobs        PASSWORD :'jobs_pw';
ALTER ROLE research_ro PASSWORD :'research_pw';
ALTER ROLE guardian_rw PASSWORD :'guardian_pw';
