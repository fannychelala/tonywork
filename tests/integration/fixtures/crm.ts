import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
export const tables = ["contact", "service_template", "opportunity", "task"] as const;
export function crmFixture() {
 const app = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
 const auth = new Pool({ connectionString: process.env.AUTH_DATABASE_URL });
 const migration = new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL });
 const users = { owner: randomUUID(), other: randomUUID(), member: randomUUID(), admin: randomUUID() };
 const tokens = { owner: randomUUID(), other: randomUUID(), member: randomUUID(), admin: randomUUID() };
 const ids = Object.fromEntries(tables.map(t => [t, randomUUID()])) as Record<typeof tables[number], string>;
 let a = "", b = "";
 async function context(c: PoolClient, token: string, org: string, grant: string | null = null) { await c.query("SELECT tony_security.open_context($1,$2::uuid,$3::text)", [token,org,grant]); }
 async function tx<T>(token: string | null, org: string, run: (c: PoolClient) => Promise<T>, commit = false, grant: string | null = null) {
  const c = await app.connect(); await c.query("BEGIN");
  try { if (token) await context(c,token,org,grant); const result = await run(c); await c.query(commit ? "COMMIT" : "ROLLBACK"); return result; }
  catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
 }
 async function insert(c: PoolClient, table: typeof tables[number], org: string, id = ids[table]) {
  const values: Record<typeof table, { fields: string; data: unknown[] }> = {
   contact: { fields: 'name,phone', data: ["Synthetic CRM", "+33123456789"] },
   service_template: { fields: 'name,currency', data: ["Synthetic service", "EUR"] },
   opportunity: { fields: 'title,"contactId","serviceTemplateId"', data: ["Synthetic opportunity", ids.contact,ids.service_template] },
   task: { fields: 'title,"opportunityId"', data: ["Synthetic task",ids.opportunity] },
  };
  const v = values[table];
  return c.query(`INSERT INTO ${table} ("organizationId",id,${v.fields}) VALUES ($1,$2,${v.data.map((_,i)=>`$${i+3}`).join(",")}) RETURNING *`, [org,id,...v.data]);
 }
 async function setup() {
  for (const [key,id] of Object.entries(users)) {
   await auth.query('INSERT INTO auth_user (id,name,email,"emailVerified","createdAt","updatedAt","platformRole","twoFactorEnabled") VALUES ($1,\'Synthetic CRM\',$2,true,now(),now(),$3,$4)', [id,`${id}@example.invalid`, key === "admin" ? "PLATFORM_ADMIN" : "USER",key === "admin"]);
   await auth.query('INSERT INTO auth_session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 day\',now())', [randomUUID(),tokens[key as keyof typeof tokens],id]);
  }
  a = (await app.query("SELECT tony_security.create_organization($1,'CRM A','fr-FR','EUR','Europe/Paris') AS id",[tokens.owner])).rows[0].id;
  b = (await app.query("SELECT tony_security.create_organization($1,'CRM B','fr-FR','EUR','America/New_York') AS id",[tokens.other])).rows[0].id;
  await migration.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'MEMBER\')',[randomUUID(),a,users.member]);
  for (const [token,org] of [[tokens.owner,a],[tokens.other,b]]) await tx(token!,org!,async c=> { for (const table of tables) await insert(c,table,org!); },true);
 }
 return { app,auth,migration,users,tokens,ids,context,tx,insert,setup,get a(){return a;},get b(){return b;},close:()=>Promise.all([app.end(),auth.end(),migration.end()]) };
}
