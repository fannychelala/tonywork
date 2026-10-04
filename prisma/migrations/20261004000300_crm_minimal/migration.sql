BEGIN;
CREATE TABLE public.contact (
"organizationId" uuid NOT NULL REFERENCES public.organization(id) ON DELETE RESTRICT,
id uuid NOT NULL DEFAULT gen_random_uuid(),
"createdAt" timestamptz NOT NULL DEFAULT now(),
"updatedAt" timestamptz NOT NULL DEFAULT now(),
version integer NOT NULL DEFAULT 1 CHECK (version > 0),
name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120 AND name=btrim(name)),
phone text NOT NULL CHECK (phone ~ '^\+[1-9][0-9]{1,14}$'),
email text CHECK (email IS NULL OR (length(email) BETWEEN 3 AND 254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
UNIQUE ("organizationId",phone),
PRIMARY KEY ("organizationId",id)
);
CREATE TABLE public.service_template (
"organizationId" uuid NOT NULL REFERENCES public.organization(id) ON DELETE RESTRICT,
id uuid NOT NULL DEFAULT gen_random_uuid(),
"createdAt" timestamptz NOT NULL DEFAULT now(),
"updatedAt" timestamptz NOT NULL DEFAULT now(),
version integer NOT NULL DEFAULT 1 CHECK (version > 0),
name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120 AND name=btrim(name)),
description text CHECK (description IS NULL OR (length(description)<=2000 AND description=btrim(description))),
currency text NOT NULL CHECK (currency IN ('EUR','GBP','USD','JPY','KWD')),
"averageAmountMinor" integer CHECK ("averageAmountMinor" BETWEEN 0 AND 999999999),
"minAmountMinor" integer CHECK ("minAmountMinor" BETWEEN 0 AND 999999999),
"maxAmountMinor" integer CHECK ("maxAmountMinor" BETWEEN 0 AND 999999999),
"durationMinutes" integer CHECK ("durationMinutes" BETWEEN 1 AND 525600),
active boolean NOT NULL DEFAULT true,
CHECK ("minAmountMinor" <= "maxAmountMinor"),
CHECK ("minAmountMinor" <= "averageAmountMinor"),
CHECK ("averageAmountMinor" <= "maxAmountMinor"),
PRIMARY KEY ("organizationId",id)
);
CREATE TABLE public.opportunity (
"organizationId" uuid NOT NULL REFERENCES public.organization(id) ON DELETE RESTRICT,
id uuid NOT NULL DEFAULT gen_random_uuid(),
"createdAt" timestamptz NOT NULL DEFAULT now(),
"updatedAt" timestamptz NOT NULL DEFAULT now(),
version integer NOT NULL DEFAULT 1 CHECK (version > 0),
"contactId" uuid NOT NULL,
"serviceTemplateId" uuid,
title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160 AND title=btrim(title)),
description text CHECK (description IS NULL OR (length(description)<=2000 AND description=btrim(description))),
status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','TO_CONTACT','WAITING_CUSTOMER','WON','LOST','ARCHIVED')),
FOREIGN KEY ("organizationId","contactId") REFERENCES public.contact("organizationId",id) ON DELETE RESTRICT,
FOREIGN KEY ("organizationId","serviceTemplateId") REFERENCES public.service_template("organizationId",id) ON DELETE RESTRICT,
PRIMARY KEY ("organizationId",id)
);
CREATE TABLE public.task (
"organizationId" uuid NOT NULL REFERENCES public.organization(id) ON DELETE RESTRICT,
id uuid NOT NULL DEFAULT gen_random_uuid(),
"createdAt" timestamptz NOT NULL DEFAULT now(),
"updatedAt" timestamptz NOT NULL DEFAULT now(),
version integer NOT NULL DEFAULT 1 CHECK (version > 0),
"opportunityId" uuid NOT NULL,
title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160 AND title=btrim(title)),
"dueAt" timestamptz,
status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DONE')),
"completedAt" timestamptz,
CHECK ((status='OPEN' AND "completedAt" IS NULL) OR (status='DONE' AND "completedAt" IS NOT NULL)),
FOREIGN KEY ("organizationId","opportunityId") REFERENCES public.opportunity("organizationId",id) ON DELETE RESTRICT,
PRIMARY KEY ("organizationId",id)
);
CREATE INDEX contact_name ON public.contact ("organizationId",name,id);
CREATE INDEX service_active_name ON public.service_template ("organizationId",active,name,id);
CREATE INDEX opportunity_status_date ON public.opportunity ("organizationId",status,"createdAt",id);
CREATE INDEX opportunity_contact ON public.opportunity ("organizationId","contactId");
CREATE INDEX opportunity_service ON public.opportunity ("organizationId","serviceTemplateId");
CREATE INDEX task_status_due ON public.task ("organizationId",status,"dueAt",id);
CREATE INDEX task_opportunity ON public.task ("organizationId","opportunityId");

