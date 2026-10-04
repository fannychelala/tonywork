CREATE OR REPLACE FUNCTION tony_security.audit_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE c record;
BEGIN
 SELECT * INTO c FROM tony_security.current_context();
 IF NOT FOUND OR NOT c.owner_access THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF TG_TABLE_NAME = 'membership' THEN
 IF OLD.role = 'OWNER' AND NEW.role <> 'OWNER' THEN
  -- Serialize owner changes; preserve at least one owner even under concurrent demotions.
  PERFORM 1 FROM public.organization WHERE id = OLD."organizationId" FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.membership WHERE "organizationId" = OLD."organizationId" AND role = 'OWNER' AND id <> OLD.id) THEN
   RAISE EXCEPTION 'Last owner cannot be removed' USING ERRCODE = '42501';
  END IF;
 END IF;
 END IF;
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId")
 VALUES (c.organization_id,c.actor_id,CASE WHEN TG_TABLE_NAME = 'membership' THEN 'PERMISSIONS_CHANGED' ELSE 'ORGANIZATION_SETTINGS_CHANGED' END,NEW.id::text,gen_random_uuid());
 RETURN NEW;
END $$;
