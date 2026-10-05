import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { FAKE_ACCOUNT } from "../config";
import { PocRepository } from "../repository";
import { FakeTelephonyProvider } from "../provider";
import { createPocServer } from "../server";
import { SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE } from "./fixtures";
import twilio from "twilio";
import { BASE_URL, FAKE_SECRET } from "../config";
import { routes } from "../webhook";
import type { AddressInfo } from "node:net";
const url=process.env.POC_TEST_DATABASE_URL;
// No silent skip: SQL tests require a real isolated PostgreSQL instance.
const pool=new Pool({connectionString:url??"postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5545/tony_poc",connectionTimeoutMillis:2000});
const migrator=new Pool({connectionString:(url??"postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5545/tony_poc").replace("tony_poc_runtime:synthetic_poc_runtime_only","tony_poc_migrator:synthetic_poc_migrator_only")});
const repository=new PocRepository(pool);
const id=()=>randomUUID();
const event=(resource:string,status:"completed"|"ringing"="completed",sequence=3)=>({account:FAKE_ACCOUNT,resource,parent:null,status,sequence});
beforeAll(async()=>{await pool.query("SELECT 1");});
beforeEach(async()=>{await migrator.query('TRUNCATE "PocWebhookReceipt", "PocOperation"');});
afterAll(async()=>{await pool.end(); await migrator.end();});
describe("real POC PostgreSQL",()=>{
 it("runtime is non-owner and unprivileged",async()=>{const q=await pool.query("SELECT rolsuper,rolbypassrls,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=current_user");expect(q.rows[0]).toEqual({rolsuper:false,rolbypassrls:false,rolcreaterole:false,rolcreatedb:false});});
 it.each(['CREATE TABLE forbidden(id int)','TRUNCATE "PocOperation"','DELETE FROM "PocWebhookReceipt"','UPDATE "PocWebhookReceipt" SET status=\'failed\'','SET ROLE tony_poc_migrator'])("rejects SQL privilege violation %s",async sql=>{await expect(pool.query(sql)).rejects.toThrow();});
 it("rejects Tony roles at POC database authentication",async()=>{for(const role of ["tony_app","tony_auth"]){const foreign=new Pool({connectionString:(url??"postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5545/tony_poc").replace("tony_poc_runtime",role),connectionTimeoutMillis:1000});try{await expect(foreign.query("SELECT 1")).rejects.toThrow();}finally{await foreign.end();}}});
 it("reserves once under concurrency",async()=>{const fake=new FakeTelephonyProvider();const command={id:id(),kind:"CALL"};const results=await Promise.allSettled(Array.from({length:8},()=>repository.execute(command,fake)));expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);expect(fake.effects).toBe(1);});
 it("reserves quota before effects",async()=>{const fake=new FakeTelephonyProvider();const results=await Promise.allSettled(Array.from({length:10},()=>repository.execute({id:id(),kind:"SMS"},fake)));expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(5);expect(fake.effects).toBe(5);});
 it("never retries UNKNOWN, including repository restart",async()=>{const fake=new FakeTelephonyProvider();fake.ambiguous=true;const command={id:id(),kind:"CALL"};await expect(repository.execute(command,fake)).rejects.toThrow("UNKNOWN");await expect(new PocRepository(pool).execute(command,fake)).rejects.toThrow("ALREADY_RESERVED");expect(fake.effects).toBe(1);expect((await pool.query('SELECT state FROM "PocOperation"')).rows[0].state).toBe("UNKNOWN");await expect(repository.reconcile(command.id,fake)).rejects.toThrow("MANUAL");});
 it("deduplicates durable events after restart and concurrently",async()=>{const fake=new FakeTelephonyProvider();const effect=await repository.execute({id:id(),kind:"CALL"},fake);await Promise.all(Array.from({length:6},()=>repository.receive("call-status",event(effect.resource))));expect(await new PocRepository(pool).receive("call-status",event(effect.resource))).toBe("DUPLICATE");expect((await pool.query('SELECT count(*)::int AS count FROM "PocWebhookReceipt"')).rows[0].count).toBe(1);});
 it("does not regress terminal state on stale events",async()=>{const effect=await repository.execute({id:id(),kind:"CALL"},new FakeTelephonyProvider());await repository.receive("call-status",event(effect.resource));await repository.receive("call-status",event(effect.resource,"ringing",1));expect((await pool.query('SELECT status FROM "PocOperation"')).rows[0].status).toBe("completed");});
 it("rejects collisions without changing receipts",async()=>{const effect=await repository.execute({id:id(),kind:"CALL"},new FakeTelephonyProvider());await repository.receive("call-status",event(effect.resource));await expect(repository.receive("call-status",event(effect.resource,"ringing"))).rejects.toThrow("COLLISION");expect((await pool.query('SELECT status FROM "PocWebhookReceipt"')).rows[0].status).toBe("completed");});
 it("rejects unknown SID and foreign parent without mutation",async()=>{await expect(repository.receive("call-status",event("CA"+"f".repeat(32)))).rejects.toThrow("FORBIDDEN");expect((await pool.query('SELECT count(*)::int AS count FROM "PocWebhookReceipt"')).rows[0].count).toBe(0);});
 it.each([
  {confirmed:false,providerDeleted:true,mediaUnavailable:true,authenticated:true},
  {confirmed:true,providerDeleted:false,mediaUnavailable:true,authenticated:true},
  {confirmed:true,providerDeleted:true,mediaUnavailable:false,authenticated:true},
  {confirmed:true,providerDeleted:true,mediaUnavailable:true,authenticated:false},
 ])("blocks inconclusive deletion proof %j",async proof=>{const fake=new FakeTelephonyProvider();fake.deletion=proof;await repository.execute({id:id(),kind:"RECORD"},fake);await expect(repository.cleanup(fake)).rejects.toThrow("CLEANUP_REQUIRED");expect((await pool.query('SELECT audio_status FROM "PocOperation"')).rows[0].audio_status).toBe("DELETE_FAILED");await expect(repository.execute({id:id(),kind:"RECORD"},fake)).rejects.toThrow("CLEANUP_REQUIRED");});
 it.each([true,null])("deletes media while metadata remains; status exposed=%s",async providerDeleted=>{const fake=new FakeTelephonyProvider();fake.deletion.providerDeleted=providerDeleted;const effect=await repository.execute({id:id(),kind:"RECORD"},fake);await new PocRepository(pool).cleanup(fake);expect((await pool.query('SELECT audio_status FROM "PocOperation"')).rows[0].audio_status).toBe("DELETED");expect(fake.recordingMetadata.get(effect.resource)).toEqual({status:"deleted",mediaRecoverable:false});});
 it("retries cleanup after repository restart but never beyond three attempts",async()=>{const fake=new FakeTelephonyProvider();fake.deletion.confirmed=false;await repository.execute({id:id(),kind:"RECORD"},fake);for(let n=0;n<4;n++) await expect(new PocRepository(pool).cleanup(fake)).rejects.toThrow();expect((await pool.query('SELECT attempts FROM "PocOperation"')).rows[0].attempts).toBe(3);});
 it("SQL forbids asserting DELETED without required proof",async()=>{await repository.execute({id:id(),kind:"RECORD"},new FakeTelephonyProvider());await expect(pool.query('UPDATE "PocOperation" SET audio_status=\'DELETED\'')).rejects.toThrow();});
 it("cleanup deadline and unknown recording SID remain blocking",async()=>{
  const fake=new FakeTelephonyProvider();const op=id();await repository.execute({id:op,kind:"RECORD"},fake);
  await migrator.query(`UPDATE "PocOperation" SET deadline=now()-interval '1 minute',resource=NULL WHERE id=$1`,[op]);
  await expect(repository.cleanup(fake)).rejects.toThrow("CLEANUP_REQUIRED");expect((await pool.query('SELECT audio_status FROM "PocOperation"')).rows[0].audio_status).toBe("DELETE_FAILED");
 });
 it("concurrent cleanup does not double-delete a completed obligation",async()=>{
  const fake=new FakeTelephonyProvider();await repository.execute({id:id(),kind:"RECORD"},fake);let count=0;
  const original=fake.deleteRecording.bind(fake);fake.deleteRecording=async()=>{count++;return original();};
  await Promise.all([repository.cleanup(fake),new PocRepository(pool).cleanup(fake)]);expect(count).toBe(1);
 });
 it("rejects cross-campaign direct SQL and contains no payload storage columns",async()=>{
  await expect(pool.query('INSERT INTO "PocOperation" (id,account,campaign,kind,state) VALUES($1,$2,$3,$4,$5)',[id(),FAKE_ACCOUNT,"other-campaign","CALL","UNKNOWN"])).rejects.toThrow();
  const columns=await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name IN ('PocOperation','PocWebhookReceipt')");expect(columns.rows.map(r=>r.column_name).join(',')).not.toMatch(/phone|body|payload|secret|token|audio_bytes/);
 });
 it("bounded hung creation persists UNKNOWN and cannot be resubmitted",async()=>{
  const fake=new FakeTelephonyProvider();let calls=0;fake.makeOutboundCall=()=>{calls++;return new Promise(()=>{});};const command={id:id(),kind:"CALL"};const bounded=new PocRepository(pool,10);
  await expect(bounded.execute(command,fake)).rejects.toThrow("UNKNOWN");await expect(new PocRepository(pool).execute(command,fake)).rejects.toThrow("ALREADY_RESERVED");expect(calls).toBe(1);
 });
 it.each(routes)("HTTP route %s persists an authorized synthetic callback",async route=>{
  const fake=new FakeTelephonyProvider();const effect=await repository.execute({id:id(),kind:route==="message-status"?"SMS":route==="recording-status"?"RECORD":"CALL"},fake);
  const fields:Record<string,string>={AccountSid:FAKE_ACCOUNT};
  if(route==="message-status"){fields.MessageSid=effect.resource;fields.MessageStatus="delivered";}
  else if(route==="recording-status"){fields.RecordingSid=effect.resource;fields.RecordingStatus="completed";}
  else {fields.CallSid=effect.resource;if(route==="dial-result"){fields.DialCallStatus="no-answer";fields.CallStatus="completed";}else fields.CallStatus="completed";}
  const signature=twilio.getExpectedTwilioSignature(FAKE_SECRET,BASE_URL+"/poc/webhooks/twilio/"+route,fields);
  const server=createPocServer(repository);await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
  try {const response=await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/poc/webhooks/twilio/${route}`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","x-twilio-signature":signature},body:new URLSearchParams(fields).toString()});expect(response.status).toBe(route==="voice"||route==="dial-result"?200:204);
   expect((await pool.query('SELECT status FROM "PocWebhookReceipt"')).rows[0].status).toBe(route==="dial-result"?"no-answer":route==="message-status"?"delivered":"completed");expect(fake.effects).toBe(1);
  }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 });
 it("reconciliation reads known SID and persists a versioned result without creation",async()=>{
  const fake=new FakeTelephonyProvider();const op=id();await repository.execute({id:op,kind:"CALL"},fake);await repository.reconcile(op,fake);
  expect((await pool.query('SELECT state,status,version FROM "PocOperation"')).rows[0]).toEqual({state:"COMPLETE",status:"completed",version:3});expect(fake.effects).toBe(1);
 });
 it("quota is durably visible inside the first effect call",async()=>{
  const fake=new FakeTelephonyProvider();const op=id();const original=fake.makeOutboundCall.bind(fake);
  fake.makeOutboundCall=async()=>{expect((await pool.query('SELECT state FROM "PocOperation" WHERE id=$1',[op])).rows[0].state).toBe("UNKNOWN");return original();};
  await repository.execute({id:op,kind:"CALL"},fake);expect(fake.effects).toBe(1);
 });
 it("HTTP validates signature, persists before response, and never creates effects",async()=>{
  const fake=new FakeTelephonyProvider();const op=id();await repository.execute({id:op,kind:"CALL"},fake);
  await migrator.query('UPDATE "PocOperation" SET resource=$1 WHERE id=$2',["CA"+"1".repeat(32),op]);
  const server=createPocServer(repository);await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try{
   const request=(signature:string,body=SYNTHETIC_CALLBACK)=>fetch(base+"/poc/webhooks/twilio/call-status",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","x-twilio-signature":signature,"x-forwarded-host":"attacker","cookie":"organizationId=B"},body});
   expect((await request("bad")).status).toBe(403);
   const accepted=await request(SYNTHETIC_SIGNATURE);expect(accepted.status).toBe(204);expect(accepted.headers.get("cache-control")).toBe("no-store");
   expect((await request(SYNTHETIC_SIGNATURE)).status).toBe(204);expect(fake.effects).toBe(1);
   expect((await request(SYNTHETIC_SIGNATURE,SYNTHETIC_CALLBACK+"&organizationId=B")).status).toBe(403);
   expect((await pool.query('SELECT count(*)::int AS count FROM "PocWebhookReceipt"')).rows[0].count).toBe(1);
   const samples:number[]=[];
   for(let index=0;index<25;index++){const start=performance.now();expect((await request(SYNTHETIC_SIGNATURE)).status).toBe(204);samples.push(performance.now()-start);}
   samples.sort((a,b)=>a-b);console.log(JSON.stringify({measurement:"synthetic_webhook_sql_roundtrip",n:25,p50:samples[12],p95:samples[23],max:samples[24]}));expect(samples[23]).toBeLessThan(500);
  }finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 });
});
