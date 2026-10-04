import "dotenv/config";
import { randomUUID } from "node:crypto";
import { beforeAll,afterAll,describe,it,expect } from "vitest";
import { crmFixture,tables } from "./fixtures/crm";
const f=crmFixture(); beforeAll(()=>f.setup()); afterAll(()=>f.close());
describe("CRM direct runtime SQL boundary",()=> {
 it.each(tables)("%s ENABLE/FORCE RLS non-owner and identity has no privileges",async table=> {
  const r=await f.app.query("SELECT relrowsecurity,relforcerowsecurity,relowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owner FROM pg_class WHERE oid=$1::regclass",[table]);
  expect(r.rows).toEqual([{relrowsecurity:true,relforcerowsecurity:true,owner:false}]);
  await expect(f.auth.query(`SELECT * FROM ${table}`)).rejects.toMatchObject({code:"42501"});
 });
 it.each(tables)("%s no context/GUC does not authorize SELECT or INSERT",async table=> {
  await f.tx(null,f.a,async c=> {await c.query("SELECT set_config('app.organization_id',$1,true)",[f.a]);expect((await c.query(`SELECT * FROM ${table}`)).rows).toEqual([]);});
  await expect(f.tx(null,f.a,c=>f.insert(c,table,f.a,randomUUID()))).rejects.toMatchObject({code:"42501"});
 });
 it.each(tables)("%s A cannot select/update/delete/insert B, B unchanged",async table=> {
  const before=await f.tx(f.tokens.other,f.b,c=>c.query(`SELECT * FROM ${table}`));
  await f.tx(f.tokens.owner,f.a,async c=> {
   expect((await c.query(`SELECT * FROM ${table} WHERE "organizationId"=$1`,[f.b])).rows).toEqual([]);
   expect((await c.query(`UPDATE ${table} SET version=version+1 WHERE "organizationId"=$1`,[f.b])).rowCount).toBe(0);
   expect((await c.query(`DELETE FROM ${table} WHERE "organizationId"=$1`,[f.b])).rowCount).toBe(0);
  });
  await expect(f.tx(f.tokens.owner,f.a,c=>f.insert(c,table,f.b,randomUUID()))).rejects.toMatchObject({code:"42501"});
  expect((await f.tx(f.tokens.other,f.b,c=>c.query(`SELECT * FROM ${table}`))).rows).toEqual(before.rows);
 });
 it.each(tables)("%s MEMBER reads but all mutations denied",async table=> {
  await f.tx(f.tokens.member,f.a,async c=> {
   expect((await c.query(`SELECT * FROM ${table}`)).rows).toHaveLength(1);
   expect((await c.query(`UPDATE ${table} SET version=version+1`)).rowCount).toBe(0);
   expect((await c.query(`DELETE FROM ${table}`)).rowCount).toBe(0);
  });
  await expect(f.tx(f.tokens.member,f.a,c=>f.insert(c,table,f.a,randomUUID()))).rejects.toMatchObject({code:"42501"});
 });
 it.each(tables)("%s admin grant adds no CRM rights",async table=> {
  const grant=(await f.app.query("SELECT tony_security.authorize_admin_access($1,$2::uuid,'Synthetic CRM inspection') AS id",[f.tokens.admin,f.a])).rows[0].id;
  await f.tx(f.tokens.admin,f.a,async c=> {
   expect((await c.query(`SELECT * FROM ${table}`)).rows).toEqual([]);
   expect((await c.query(`UPDATE ${table} SET version=version+1`)).rowCount).toBe(0);
   expect((await c.query(`DELETE FROM ${table}`)).rowCount).toBe(0);
  },false,grant);
  await expect(f.tx(f.tokens.admin,f.a,c=>f.insert(c,table,f.a,randomUUID()),false,grant)).rejects.toMatchObject({code:"42501"});
 });
 it.each(tables)("%s immutable IDs and version concurrency",async table=> {
  await expect(f.tx(f.tokens.owner,f.a,c=>c.query(`UPDATE ${table} SET id=$1`,[randomUUID()]))).rejects.toMatchObject({code:"23514"});
  await f.tx(f.tokens.owner,f.a,async c=> {
   expect((await c.query(`UPDATE ${table} SET version=version+1 WHERE version=1`)).rowCount).toBe(1);
   expect((await c.query(`UPDATE ${table} SET version=version+1 WHERE version=1`)).rowCount).toBe(0);
  });
 });
 it("composite FK refuses foreign parents and deletes restrict",async()=> {
  const foreign=randomUUID();
  await f.tx(f.tokens.other,f.b,c=>c.query('INSERT INTO contact ("organizationId",id,name,phone) VALUES ($1,$2,\'Foreign\',\'+33999999999\')',[f.b,foreign]),true);
  await expect(f.tx(f.tokens.owner,f.a,c=>c.query('UPDATE opportunity SET "contactId"=$1 WHERE id=$2',[foreign,f.ids.opportunity]))).rejects.toMatchObject({code:"23503"});
  await expect(f.tx(f.tokens.owner,f.a,c=>c.query('DELETE FROM contact WHERE id=$1',[f.ids.contact]))).rejects.toMatchObject({code:"23503"});
 });
 it("constraints reject invalid phone, status, amounts and completion",async()=> {
  for(const sql of ["UPDATE contact SET phone='raw'","UPDATE opportunity SET status='INVALID'","UPDATE service_template SET \"minAmountMinor\"=100,\"maxAmountMinor\"=10","UPDATE task SET status='DONE'"])
   await expect(f.tx(f.tokens.owner,f.a,c=>c.query(sql))).rejects.toMatchObject({code:"23514"});
 });
 it("audits runtime CRUD atomically with no business PII",async()=> {
  const id=randomUUID();
  await f.tx(f.tokens.owner,f.a,async c=> {
   await c.query('INSERT INTO contact ("organizationId",id,name,phone) VALUES ($1,$2,\'SECRET_SYNTHETIC\',\'+33888888888\')',[f.a,id]);
   await c.query('UPDATE contact SET name=\'Changed\',version=version+1 WHERE id=$1',[id]);
   await c.query('DELETE FROM contact WHERE id=$1',[id]);
   const rows=(await c.query('SELECT * FROM audit_log WHERE "targetId"=$1',[id])).rows;
   expect(rows.map(r=>r.event).sort()).toEqual(["CONTACT_CREATED","CONTACT_DELETED","CONTACT_UPDATED"]);
   expect(rows.every(r=>r.actorId===f.users.owner&&r.organizationId===f.a)).toBe(true);
   expect(JSON.stringify(rows)).not.toContain("SECRET_SYNTHETIC");expect(JSON.stringify(rows)).not.toContain("+33888888888");
  });
  expect((await f.migration.query('SELECT * FROM audit_log WHERE "targetId"=$1',[id])).rows).toEqual([]);
 });
 it("revoked session loses established CRM context",async()=> {
  const token=randomUUID(),sid=randomUUID(); await f.auth.query('INSERT INTO auth_session (id,token,"userId","expiresAt","updatedAt") VALUES ($1,$2,$3,now()+interval \'1 hour\',now())',[sid,token,f.users.owner]);
  await f.tx(token,f.a,async c=> {await f.auth.query('DELETE FROM auth_session WHERE id=$1',[sid]); for(const table of tables) expect((await c.query(`SELECT * FROM ${table}`)).rows).toEqual([]);});
 });
});
