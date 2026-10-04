-- CreateTable
CREATE TABLE "auth_user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "platformRole" TEXT NOT NULL DEFAULT 'USER',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "auth_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_session" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" UUID NOT NULL,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_account" (
    "id" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMPTZ(6),
    "refreshTokenExpiresAt" TIMESTAMPTZ(6),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_rate_limit" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "auth_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_two_factor" (
    "id" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),

    CONSTRAINT "auth_two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_mail" (
    "id" UUID NOT NULL,
    "recipient" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_mail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "defaultLocale" TEXT NOT NULL DEFAULT 'fr-FR',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "organizationId" UUID,
    "actorId" UUID NOT NULL,
    "event" TEXT NOT NULL,
    "targetId" TEXT,
    "correlationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_user_email_key" ON "auth_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_token_key" ON "auth_session"("token");

-- CreateIndex
CREATE INDEX "auth_session_userId_idx" ON "auth_session"("userId");

-- CreateIndex
CREATE INDEX "auth_account_userId_idx" ON "auth_account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_providerId_accountId_key" ON "auth_account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "auth_verification_identifier_idx" ON "auth_verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "auth_rate_limit_key_key" ON "auth_rate_limit"("key");

-- CreateIndex
CREATE INDEX "auth_two_factor_userId_idx" ON "auth_two_factor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "membership_organizationId_userId_key" ON "membership"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "audit_log_organizationId_createdAt_idx" ON "audit_log"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account" ADD CONSTRAINT "auth_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_two_factor" ADD CONSTRAINT "auth_two_factor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Auth is a separate trust plane. Tenant runtime never reads credentials or sessions.
REVOKE ALL ON auth_user, auth_session, auth_account, auth_verification, auth_rate_limit, auth_two_factor, auth_mail FROM tony_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_user, auth_session, auth_account, auth_verification, auth_rate_limit, auth_two_factor, auth_mail TO tony_auth;
ALTER TABLE auth_user ADD CONSTRAINT platform_role_valid CHECK ("platformRole" IN ('USER', 'PLATFORM_ADMIN'));
ALTER TABLE membership ADD CONSTRAINT membership_role_valid CHECK (role IN ('OWNER', 'MEMBER'));
REVOKE ALL ON organization, membership, audit_log FROM tony_app;
GRANT SELECT ON organization, membership, audit_log TO tony_app;
GRANT UPDATE (name, "defaultLocale", currency, "timeZone") ON organization TO tony_app;
GRANT UPDATE (role) ON membership TO tony_app;
REVOKE ALL ON SEQUENCE audit_log_id_seq FROM tony_app;

CREATE SCHEMA tony_security AUTHORIZATION tony_migrator;
REVOKE ALL ON SCHEMA tony_security FROM PUBLIC;
GRANT USAGE ON SCHEMA tony_security TO tony_app;
CREATE TABLE tony_security.transaction_context (
 backend_id integer NOT NULL,
 transaction_id bigint NOT NULL,
 session_id uuid NOT NULL,
 organization_id uuid NOT NULL,
 administrator boolean NOT NULL,
 PRIMARY KEY (backend_id, transaction_id)
);
REVOKE ALL ON tony_security.transaction_context FROM PUBLIC, tony_app, tony_auth;

CREATE TABLE tony_security.admin_grant (
 id uuid PRIMARY KEY,
 session_id uuid NOT NULL,
 organization_id uuid NOT NULL,
 created_transaction bigint NOT NULL,
 expires_at timestamptz NOT NULL
);
REVOKE ALL ON tony_security.admin_grant FROM PUBLIC, tony_app, tony_auth;

CREATE FUNCTION tony_security.valid_actor(p_token text)
RETURNS TABLE (actor_id uuid, session_id uuid, platform_admin boolean, mfa_enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
 SELECT u.id, s.id, u."platformRole" = 'PLATFORM_ADMIN', u."twoFactorEnabled"
 FROM public.auth_session s JOIN public.auth_user u ON u.id = s."userId"
 WHERE s.token = p_token AND s."expiresAt" > statement_timestamp() AND u."emailVerified" = true
$$;

CREATE FUNCTION tony_security.current_context()
RETURNS TABLE (actor_id uuid, organization_id uuid, owner_access boolean, administrator boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
 SELECT u.id, c.organization_id, (NOT c.administrator AND m.role = 'OWNER'), c.administrator
 FROM tony_security.transaction_context c
 JOIN public.auth_session s ON s.id = c.session_id
 JOIN public.auth_user u ON u.id = s."userId"
 LEFT JOIN public.membership m ON m."organizationId" = c.organization_id AND m."userId" = u.id
 WHERE c.backend_id = pg_backend_pid() AND c.transaction_id = txid_current()
 AND s."expiresAt" > statement_timestamp() AND u."emailVerified"
 AND ((NOT c.administrator AND m.id IS NOT NULL) OR (c.administrator AND u."platformRole" = 'PLATFORM_ADMIN' AND u."twoFactorEnabled"))
$$;

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization FORCE ROW LEVEL SECURITY;
ALTER TABLE membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
-- Only the offline migration principal (also owner of the narrowly scoped SECURITY DEFINER functions)
-- has the infrastructure policy. No runtime role inherits this principal.
CREATE POLICY infrastructure_organization ON organization TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY infrastructure_membership ON membership TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY infrastructure_audit ON audit_log TO tony_migrator USING (true) WITH CHECK (true);
CREATE POLICY organization_read ON organization FOR SELECT TO tony_app USING (id = (SELECT organization_id FROM tony_security.current_context()));
CREATE POLICY organization_update ON organization FOR UPDATE TO tony_app
 USING (id = (SELECT organization_id FROM tony_security.current_context() WHERE owner_access))
 WITH CHECK (id = (SELECT organization_id FROM tony_security.current_context() WHERE owner_access));
CREATE POLICY membership_read ON membership FOR SELECT TO tony_app USING ("organizationId" = (SELECT organization_id FROM tony_security.current_context()));
CREATE POLICY membership_update ON membership FOR UPDATE TO tony_app
 USING ("organizationId" = (SELECT organization_id FROM tony_security.current_context() WHERE owner_access))
 WITH CHECK ("organizationId" = (SELECT organization_id FROM tony_security.current_context() WHERE owner_access));
CREATE POLICY audit_read ON audit_log FOR SELECT TO tony_app USING ("organizationId" = (SELECT organization_id FROM tony_security.current_context() WHERE owner_access OR administrator));

CREATE FUNCTION tony_security.open_context(p_token text, p_organization uuid, p_admin_reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a record; is_admin boolean := p_admin_reason IS NOT NULL;
BEGIN
 SELECT * INTO a FROM tony_security.valid_actor(p_token);
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF EXISTS (SELECT 1 FROM tony_security.transaction_context WHERE backend_id = pg_backend_pid() AND transaction_id = txid_current()) THEN
  RAISE EXCEPTION 'Context already established' USING ERRCODE = '42501';
 END IF;
 IF is_admin THEN
  IF NOT a.platform_admin OR NOT a.mfa_enabled OR NOT EXISTS (
   SELECT 1 FROM tony_security.admin_grant g
   WHERE g.id::text = p_admin_reason AND g.session_id = a.session_id AND g.organization_id = p_organization
   AND g.created_transaction <> txid_current() AND g.expires_at > statement_timestamp()
  ) THEN
   RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organization WHERE id = p_organization) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 ELSE
  IF NOT EXISTS (SELECT 1 FROM public.membership WHERE "organizationId" = p_organization AND "userId" = a.actor_id) THEN
   RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
 END IF;
 DELETE FROM tony_security.transaction_context WHERE backend_id = pg_backend_pid();
 INSERT INTO tony_security.transaction_context VALUES (pg_backend_pid(), txid_current(), a.session_id, p_organization, is_admin);

END $$;

-- A grant must commit in an earlier transaction: rolling back a read cannot erase its audit.
CREATE FUNCTION tony_security.authorize_admin_access(p_token text, p_organization uuid, p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a record; gid uuid := gen_random_uuid();
BEGIN
 SELECT * INTO a FROM tony_security.valid_actor(p_token);
 IF NOT FOUND OR NOT a.platform_admin OR NOT a.mfa_enabled OR length(btrim(p_reason)) NOT BETWEEN 10 AND 200
 OR NOT EXISTS (SELECT 1 FROM public.organization WHERE id = p_organization) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
 END IF;
 DELETE FROM tony_security.admin_grant WHERE expires_at < statement_timestamp();
 INSERT INTO tony_security.admin_grant VALUES (gid,a.session_id,p_organization,txid_current(),statement_timestamp()+interval '1 minute');
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId")
 VALUES (p_organization,a.actor_id,'PLATFORM_TENANT_ACCESS',p_reason,gid);
 RETURN gid;
END $$;

CREATE FUNCTION tony_security.close_context() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = pg_catalog AS $$
 DELETE FROM tony_security.transaction_context WHERE backend_id = pg_backend_pid() AND transaction_id = txid_current()
$$;

CREATE FUNCTION tony_security.create_organization(p_token text, p_name text, p_locale text, p_currency text, p_timezone text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE a record; oid uuid := gen_random_uuid();
BEGIN
 SELECT * INTO a FROM tony_security.valid_actor(p_token);
 IF NOT FOUND OR a.platform_admin THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF length(btrim(p_name)) NOT BETWEEN 1 AND 120 OR p_locale NOT IN ('fr-FR','en-GB') OR p_currency NOT IN ('EUR','GBP','USD','JPY','KWD')
 OR NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_timezone) THEN RAISE EXCEPTION 'Invalid organization' USING ERRCODE = '22023'; END IF;
 INSERT INTO public.organization (id,name,"defaultLocale",currency,"timeZone") VALUES (oid,btrim(p_name),p_locale,p_currency,p_timezone);
 INSERT INTO public.membership (id,"organizationId","userId",role) VALUES (gen_random_uuid(),oid,a.actor_id,'OWNER');
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId") VALUES (oid,a.actor_id,'ORGANIZATION_CREATED',oid::text,gen_random_uuid());
 RETURN oid;
END $$;

CREATE FUNCTION tony_security.audit_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE c record;
BEGIN
 SELECT * INTO c FROM tony_security.current_context();
 IF NOT FOUND OR NOT c.owner_access THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
 IF TG_TABLE_NAME = 'membership' AND OLD.role = 'OWNER' AND NEW.role <> 'OWNER' THEN
  -- Serialize owner changes; preserve at least one owner even under concurrent demotions.
  PERFORM 1 FROM public.organization WHERE id = OLD."organizationId" FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.membership WHERE "organizationId" = OLD."organizationId" AND role = 'OWNER' AND id <> OLD.id) THEN
   RAISE EXCEPTION 'Last owner cannot be removed' USING ERRCODE = '42501';
  END IF;
 END IF;
 INSERT INTO public.audit_log ("organizationId","actorId",event,"targetId","correlationId")
 VALUES (c.organization_id,c.actor_id,CASE WHEN TG_TABLE_NAME = 'membership' THEN 'PERMISSIONS_CHANGED' ELSE 'ORGANIZATION_SETTINGS_CHANGED' END,NEW.id::text,gen_random_uuid());
 RETURN NEW;
END $$;
CREATE TRIGGER organization_audit BEFORE UPDATE ON organization FOR EACH ROW EXECUTE FUNCTION tony_security.audit_changes();
CREATE TRIGGER membership_audit BEFORE UPDATE ON membership FOR EACH ROW EXECUTE FUNCTION tony_security.audit_changes();

CREATE FUNCTION tony_security.audit_auth() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE aid uuid; ev text; tid text;
BEGIN
 IF TG_TABLE_NAME = 'auth_session' THEN
  IF TG_OP = 'DELETE' THEN aid := OLD."userId"; ev := 'SESSION_REVOKED'; tid := OLD.id::text;
  ELSE aid := NEW."userId"; tid := NEW.id::text;
   SELECT CASE WHEN "platformRole" = 'PLATFORM_ADMIN' THEN 'PLATFORM_ADMIN_SESSION_CREATED' ELSE 'AUTH_SESSION_CREATED' END INTO ev FROM public.auth_user WHERE id = aid;
  END IF;
 ELSE aid := NEW.id; tid := NEW.id::text; ev := 'AUTH_IDENTITY_CHANGED'; END IF;
 INSERT INTO public.audit_log ("actorId",event,"targetId","correlationId") VALUES (aid,ev,tid,gen_random_uuid());
 IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END $$;
CREATE TRIGGER session_created_audit AFTER INSERT OR DELETE ON auth_session FOR EACH ROW EXECUTE FUNCTION tony_security.audit_auth();
CREATE TRIGGER identity_changed_audit AFTER UPDATE OF "platformRole", "twoFactorEnabled", "emailVerified" ON auth_user FOR EACH ROW EXECUTE FUNCTION tony_security.audit_auth();
CREATE FUNCTION tony_security.protect_audit() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Audit is append only' USING ERRCODE = '42501'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION tony_security.protect_audit();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA tony_security FROM PUBLIC, tony_auth, tony_app;
GRANT EXECUTE ON FUNCTION tony_security.authorize_admin_access(text,uuid,text), tony_security.current_context(), tony_security.open_context(text,uuid,text), tony_security.close_context(), tony_security.create_organization(text,text,text,text,text) TO tony_app;
