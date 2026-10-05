-- Offline migrator only, fresh experimental registry. Never apply to Tony or a populated fake volume.
-- __BOUND_ACCOUNT__ must be replaced only by a validated AC + 32 lowercase hexadecimal SID.
BEGIN;
ALTER TABLE "PocOperation" DROP CONSTRAINT "PocOperation_account_check", DROP CONSTRAINT "PocOperation_campaign_check";
ALTER TABLE "PocWebhookReceipt" DROP CONSTRAINT "PocWebhookReceipt_account_check", DROP CONSTRAINT "PocWebhookReceipt_campaign_check";
ALTER TABLE "PocOperation" ADD CHECK (account = '__BOUND_ACCOUNT__'), ADD CHECK (campaign = 'live-poc-v1');
ALTER TABLE "PocWebhookReceipt" ADD CHECK (account = '__BOUND_ACCOUNT__'), ADD CHECK (campaign = 'live-poc-v1');
ALTER TABLE "PocOperation" ADD COLUMN origin text NOT NULL DEFAULT 'OPERATOR' CHECK(origin IN ('OPERATOR','INBOUND','DIAL'));
ALTER TABLE "PocOperation" ADD COLUMN parent_resource text CHECK(parent_resource ~ '^CA[0-9a-f]{32}$');
ALTER TABLE "PocOperation" ADD COLUMN action_slot text CHECK(action_slot IN ('T1','T2'));
ALTER TABLE "PocOperation" ADD COLUMN reserved_cents integer NOT NULL DEFAULT 0 CHECK(reserved_cents BETWEEN 0 AND 5000);
ALTER TABLE "PocOperation" ADD COLUMN stop_deadline timestamptz;
ALTER TABLE "PocOperation" ADD CHECK ((parent_resource IS NOT NULL) = (origin = 'DIAL' OR kind = 'RECORD'));
ALTER TABLE "PocOperation" ADD CHECK(origin <> 'DIAL' OR kind = 'CALL');
ALTER TABLE "PocOperation" ADD CHECK(kind <> 'RECORD' OR (stop_deadline IS NOT NULL AND stop_deadline <= created_at + interval '10 seconds'));
ALTER TABLE "PocOperation" ADD FOREIGN KEY(account,campaign,parent_resource) REFERENCES "PocOperation"(account,campaign,resource) ON DELETE RESTRICT;
CREATE UNIQUE INDEX poc_one_dial_per_parent ON "PocOperation"(account,campaign,parent_resource) WHERE origin = 'DIAL';
ALTER TABLE "PocWebhookReceipt" ADD COLUMN parent_resource text CHECK(parent_resource ~ '^CA[0-9a-f]{32}$');
ALTER TABLE "PocWebhookReceipt" ADD FOREIGN KEY(account,campaign,parent_resource) REFERENCES "PocOperation"(account,campaign,resource) ON DELETE RESTRICT;
ALTER TABLE "PocOperation" DROP CONSTRAINT "PocOperation_status_check";
ALTER TABLE "PocWebhookReceipt" DROP CONSTRAINT "PocWebhookReceipt_status_check", DROP CONSTRAINT "PocWebhookReceipt_event_key_check";
ALTER TABLE "PocOperation" ADD CHECK(status IN ('queued','ringing','in-progress','completed','busy','no-answer','failed','canceled','sent','delivered','undelivered','deleted','absent','received'));
ALTER TABLE "PocWebhookReceipt" ADD CHECK(status IN ('queued','ringing','in-progress','completed','busy','no-answer','failed','canceled','sent','delivered','undelivered','deleted','absent','received'));
ALTER TABLE "PocWebhookReceipt" ADD CHECK(event_key ~ '^(voice|dial-result|call-status|message-status|recording-status):(CA|SM|RE)[0-9a-f]{32}:([0-9]{1,5}|queued|ringing|in-progress|completed|busy|no-answer|failed|canceled|sent|delivered|undelivered|deleted|absent|received)$');
-- Existing targeted UPDATE grants are sufficient; no grant on identity, parent, origin, slot, budget or deadlines.
CREATE FUNCTION poc_preserve_resource() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.resource IS NOT NULL AND NEW.resource IS DISTINCT FROM OLD.resource THEN
    RAISE EXCEPTION 'RESOURCE_IMMUTABLE';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION poc_preserve_resource() FROM PUBLIC;
CREATE TRIGGER poc_preserve_resource BEFORE UPDATE ON "PocOperation"
FOR EACH ROW EXECUTE FUNCTION poc_preserve_resource();
COMMIT;
