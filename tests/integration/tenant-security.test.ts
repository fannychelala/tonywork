import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const app = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
const auth = new Pool({ connectionString: process.env.AUTH_DATABASE_URL });
const migration = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
const users = { owner: randomUUID(), member: randomUUID(), other: randomUUID(), admin: randomUUID(), noMfa: randomUUID(), unverified: randomUUID() };
const tokens = Object.fromEntries(Object.keys(users).map(k => [k, randomUUID() + randomUUID()]));
let a: string; let b: string; let memberId: string;
async function context(client: PoolClient, token: string, org: string, reason: string | null = null) {
 await client.query("SELECT tony_security.open_context($1,$2::uuid,$3::text)", [token, org, reason]);
}
async function tx<T>(run: (c: PoolClient) => Promise<T>) {
 const c = await app.connect(); await c.query("BEGIN");
 try { return await run(c); } finally { await c.query("ROLLBACK"); c.release(); }
}
beforeAll(async () => {
 for (const [key, id] of Object.entries(users)) {
  await auth.query('INSERT INTO auth_user (id,name,email,"emailVerified","createdAt","updatedAt","platformRole","twoFactorEnabled") VALUES ($1,$2,$3,$4,now(),now(),$5,$6)', [id, "Synthetic test", `${id}@example.invalid`, key !== "unverified", ["admin", "noMfa"].includes(key) ? "PLATFORM_ADMIN" : "USER", key === "admin"]);
  await auth.query('INSERT INTO auth_session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 day\',now())', [randomUUID(), tokens[key], id]);
 }
 a = (await app.query("SELECT tony_security.create_organization($1,'Tenant A','fr-FR','EUR','Europe/Paris') AS id", [tokens.owner])).rows[0].id;
 b = (await app.query("SELECT tony_security.create_organization($1,'Tenant B','en-GB','GBP','Europe/London') AS id", [tokens.other])).rows[0].id;
 memberId = randomUUID();
 await migration.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'MEMBER\')', [memberId, a, users.member]);
});
afterAll(async () => { await Promise.all([app.end(), auth.end(), migration.end()]); });
describe("PostgreSQL is the security boundary (runtime role, real database)", () => {
 it("forces RLS on every tenant table, with a non-owner non-BYPASSRLS role", async () => {
  const result = await app.query("SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relowner = r.oid AS owner,r.rolsuper,r.rolbypassrls FROM pg_class c CROSS JOIN pg_roles r WHERE c.relname IN ('organization','membership','audit_log') AND r.rolname = current_user ORDER BY c.relname");
  expect(result.rows).toHaveLength(3);
  for (const row of result.rows) expect(row).toMatchObject({ relrowsecurity: true, relforcerowsecurity: true, owner: false, rolsuper: false, rolbypassrls: false });
 });
 it.each(["organization", "membership", "audit_log"])("without context %s exposes no rows", async table => expect((await app.query(`SELECT * FROM ${table}`)).rows).toEqual([]));
 it("cannot forge the tenant or actor using custom settings", async () => {
  await tx(async c => { await c.query("SELECT set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)", [b, users.other]); expect((await c.query("SELECT * FROM organization")).rows).toEqual([]); });
 });
 it("rejects an invalid session token", async () => { await expect(tx(c => context(c, "invalid", a))).rejects.toMatchObject({ code: "42501" }); });
 it("rejects an unverified identity", async () => { await expect(tx(c => context(c, tokens.unverified!, a))).rejects.toMatchObject({ code: "42501" }); });
 it("rejects a user with no membership in the requested organization", async () => { await expect(tx(c => context(c, tokens.other!, a))).rejects.toMatchObject({ code: "42501" }); });
 it("rejects switching to another tenant even with a valid token", async () => { await expect(tx(c => context(c, tokens.owner!, b))).rejects.toMatchObject({ code: "42501" }); });
 it("allows OWNER to read only their organization and its memberships", async () => {
  await tx(async c => { await context(c, tokens.owner!, a); expect((await c.query("SELECT id FROM organization")).rows).toEqual([{ id: a }]); expect((await c.query('SELECT DISTINCT "organizationId" FROM membership')).rows).toEqual([{ organizationId: a }]); });
 });
 it("allows MEMBER read but not settings updates", async () => {
  await tx(async c => { await context(c, tokens.member!, a); expect((await c.query("SELECT id FROM organization")).rows).toEqual([{ id: a }]); expect((await c.query("UPDATE organization SET name = 'Forbidden' WHERE id=$1", [a])).rowCount).toBe(0); });
 });
 it("OWNER settings updates are audited in the same transaction", async () => {
  await tx(async c => { await context(c, tokens.owner!, a); expect((await c.query("UPDATE organization SET name='Updated' WHERE id=$1", [a])).rowCount).toBe(1); expect((await c.query("SELECT event FROM audit_log WHERE event='ORGANIZATION_SETTINGS_CHANGED' AND \"organizationId\"=$1", [a])).rows).toHaveLength(1); });
 });
 it("OWNER may change MEMBER permissions and an audit is generated", async () => {
  await tx(async c => { await context(c, tokens.owner!, a); expect((await c.query("UPDATE membership SET role='OWNER' WHERE id=$1", [memberId])).rowCount).toBe(1); expect((await c.query("SELECT event FROM audit_log WHERE event='PERMISSIONS_CHANGED'")).rows).toHaveLength(1); });
 });
 it("MEMBER cannot escalate to OWNER", async () => { await tx(async c => { await context(c, tokens.member!, a); expect((await c.query("UPDATE membership SET role='OWNER' WHERE id=$1", [memberId])).rowCount).toBe(0); }); });
 it("last OWNER cannot demote themselves", async () => { await expect(tx(async c => { await context(c, tokens.owner!, a); await c.query("UPDATE membership SET role='MEMBER' WHERE \"organizationId\"=$1 AND \"userId\"=$2", [a, users.owner]); })).rejects.toMatchObject({ code: "42501" }); });
 it.each(["organization", "membership"])("cross-tenant UPDATE %s touches zero rows", async table => {
  await tx(async c => { await context(c, tokens.owner!, a); const sql = table === "organization" ? "UPDATE organization SET name='Forbidden' WHERE id=$1" : "UPDATE membership SET role='MEMBER' WHERE \"organizationId\"=$1"; expect((await c.query(sql, [b])).rowCount).toBe(0); });
 });
 it.each(["organization", "membership", "audit_log"])("runtime DELETE %s is forbidden, including tenant B", async table => { await expect(tx(async c => { await context(c, tokens.owner!, a); await c.query(`DELETE FROM ${table}`); })).rejects.toMatchObject({ code: "42501" }); });
 it("runtime cannot insert a forged cross-tenant membership", async () => { await expect(tx(async c => { await context(c, tokens.owner!, a); await c.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'OWNER\')', [randomUUID(), b, users.owner]); })).rejects.toMatchObject({ code: "42501" }); });
 it("identity/session credentials are not accessible to the tenant role", async () => { for (const table of ["auth_user", "auth_session", "auth_account", "auth_verification", "auth_two_factor", "auth_mail"]) await expect(app.query(`SELECT * FROM ${table}`)).rejects.toMatchObject({ code: "42501" }); });
 it("runtime cannot assume the migration or authentication principal", async () => { for (const role of ["tony_migrator", "tony_auth"]) await expect(app.query(`SET ROLE ${role}`)).rejects.toMatchObject({ code: "42501" }); });
 it("runtime cannot write the private transaction context", async () => { await expect(app.query("SELECT * FROM tony_security.transaction_context")).rejects.toMatchObject({ code: "42501" }); });
 it("context does not leak after commit on the same connection", async () => {
  const c = await app.connect(); try { await c.query("BEGIN"); await context(c, tokens.owner!, a); await c.query("COMMIT"); expect((await c.query("SELECT * FROM organization")).rows).toEqual([]); } finally { c.release(); }
 });
 it("cannot replace an established context within a transaction", async () => { await expect(tx(async c => { await context(c, tokens.owner!, a); await context(c, tokens.other!, b); })).rejects.toMatchObject({ code: "42501" }); });
 it("expired sessions are rejected by PostgreSQL", async () => {
  const token = randomUUID(); await auth.query('INSERT INTO auth_session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()-interval \'1 second\',now())', [randomUUID(), token, users.owner]);
  await expect(tx(c => context(c, token, a))).rejects.toMatchObject({ code: "42501" });
 });
 it("revoking a session immediately denies access even in an established context", async () => {
  const token = randomUUID(); const sid = randomUUID(); await auth.query('INSERT INTO auth_session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 hour\',now())', [sid, token, users.owner]);
  await tx(async c => { await context(c, token, a); await auth.query("DELETE FROM auth_session WHERE id=$1", [sid]); expect((await c.query("SELECT * FROM organization")).rows).toEqual([]); });
  expect((await migration.query("SELECT event FROM audit_log WHERE event='SESSION_REVOKED' AND \"targetId\"=$1", [sid])).rows).toHaveLength(1);
 });
 it("PLATFORM_ADMIN has no implicit client access", async () => { await expect(tx(c => context(c, tokens.admin!, a))).rejects.toMatchObject({ code: "42501" }); });
 it("PLATFORM_ADMIN without MFA cannot open an admin context", async () => { await expect(tx(c => context(c, tokens.noMfa!, a, "Synthetic support review"))).rejects.toMatchObject({ code: "42501" }); });
 it("regular OWNER cannot claim a platform context", async () => { await expect(tx(c => context(c, tokens.owner!, b, "Synthetic support review"))).rejects.toMatchObject({ code: "42501" }); });
 it("admin access is scoped, read-only and audit survives read rollback", async () => {
  const grant = (await app.query("SELECT tony_security.authorize_admin_access($1,$2::uuid,$3) AS id", [tokens.admin, b, "Synthetic support review"])).rows[0].id;
  await tx(async c => { await context(c, tokens.admin!, b, grant); expect((await c.query("SELECT id FROM organization")).rows).toEqual([{ id: b }]); expect((await c.query("UPDATE organization SET name='Forbidden' WHERE id=$1", [b])).rowCount).toBe(0); expect((await c.query("SELECT event FROM audit_log WHERE event='PLATFORM_TENANT_ACCESS' AND \"correlationId\"=$1", [grant])).rows).toHaveLength(1); });
  expect((await migration.query("SELECT id FROM audit_log WHERE \"correlationId\"=$1", [grant])).rows).toHaveLength(1);
 });
 it("an admin cannot audit and read within a rollback-able transaction", async () => {
  await expect(tx(async c => { const grant = (await c.query("SELECT tony_security.authorize_admin_access($1,$2::uuid,$3) AS id", [tokens.admin,b,"Synthetic support review"])).rows[0].id; await context(c,tokens.admin!,b,grant); })).rejects.toMatchObject({ code: "42501" });
 });
 it("administrator cannot omit justification with SQL NULL", async () => { await expect(app.query("SELECT tony_security.authorize_admin_access($1,$2::uuid,NULL)", [tokens.admin,b])).rejects.toMatchObject({ code: "42501" }); });
 it("administrator must supply a non-empty justification", async () => { await expect(app.query("SELECT tony_security.authorize_admin_access($1,$2::uuid,$3)", [tokens.admin,b,"short"])).rejects.toMatchObject({ code: "42501" }); });
 it("audit cannot be modified or deleted even by the migration principal", async () => {
  await expect(migration.query("UPDATE audit_log SET event='Forged'")).rejects.toMatchObject({ code: "42501" });
  await expect(migration.query("DELETE FROM audit_log")).rejects.toMatchObject({ code: "42501" });
 });
 it("tenant runtime cannot forge audit entries", async () => { await expect(app.query('INSERT INTO audit_log ("actorId",event,"correlationId") VALUES ($1,\'FORGED\',$2)', [users.owner, randomUUID()])).rejects.toMatchObject({ code: "42501" }); });
 it("session creation for admins is audited without storing the token", async () => {
  const rows = (await migration.query("SELECT * FROM audit_log WHERE \"actorId\"=$1 AND event='PLATFORM_ADMIN_SESSION_CREATED'", [users.admin])).rows;
  expect(rows).toHaveLength(1); expect(JSON.stringify(rows)).not.toContain(tokens.admin);
 });
});
