-- Disposable local credentials. Application role must never own business tables.
CREATE ROLE tony_migrator LOGIN PASSWORD 'local_migrator_only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
CREATE ROLE tony_app LOGIN PASSWORD 'local_app_only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
ALTER SCHEMA public OWNER TO tony_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE tony TO tony_migrator, tony_app;
GRANT USAGE ON SCHEMA public TO tony_app;
ALTER DEFAULT PRIVILEGES FOR ROLE tony_migrator IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tony_app;
ALTER DEFAULT PRIVILEGES FOR ROLE tony_migrator IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tony_app;
CREATE ROLE tony_auth LOGIN PASSWORD 'local_auth_only' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE tony TO tony_auth;
GRANT USAGE ON SCHEMA public TO tony_auth;
-- Schema creation belongs only to the offline migration principal.
GRANT CREATE ON DATABASE tony TO tony_migrator;
