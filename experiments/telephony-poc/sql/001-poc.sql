-- Bootstrap only, isolated cluster. Synthetic local passwords, never provider secrets.
CREATE ROLE tony_poc_migrator LOGIN PASSWORD 'synthetic_poc_migrator_only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE tony_poc_runtime LOGIN PASSWORD 'synthetic_poc_runtime_only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
REVOKE ALL ON DATABASE tony_poc FROM PUBLIC;
GRANT CONNECT ON DATABASE tony_poc TO tony_poc_migrator, tony_poc_runtime;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO tony_poc_migrator;
GRANT USAGE ON SCHEMA public TO tony_poc_runtime;
SET ROLE tony_poc_migrator;
BEGIN;
CREATE TABLE "PocOperation" (
 id uuid NOT NULL, campaign text NOT NULL CHECK(campaign = 'synthetic-local-v1'),
 account text NOT NULL CHECK(account = 'AC00000000000000000000000000000000'),
 kind text NOT NULL CHECK(kind IN ('CALL','SMS','RECORD','DELETE','NUMBER')),
 state text NOT NULL CHECK(state IN ('RESERVED','UNKNOWN','ACCEPTED','COMPLETE','FAILED')),
 version integer NOT NULL DEFAULT 1 CHECK(version > 0), resource text CHECK(resource ~ '^(CA|SM|RE|PN)[0-9a-f]{32}$'),
 status text, sequence integer CHECK(sequence >= 0),
 audio_status text CHECK(audio_status IN ('PENDING','DELETED','DELETE_FAILED')),
 deadline timestamptz, attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
 delete_confirmed boolean NOT NULL DEFAULT false, provider_deleted boolean, media_unavailable boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account,campaign,id), UNIQUE(account,campaign,resource),
 CHECK(audio_status IS DISTINCT FROM 'DELETED' OR (delete_confirmed AND provider_deleted IS DISTINCT FROM false AND media_unavailable))
);
CREATE TABLE "PocWebhookReceipt" (
 account text NOT NULL CHECK(account = 'AC00000000000000000000000000000000'),
 campaign text NOT NULL CHECK(campaign = 'synthetic-local-v1'),
 operation_id uuid NOT NULL,
 event_key text NOT NULL CHECK(length(event_key) BETWEEN 1 AND 150),
 route text NOT NULL CHECK(route IN ('voice','dial-result','call-status','message-status','recording-status')),
 resource text NOT NULL CHECK(resource ~ '^(CA|SM|RE)[0-9a-f]{32}$'),
 status text NOT NULL CHECK(status IN ('queued','ringing','in-progress','completed','busy','no-answer','failed','canceled','sent','delivered','undelivered','deleted')),
 sequence integer CHECK(sequence >= 0), received_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(account,campaign,event_key),
 FOREIGN KEY(account,campaign,operation_id) REFERENCES "PocOperation"(account,campaign,id) ON DELETE RESTRICT
);
CREATE INDEX poc_cleanup ON "PocOperation"(deadline) WHERE audio_status IN ('PENDING','DELETE_FAILED');
GRANT SELECT, INSERT, UPDATE ON "PocOperation" TO tony_poc_runtime;
GRANT SELECT, INSERT ON "PocWebhookReceipt" TO tony_poc_runtime;
COMMIT;
RESET ROLE;
