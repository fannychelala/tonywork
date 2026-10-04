CREATE OR REPLACE FUNCTION tony_security.authorize_admin_access(p_token text, p_organization uuid, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a record; gid uuid := gen_random_uuid();
BEGIN
 SELECT * INTO a FROM tony_security.valid_actor(p_token);
 IF p_reason IS NULL OR NOT FOUND OR NOT a.platform_admin OR NOT a.mfa_enabled OR length(btrim(p_reason)) NOT BETWEEN 10 AND 200
 OR NOT EXISTS (SELECT 1 FROM public.organization WHERE id = p_organization) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 DELETE FROM tony_security.admin_grant WHERE expires_at < statement_timestamp();
 INSERT INTO tony_security.admin_grant VALUES (gid,a.session_id,p_organization,txid_current(),statement_timestamp()+interval '1 minute');
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId")
 VALUES (p_organization,a.actor_id,'PLATFORM_TENANT_ACCESS',p_reason,gid);
 RETURN gid;
END $$;

