import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { z } from "zod";
import type { LiveBinding } from "./live-binding";
import type { LiveEvent } from "./live-webhook";
import { LiveTwilioProvider } from "./live-provider";
import { AmbiguousEffect, ProviderRejected } from "./provider";
import type { Route } from "./webhook";
const campaign = "live-poc-v1";
const terminal = new Set(["completed", "busy", "no-answer", "failed", "canceled", "delivered", "undelivered", "deleted", "absent", "received"]);
const actionSchema = z.object({ id: z.string().uuid(), kind: z.enum(["CALL", "SMS", "RECORD"]), slot: z.enum(["T1", "T2"]), callSid: z.string().regex(/^CA[0-9a-f]{32}$/).optional(), audibleReminderConfirmed: z.literal(true).optional() }).strict();
type Row = { id: string; kind: string; origin: string; resource: string | null; parent_resource: string | null; action_slot: "T1" | "T2"; state: string; status: string | null; sequence: number | null; audio_status: string | null; delete_confirmed: boolean; attempts: number; deadline: Date | null; version: number };
export class LivePocRepository {
  #binding: LiveBinding;
  constructor(private readonly pool: Pool, binding: LiveBinding, private readonly now = () => Date.now(), private readonly timeoutMs = 5000) { this.#binding = binding; if (timeoutMs < 1 || timeoutMs > 5000) throw new Error("INVALID_TIMEOUT"); }
  private get account() { return this.#binding.manifest.accountSid; }
  private async tx<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try { await client.query("BEGIN"); await client.query("SELECT pg_advisory_xact_lock(5015)"); const result = await work(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  private async bounded<T>(promise: Promise<T>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new AmbiguousEffect()), this.timeoutMs); })]); } finally { clearTimeout(timer); }
  }
  private async row(client: PoolClient, resource: string) { return (await client.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND resource=$3 FOR UPDATE', [this.account, campaign, resource])).rows[0]; }
  private async open(client: PoolClient) {
    if (this.now() < Date.parse(this.#binding.manifest.startsAt) || this.now() >= Date.parse(this.#binding.manifest.endsAt)) throw new Error("CAMPAIGN_CLOSED");
    const number = await this.row(client, this.#binding.manifest.numberSid);
    if (!number || number.kind !== "NUMBER" || number.state !== "ACCEPTED") throw new Error("CAMPAIGN_CLOSED");
  }
  async bindNumber() {
    // Called only after a separate provider/Console preflight, never purchases or routes a number.
    return this.tx(async client => {
      const existing = await client.query<Row>('SELECT * FROM "PocOperation" WHERE kind=\'NUMBER\'');
      if (existing.rowCount) {
        const row = existing.rows[0]; if (existing.rowCount !== 1 || row?.resource !== this.#binding.manifest.numberSid || row.state !== "ACCEPTED") throw new Error("REGISTRY_BINDING_MISMATCH"); return;
      }
      const count = await client.query('SELECT id FROM "PocOperation" LIMIT 1'); if (count.rowCount) throw new Error("REGISTRY_BINDING_MISMATCH");
      await client.query('INSERT INTO "PocOperation"(id,account,campaign,kind,state,resource,reserved_cents) VALUES($1,$2,$3,\'NUMBER\',\'ACCEPTED\',$4,$5)', [randomUUID(), this.account, campaign, this.#binding.manifest.numberSid, this.#binding.fixedCostCents]);
    });
  }
  private async reserve(client: PoolClient, kind: "CALL" | "SMS" | "RECORD", origin: "OPERATOR" | "INBOUND" | "DIAL", slot: "T1" | "T2", id: string, resource: string | null = null, parent: string | null = null) {
    await this.open(client);
    const duplicate = await client.query('SELECT id FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND id=$3', [this.account, campaign, id]); if (duplicate.rowCount) throw new Error("ALREADY_RESERVED");
    const rows = await client.query<{ kind: string; origin: string; reserved_cents: number; audio_status: string | null }>('SELECT kind,origin,reserved_cents,audio_status FROM "PocOperation" WHERE account=$1 AND campaign=$2', [this.account, campaign]);
    const matching = rows.rows.filter(row => row.kind === kind && (kind === "CALL" ? (origin === "INBOUND" ? row.origin === "INBOUND" : row.origin !== "INBOUND") : row.origin === origin));
    const limit = kind === "CALL" ? origin === "INBOUND" ? this.#binding.manifest.inboundLimit : this.#binding.manifest.outboundSegmentLimit : kind === "SMS" ? origin === "INBOUND" ? 2 : this.#binding.manifest.smsSegmentLimit : this.#binding.manifest.recordingLimit;
    if (matching.length >= limit) throw new Error("QUOTA");
    if (kind === "RECORD" && rows.rows.some(row => row.audio_status === "PENDING" || row.audio_status === "DELETE_FAILED")) throw new Error("CLEANUP_REQUIRED");
    const cost = kind === "SMS" ? this.#binding.smsReserveCents : kind === "RECORD" ? this.#binding.recordingReserveCents : this.#binding.callReserveCents;
    if (rows.rows.reduce((sum, row) => sum + row.reserved_cents, 0) + cost > this.#binding.manifest.maximumBudgetCents) throw new Error("BUDGET");
    const now = new Date(this.now());
    await client.query('INSERT INTO "PocOperation"(id,account,campaign,kind,state,origin,resource,parent_resource,action_slot,reserved_cents,audio_status,deadline,stop_deadline,created_at) VALUES($1,$2,$3,$4,\'UNKNOWN\',$5,$6,$7,$8,$9,$10,$11,$12,$13)', [id, this.account, campaign, kind, origin, resource, parent, slot, cost, kind === "RECORD" ? "PENDING" : null, kind === "RECORD" ? new Date(this.now() + 900000) : null, kind === "RECORD" ? new Date(this.now() + 10000) : null, now]);
  }
  async execute(input: unknown, provider: LiveTwilioProvider) {
    const action = actionSchema.parse(input), target = this.#binding.testers.find(t => t.slot === action.slot);
    if (!target) throw new Error("FORBIDDEN");
    if (action.kind === "RECORD" && (!action.callSid || !action.audibleReminderConfirmed || !this.#binding.testers.every(t => t.audioConsent))) throw new Error("AUDIO_CONSENT_REQUIRED");
    if (action.kind !== "RECORD" && (action.callSid || action.audibleReminderConfirmed)) throw new Error("INVALID_COMMAND");
    await this.tx(async client => {
      if (action.callSid) {
        const call = await this.row(client, action.callSid);
        if (!call || call.kind !== "CALL" || call.origin !== "OPERATOR" || call.action_slot !== action.slot) throw new Error("FORBIDDEN");
      }
      await this.reserve(client, action.kind, "OPERATOR", action.slot, action.id, null, action.callSid ?? null);
    });
    const bound = provider.forAction(action.slot, action.callSid);
    try {
      const effect = await this.bounded(action.kind === "CALL" ? bound.makeOutboundCall() : action.kind === "SMS" ? bound.sendSms() : bound.startRecording());
      const updated = await this.pool.query('UPDATE "PocOperation" SET resource=$1,state=\'ACCEPTED\',version=version+1 WHERE account=$2 AND campaign=$3 AND id=$4 AND (resource IS NULL OR resource=$1)', [effect.resource, this.account, campaign, action.id]);
      if (!updated.rowCount) throw new Error("RESOURCE_COLLISION"); return effect;
    } catch (error) {
      await this.pool.query('UPDATE "PocOperation" SET state=$1,version=version+1 WHERE account=$2 AND campaign=$3 AND id=$4', [error instanceof ProviderRejected ? "FAILED" : "UNKNOWN", this.account, campaign, action.id]);
      throw new Error(error instanceof ProviderRejected ? "EFFECT_FAILED" : "UNKNOWN");
    }
  }
  async receive(route: Route, event: LiveEvent) {
    if (event.account !== this.account) throw new Error("FORBIDDEN");
    if (this.now() >= Date.parse(this.#binding.manifest.endsAt) && route !== "recording-status") throw new Error("CAMPAIGN_CLOSED");
    return this.tx(async client => {
      let row = await this.row(client, event.resource);
      if (!row && (route === "voice" || event.inboundSms)) {
        if (!event.caller) throw new Error("FORBIDDEN");
        await this.reserve(client, event.inboundSms ? "SMS" : "CALL", "INBOUND", event.caller, randomUUID(), event.resource);
        row = await this.row(client, event.resource);
        if (!event.inboundSms) {
          const count = await client.query<{ count: string }>('SELECT count(*) FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND origin=\'INBOUND\' AND kind=\'CALL\'', [this.account, campaign]);
          if (Number(count.rows[0]?.count) <= 3) {
            const other = this.#binding.testers.find(t => t.slot !== event.caller); if (!other) throw new Error("FORBIDDEN");
            await this.reserve(client, "CALL", "DIAL", other.slot, randomUUID(), null, event.resource);
          }
        }
      }
      if (!row && event.parent && (route === "dial-result" || route === "call-status" || route === "recording-status")) {
        const parent = await this.row(client, event.parent); if (!parent || parent.kind !== "CALL") throw new Error("FORBIDDEN");
        const candidate = await client.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND parent_resource=$3 AND kind=$4 AND resource IS NULL FOR UPDATE', [this.account, campaign, event.parent, route === "recording-status" ? "RECORD" : "CALL"]);
        if (candidate.rowCount !== 1) throw new Error("FORBIDDEN");
        await client.query('UPDATE "PocOperation" SET resource=$1,version=version+1 WHERE id=$2 AND account=$3 AND campaign=$4', [event.resource, candidate.rows[0]!.id, this.account, campaign]); row = await this.row(client, event.resource);
      }
      if (!row || (event.parent !== null && event.parent !== row.parent_resource)) throw new Error("FORBIDDEN");
      if (route === "voice" && (row.origin !== "INBOUND" || row.action_slot !== event.caller)) throw new Error("FORBIDDEN");
      if ((route === "message-status" && row.kind !== "SMS") || (route === "recording-status" && row.kind !== "RECORD") || (["voice", "dial-result", "call-status"].includes(route) && row.kind !== "CALL")) throw new Error("FORBIDDEN");
      if (route === "dial-result" && row.origin !== "DIAL") throw new Error("FORBIDDEN");
      const key = `${route}:${event.resource}:${event.sequence ?? event.status}`;
      const inserted = await client.query('INSERT INTO "PocWebhookReceipt"(account,campaign,operation_id,event_key,route,resource,status,sequence,parent_resource) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING RETURNING event_key', [this.account, campaign, row.id, key, route, event.resource, event.status, event.sequence, event.parent]);
      if (!inserted.rowCount) {
        const previous = await client.query('SELECT status,parent_resource FROM "PocWebhookReceipt" WHERE account=$1 AND campaign=$2 AND event_key=$3', [this.account, campaign, key]);
        if (previous.rows[0]?.status !== event.status || previous.rows[0]?.parent_resource !== event.parent) throw new Error("COLLISION");
      } else if (!terminal.has(row.status ?? "") && (event.sequence === null || row.sequence === null || event.sequence > row.sequence)) {
        await client.query('UPDATE "PocOperation" SET status=$1,sequence=$2,version=version+1 WHERE account=$3 AND campaign=$4 AND id=$5', [event.status, event.sequence, this.account, campaign, row.id]);
      }
      if (route === "voice") {
        await this.open(client);
        const dial = await client.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND parent_resource=$3 AND origin=\'DIAL\'', [this.account, campaign, event.resource]);
        const target = this.#binding.testers.find(t => t.slot === dial.rows[0]?.action_slot);
        if (target) return `<Response><Dial timeout="5" timeLimit="45" action="${this.#binding.manifest.publicOrigin}/poc/webhooks/twilio/dial-result" method="POST"><Number statusCallback="${this.#binding.manifest.publicOrigin}/poc/webhooks/twilio/call-status" statusCallbackMethod="POST" statusCallbackEvent="completed">${target.phone}</Number></Dial><Hangup/></Response>`;
      }
      return "<Response><Hangup/></Response>";
    });
  }
  async stop() { await this.pool.query('UPDATE "PocOperation" SET state=\'FAILED\',version=version+1 WHERE account=$1 AND campaign=$2 AND kind=\'NUMBER\'', [this.account, campaign]); }
  async emergencyStop(provider: LiveTwilioProvider) {
    await this.stop();
    const rows = await this.pool.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND kind=\'CALL\' AND (status IS NULL OR status NOT IN (\'completed\',\'busy\',\'no-answer\',\'failed\',\'canceled\'))', [this.account, campaign]);
    const known = new Set(rows.rows.flatMap(row => [row.resource, row.parent_resource]).filter((sid): sid is string => !!sid));
    let failures = rows.rows.some(row => !row.resource && !row.parent_resource);
    for (const sid of known) { try { await this.bounded(provider.endCall(sid)); } catch { failures = true; } }
    if (failures) throw new Error("MANUAL_EMERGENCY_STOP_REQUIRED");
  }
  async reconcile(id: string, provider: LiveTwilioProvider) {
    const parsed = z.string().uuid().parse(id), result = await this.pool.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND id=$3', [this.account, campaign, parsed]);
    const row = result.rows[0]; if (!row?.resource) throw new Error("MANUAL_RECONCILIATION_REQUIRED");
    if (row.kind !== "CALL" || row.origin !== "OPERATOR") throw new Error("UNSUPPORTED_RECONCILIATION");
    const observed = await this.bounded(provider.forAction(row.action_slot).getCall(row.resource));
    const updated = await this.pool.query('UPDATE "PocOperation" SET status=$1,state=$2,version=version+1 WHERE account=$3 AND campaign=$4 AND id=$5 AND version=$6', [observed.status, terminal.has(observed.status) ? "COMPLETE" : row.state, this.account, campaign, row.id, row.version]);
    if (!updated.rowCount) throw new Error("CONFLICT");
  }
  async cleanup(provider: LiveTwilioProvider, closing = false) {
    const pending = await this.pool.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND audio_status IN (\'PENDING\',\'DELETE_FAILED\')', [this.account, campaign]);
    let failures = 0, waiting = 0;
    for (const row of pending.rows) {
      const client = await this.pool.connect();
      try {
        await client.query("SELECT pg_advisory_lock(hashtextextended($1,5016))", [row.id]);
        const current = (await client.query<Row>('SELECT * FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND id=$3', [this.account, campaign, row.id])).rows[0]!;
        if (current.audio_status === "DELETED") continue;
        if (!current.resource && current.deadline && current.deadline.getTime() >= this.now() && !closing) { waiting++; continue; }
        if (!current.resource || !current.parent_resource || current.attempts >= 3 || !current.deadline || current.deadline.getTime() < this.now()) {
          await client.query('UPDATE "PocOperation" SET audio_status=\'DELETE_FAILED\' WHERE id=$1 AND account=$2 AND campaign=$3', [row.id, this.account, campaign]); failures++; continue;
        }
        await client.query('UPDATE "PocOperation" SET attempts=attempts+1 WHERE id=$1 AND account=$2 AND campaign=$3', [row.id, this.account, campaign]);
        const bound = provider.forAction(current.action_slot, current.parent_resource);
        try {
          // A call already ended can make REST stop fail; DELETE still must be attempted and proved.
          try { await this.bounded(bound.stopRecording(current.resource)); } catch { /* deletion remains required */ }
          const proof = await this.bounded(current.delete_confirmed ? bound.verifyDeletionAfterConfirmedDelete(current.resource) : bound.deleteRecording(current.resource));
          const valid = proof.confirmed && proof.providerDeleted !== false && proof.mediaUnavailable && proof.authenticated && current.deadline.getTime() >= this.now();
          await client.query('UPDATE "PocOperation" SET audio_status=$1,delete_confirmed=$2,provider_deleted=$3,media_unavailable=$4,version=version+1 WHERE account=$5 AND campaign=$6 AND id=$7', [valid ? "DELETED" : "DELETE_FAILED", proof.confirmed, proof.providerDeleted, proof.mediaUnavailable && proof.authenticated, this.account, campaign, row.id]); if (!valid) failures++;
        } catch { await client.query('UPDATE "PocOperation" SET audio_status=\'DELETE_FAILED\' WHERE account=$1 AND campaign=$2 AND id=$3', [this.account, campaign, row.id]); failures++; }
      } finally { try { await client.query("SELECT pg_advisory_unlock(hashtextextended($1,5016))", [row.id]); } finally { client.release(); } }
    }
    if (failures) throw new Error("CLEANUP_REQUIRED");
    if (waiting) throw new Error("CLEANUP_PENDING_RECONCILIATION");
  }
}
