-- Run with the local bootstrap principal. Required on existing Lot 0 volumes.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tony_auth') THEN
  CREATE ROLE tony_auth LOGIN PASSWORD 'local_auth_only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
 END IF;
END $$;
GRANT CONNECT ON DATABASE tony TO tony_auth;
GRANT USAGE ON SCHEMA public TO tony_auth;
GRANT CREATE ON DATABASE tony TO tony_migrator;
