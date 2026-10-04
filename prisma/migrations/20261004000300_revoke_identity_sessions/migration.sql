-- A session established before an identity privilege/MFA change must not inherit it.
CREATE FUNCTION tony_security.revoke_identity_sessions() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
 IF OLD."platformRole" IS DISTINCT FROM NEW."platformRole"
 OR OLD."twoFactorEnabled" IS DISTINCT FROM NEW."twoFactorEnabled"
 OR (OLD."emailVerified" AND NOT NEW."emailVerified") THEN
  DELETE FROM public.auth_session WHERE "userId" = NEW.id;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION tony_security.revoke_identity_sessions() FROM PUBLIC, tony_app, tony_auth;
CREATE TRIGGER identity_session_revocation AFTER UPDATE OF "platformRole", "twoFactorEnabled", "emailVerified"
ON auth_user FOR EACH ROW EXECUTE FUNCTION tony_security.revoke_identity_sessions();
