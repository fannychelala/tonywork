import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import { livePrivateFixture } from "./live-fixtures";
import { parseLiveBinding } from "../live-binding";
import { bindLiveMigration } from "../live-schema";
import { LivePocRepository } from "../live-repository";
import { LiveTwilioProvider, type LiveRequest } from "../live-provider";
import type { LiveEvent } from "../live-webhook";
const url = process.env.POC_LIVE_TEST_DATABASE_URL ?? "postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5556/tony_poc";
const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 2000 });
const migrator = new Pool({ connectionString: url.replace("tony_poc_runtime:synthetic_poc_runtime_only", "tony_poc_migrator:synthetic_poc_migrator_only"), connectionTimeoutMillis: 2000 });
const binding = parseLiveBinding(livePrivateFixture()), now = () => Date.parse(binding.manifest.startsAt) + 1000;
const repository = () => new LivePocRepository(pool, binding, now);
const incoming = (resource = "CA" + "8".repeat(32)): LiveEvent => ({ account: binding.manifest.accountSid, resource, parent: null, status: "ringing", sequence: null, caller: "T1", inboundSms: false });
function syntheticProvider() {
  let counter = 1;
  const requests: LiveRequest[] = [], targets = new Map<string, string>();
  const provider = new LiveTwilioProvider(binding, async request => {
    requests.push(request);
    if (request.method === "POST" && /Calls.json$/.test(request.path)) { const sid = "CA" + String(counter++).padStart(32, "0"); targets.set(sid, request.data!.To!); return { status: 201, body: { sid } }; }
    if (request.method === "POST" && /Messages.json$/.test(request.path)) return { status: 201, body: { sid: "SM" + String(counter++).padStart(32, "0") } };
    if (request.method === "POST" && /Recordings.json$/.test(request.path)) return { status: 201, body: { sid: "RE" + String(counter++).padStart(32, "0") } };
    if (request.method === "GET" && /\/Calls\/CA/.test(request.path)) { const sid = request.path.match(/CA[0-9a-f]{32}\.json$/)![0].slice(0, -5); return { status: 200, body: { sid, account_sid: binding.manifest.accountSid, to: targets.get(sid), from: binding.number, direction: "outbound-api", status: "in-progress" } }; }
    if (request.method === "DELETE") return { status: 204, body: null };
    if (request.method === "GET" && /Recordings\//.test(request.path)) return { status: 200, body: { sid: request.path.match(/RE[0-9a-f]{32}/)![0], status: "deleted" } };
    return { status: 200, body: null };
  }, async () => ({ status: 404, authenticated: true }));
  return { provider, requests };
}
beforeAll(async () => { await migrator.query(bindLiveMigration(readFileSync("experiments/telephony-poc/sql/002-live-preparation.sql", "utf8"), binding.manifest.accountSid)); });
beforeEach(async () => { await migrator.query('TRUNCATE "PocWebhookReceipt", "PocOperation"'); await repository().bindNumber(); });
afterAll(async () => { await pool.end(); await migrator.end(); });
describe("LIVE rehearsal on a separate real PostgreSQL", () => {
  it("retains exactly two tables and restricted runtime ownership", async () => {
    const tables = await pool.query("SELECT tablename,tableowner FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
    expect(tables.rows).toEqual([{ tablename: "PocOperation", tableowner: "tony_poc_migrator" }, { tablename: "PocWebhookReceipt", tableowner: "tony_poc_migrator" }]);
    const roles = await pool.query("SELECT rolsuper,rolbypassrls,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=current_user"); expect(roles.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false, rolcreaterole: false, rolcreatedb: false });
  });
  it.each(['UPDATE "PocOperation" SET origin=\'INBOUND\'', 'UPDATE "PocOperation" SET parent_resource=NULL', 'UPDATE "PocOperation" SET reserved_cents=0', 'UPDATE "PocOperation" SET action_slot=\'T2\'', 'UPDATE "PocOperation" SET stop_deadline=now()', 'DELETE FROM "PocOperation"', 'UPDATE "PocWebhookReceipt" SET parent_resource=NULL', 'CREATE TABLE forbidden_live(id int)', 'SET ROLE tony_poc_migrator'])("rejects immutable/privileged SQL %s", async query => { await expect(pool.query(query)).rejects.toThrow(); });
  it("rejects a different account, campaign and nonexistent parent directly in SQL", async () => {
    const insert = 'INSERT INTO "PocOperation"(id,account,campaign,kind,state) VALUES($1,$2,$3,\'CALL\',\'UNKNOWN\')';
    await expect(pool.query(insert, [randomUUID(), "AC" + "0".repeat(32), "live-poc-v1"])).rejects.toThrow();
    await expect(pool.query(insert, [randomUUID(), binding.manifest.accountSid, "synthetic-local-v1"])).rejects.toThrow();
    await expect(pool.query('INSERT INTO "PocOperation"(id,account,campaign,kind,state,origin,parent_resource) VALUES($1,$2,\'live-poc-v1\',\'CALL\',\'UNKNOWN\',\'DIAL\',$3)', [randomUUID(), binding.manifest.accountSid, "CA" + "9".repeat(32)])).rejects.toThrow();
  });
  it("prevents rebinding an already known resource even with runtime UPDATE permission", async () => {
    await expect(pool.query('UPDATE "PocOperation" SET resource=$1 WHERE kind=\'NUMBER\'', ["PN" + "9".repeat(32)])).rejects.toThrow("RESOURCE_IMMUTABLE");
  });
  it("reserves once before effects under eight concurrent submissions", async () => {
    const { provider, requests } = syntheticProvider(), command = { id: randomUUID(), kind: "CALL", slot: "T1" };
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => repository().execute(command, provider)));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1); expect(requests.filter(r => r.method === "POST")).toHaveLength(1);
  });
  it("enforces five outgoing segments across both Dial and operator calls", async () => {
    const { provider } = syntheticProvider();
    for (const digit of ["7", "8", "9"]) await repository().receive("voice", incoming("CA" + digit.repeat(32)));
    const results = await Promise.allSettled(Array.from({ length: 3 }, () => repository().execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider)));
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(2);
    expect((await pool.query('SELECT count(*)::int AS n FROM "PocOperation" WHERE kind=\'CALL\' AND origin<>\'INBOUND\'')).rows[0].n).toBe(5);
  });
  it("replays incoming TwiML after a repository restart without reserving another Dial", async () => {
    const first = await repository().receive("voice", incoming());
    const responses = await Promise.all(Array.from({ length: 8 }, () => repository().receive("voice", incoming())));
    expect(first).toContain("<Dial"); expect(responses.every(xml => xml === first)).toBe(true);
    expect((await pool.query('SELECT count(*)::int AS n FROM "PocOperation" WHERE origin=\'DIAL\'')).rows[0].n).toBe(1);
    expect((await pool.query('SELECT count(*)::int AS n FROM "PocWebhookReceipt"')).rows[0].n).toBe(1);
  });
  it("correlates a child and refuses a second child for the same parent", async () => {
    const parent = incoming(); await repository().receive("voice", parent);
    const child: LiveEvent = { ...parent, resource: "CA" + "6".repeat(32), parent: parent.resource, status: "no-answer", caller: null };
    await repository().receive("dial-result", child);
    expect((await pool.query('SELECT parent_resource,status FROM "PocOperation" WHERE origin=\'DIAL\'')).rows[0]).toEqual({ parent_resource: parent.resource, status: "no-answer" });
    await expect(repository().receive("dial-result", { ...child, resource: "CA" + "5".repeat(32) })).rejects.toThrow("FORBIDDEN");
  });
  it("does not infer a successful Dial from a completed parent", async () => {
    const parent = incoming(); await repository().receive("voice", parent); await repository().receive("call-status", { ...parent, caller: null, status: "completed" });
    expect((await pool.query('SELECT status FROM "PocOperation" WHERE origin=\'DIAL\'')).rows[0].status).toBeNull();
  });
  it("preserves UNKNOWN across restart and never recreates a timed-out call", async () => {
    let effects = 0; const provider = new LiveTwilioProvider(binding, async () => { effects++; return new Promise(() => {}); }, async () => ({ status: 404, authenticated: true }));
    const command = { id: randomUUID(), kind: "CALL", slot: "T1" }, repo = new LivePocRepository(pool, binding, now, 10);
    await expect(repo.execute(command, provider)).rejects.toThrow("UNKNOWN"); await expect(repository().execute(command, provider)).rejects.toThrow("ALREADY_RESERVED"); expect(effects).toBe(1);
    await expect(repository().reconcile(command.id, provider)).rejects.toThrow("MANUAL_RECONCILIATION_REQUIRED");
  });
  it("blocks calls after a durable stop and outside the window", async () => {
    const { provider } = syntheticProvider(); await repository().stop(); await expect(repository().execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider)).rejects.toThrow("CAMPAIGN_CLOSED");
    await expect(new LivePocRepository(pool, binding, () => 0).receive("voice", incoming())).rejects.toThrow("CAMPAIGN_CLOSED");
  });
  it("reserves the budget before an effect and never frees it after UNKNOWN", async () => {
    const tight = parseLiveBinding({ ...livePrivateFixture(), fixedCostCents: 4950 }), provider = syntheticProvider().provider;
    await migrator.query('TRUNCATE "PocWebhookReceipt", "PocOperation"'); const repo = new LivePocRepository(pool, tight, now); await repo.bindNumber();
    await expect(repo.execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider)).rejects.toThrow("BUDGET");
  });
  it("keeps audio cleanup durable, parent-bound and append-only without business PII", async () => {
    const { provider } = syntheticProvider(), repo = repository();
    const call = await repo.execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider);
    await expect(repo.execute({ id: randomUUID(), kind: "RECORD", slot: "T2", callSid: call.resource, audibleReminderConfirmed: true }, provider)).rejects.toThrow("FORBIDDEN");
    await repo.execute({ id: randomUUID(), kind: "RECORD", slot: "T1", callSid: call.resource, audibleReminderConfirmed: true }, provider);
    await repository().cleanup(provider); expect((await pool.query('SELECT audio_status,parent_resource FROM "PocOperation" WHERE kind=\'RECORD\'')).rows[0]).toEqual({ audio_status: "DELETED", parent_resource: call.resource });
    const names = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name IN ('PocOperation','PocWebhookReceipt')"); expect(names.rows.map(r => r.column_name).join(",")).not.toMatch(/phone|payload|body|secret|token|audio_bytes/);
  });
  it("limits received synthetic SMS to two and never creates a response effect", async () => {
    for (const digit of ["7", "8"]) await repository().receive("message-status", { ...incoming(), resource: "SM" + digit.repeat(32), status: "received", inboundSms: true });
    await expect(repository().receive("message-status", { ...incoming(), resource: "SM" + "9".repeat(32), status: "received", inboundSms: true })).rejects.toThrow("QUOTA");
    expect((await pool.query('SELECT count(*)::int AS n FROM "PocOperation" WHERE kind=\'SMS\' AND origin=\'OPERATOR\'')).rows[0].n).toBe(0);
  });
  it("rechecks a confirmed deletion after restart without a second DELETE", async () => {
    const { provider, requests } = syntheticProvider(), repo = repository();
    const call = await repo.execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider);
    await repo.execute({ id: randomUUID(), kind: "RECORD", slot: "T1", callSid: call.resource, audibleReminderConfirmed: true }, provider);
    let available = true;
    const checked = new LiveTwilioProvider(binding, async request => {
      requests.push(request);
      if (request.method === "DELETE") return { status: 204, body: null };
      return { status: 200, body: { sid: request.path.match(/RE[0-9a-f]{32}/)?.[0], status: "deleted" } };
    }, async () => ({ status: available ? 200 : 404, authenticated: true }));
    await expect(repo.cleanup(checked)).rejects.toThrow("CLEANUP_REQUIRED");
    expect((await pool.query('SELECT delete_confirmed,audio_status FROM "PocOperation" WHERE kind=\'RECORD\'')).rows[0]).toEqual({ delete_confirmed: true, audio_status: "DELETE_FAILED" });
    available = false; await repository().cleanup(checked);
    expect(requests.filter(request => request.method === "DELETE")).toHaveLength(1);
    expect((await pool.query('SELECT audio_status FROM "PocOperation" WHERE kind=\'RECORD\'')).rows[0].audio_status).toBe("DELETED");
  });
  it("retains an ambiguous audio obligation until a signed correlated callback arrives", async () => {
    const { provider } = syntheticProvider(), repo = repository();
    const call = await repo.execute({ id: randomUUID(), kind: "CALL", slot: "T1" }, provider);
    const id = randomUUID();
    await pool.query('INSERT INTO "PocOperation"(id,account,campaign,kind,state,parent_resource,action_slot,audio_status,deadline,stop_deadline,created_at) VALUES($1,$2,\'live-poc-v1\',\'RECORD\',\'UNKNOWN\',$3,\'T1\',\'PENDING\',$4,$5,$6)', [id, binding.manifest.accountSid, call.resource, new Date(now()+900000), new Date(now()+10000), new Date(now())]);
    await expect(repo.cleanup(provider)).rejects.toThrow("CLEANUP_PENDING_RECONCILIATION");
    await repo.stop();
    await repository().receive("recording-status", { account: binding.manifest.accountSid, resource: "RE"+"a".repeat(32), parent: call.resource, caller: null, inboundSms: false, status: "completed", sequence: null });
    await repository().cleanup(provider);
    expect((await pool.query('SELECT audio_status FROM "PocOperation" WHERE id=$1',[id])).rows[0].audio_status).toBe("DELETED");
  });
});