CREATE FUNCTION tony_security.crm_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE c record; oid uuid; tid uuid; ev text;
BEGIN
 SELECT * INTO c FROM tony_security.current_context();
 IF TG_OP='DELETE' THEN oid:=OLD."organizationId"; tid:=OLD.id;
 ELSE oid:=NEW."organizationId"; tid:=NEW.id; END IF;
 IF NOT FOUND OR NOT c.owner_access OR c.administrator OR c.organization_id<>oid THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW."organizationId"<>OLD."organizationId" OR NEW.id<>OLD.id THEN
   RAISE EXCEPTION 'Immutable identifier' USING ERRCODE='23514';
  END IF;
  IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Invalid version' USING ERRCODE='23514'; END IF;
  NEW."updatedAt":=statement_timestamp();
  IF TG_TABLE_NAME='opportunity' THEN
   IF OLD.status='ARCHIVED' AND NEW.status NOT IN ('ARCHIVED','NEW') THEN
    RAISE EXCEPTION 'Invalid transition' USING ERRCODE='23514';
   END IF;
  END IF;
 ELSIF TG_OP='INSERT' THEN
  IF NEW.version<>1 THEN RAISE EXCEPTION 'Invalid version' USING ERRCODE='23514'; END IF;
 END IF;
 ev:=upper(TG_TABLE_NAME)||CASE TG_OP WHEN 'INSERT' THEN '_CREATED' WHEN 'UPDATE' THEN '_UPDATED' ELSE '_DELETED' END;
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId") VALUES (oid,c.actor_id,ev,tid::text,gen_random_uuid());
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
REVOKE ALL ON FUNCTION tony_security.crm_change() FROM PUBLIC,tony_app,tony_auth;
ALTER TABLE public.contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact FORCE ROW LEVEL SECURITY;
CREATE POLICY infrastructure ON public.contact TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY tenant_read ON public.contact FOR SELECT TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE NOT administrator));
CREATE POLICY tenant_create ON public.contact FOR INSERT TO tony_app WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_update ON public.contact FOR UPDATE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator)) WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_delete ON public.contact FOR DELETE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
REVOKE ALL ON public.contact FROM PUBLIC,tony_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.contact TO tony_app;
CREATE TRIGGER crm_change BEFORE INSERT OR UPDATE OR DELETE ON public.contact FOR EACH ROW EXECUTE FUNCTION tony_security.crm_change();
ALTER TABLE public.service_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_template FORCE ROW LEVEL SECURITY;
CREATE POLICY infrastructure ON public.service_template TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY tenant_read ON public.service_template FOR SELECT TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE NOT administrator));
CREATE POLICY tenant_create ON public.service_template FOR INSERT TO tony_app WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_update ON public.service_template FOR UPDATE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator)) WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_delete ON public.service_template FOR DELETE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
REVOKE ALL ON public.service_template FROM PUBLIC,tony_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.service_template TO tony_app;
CREATE TRIGGER crm_change BEFORE INSERT OR UPDATE OR DELETE ON public.service_template FOR EACH ROW EXECUTE FUNCTION tony_security.crm_change();
ALTER TABLE public.opportunity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity FORCE ROW LEVEL SECURITY;
CREATE POLICY infrastructure ON public.opportunity TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY tenant_read ON public.opportunity FOR SELECT TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE NOT administrator));
CREATE POLICY tenant_create ON public.opportunity FOR INSERT TO tony_app WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_update ON public.opportunity FOR UPDATE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator)) WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_delete ON public.opportunity FOR DELETE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
REVOKE ALL ON public.opportunity FROM PUBLIC,tony_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.opportunity TO tony_app;
CREATE TRIGGER crm_change BEFORE INSERT OR UPDATE OR DELETE ON public.opportunity FOR EACH ROW EXECUTE FUNCTION tony_security.crm_change();
ALTER TABLE public.task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task FORCE ROW LEVEL SECURITY;
CREATE POLICY infrastructure ON public.task TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY tenant_read ON public.task FOR SELECT TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE NOT administrator));
CREATE POLICY tenant_create ON public.task FOR INSERT TO tony_app WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_update ON public.task FOR UPDATE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator)) WITH CHECK ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
CREATE POLICY tenant_delete ON public.task FOR DELETE TO tony_app USING ("organizationId"=(SELECT organization_id FROM tony_security.current_context() WHERE owner_access AND NOT administrator));
REVOKE ALL ON public.task FROM PUBLIC,tony_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.task TO tony_app;
CREATE TRIGGER crm_change BEFORE INSERT OR UPDATE OR DELETE ON public.task FOR EACH ROW EXECUTE FUNCTION tony_security.crm_change();
COMMIT;
