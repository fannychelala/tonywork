import { Pool, type PoolClient } from "pg";
import { FAKE_ACCOUNT } from "./config";
import { type Command, type TelephonyProvider, AmbiguousEffect, ProviderRejected, commandSchema } from "./provider";
import { type Envelope, type Route } from "./webhook";
const campaign = "synthetic-local-v1";
const terminal = new Set(["completed", "busy", "no-answer", "failed", "canceled", "delivered", "undelivered", "deleted"]);
export class PocRepository {
  constructor(readonly pool: Pool, private readonly timeoutMs = 5000) {
    if (timeoutMs < 1 || timeoutMs > 5000) throw new Error("INVALID_TIMEOUT");
  }
  private async bounded<T>(work: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try { return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new AmbiguousEffect()), this.timeoutMs); })]); }
    finally { clearTimeout(timer); }
  }
  private async transaction<T>(run: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try { await client.query("BEGIN"); const result = await run(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  async execute(input: unknown, provider: TelephonyProvider) {
    const command = commandSchema.parse(input);
    const reserved = await this.reserve(command);
    if (!reserved) throw new Error("ALREADY_RESERVED");
    try {
      const effect = await this.bounded(command.kind === "CALL" ? provider.makeOutboundCall() : command.kind === "SMS" ? provider.sendSms() : command.kind === "RECORD" ? provider.startRecording() : provider.provisionNumber());
      await this.pool.query('UPDATE "PocOperation" SET state=$1,resource=$2,version=version+1 WHERE id=$3', ["ACCEPTED", effect.resource, command.id]);
      return effect;
    } catch (error) {
      await this.pool.query('UPDATE "PocOperation" SET state=$1,version=version+1 WHERE id=$2', [error instanceof ProviderRejected ? "FAILED" : "UNKNOWN", command.id]);
      throw new Error(error instanceof ProviderRejected ? "EFFECT_FAILED" : "UNKNOWN");
    }
  }
  private reserve(command: Command) {
    return this.transaction(async client => {
      await client.query("SELECT pg_advisory_xact_lock(5010)");
      const existing = await client.query('SELECT id FROM "PocOperation" WHERE id=$1', [command.id]);
      if (existing.rowCount) return false;
      const count = await client.query<{ count: string }>('SELECT count(*) FROM "PocOperation" WHERE kind=$1', [command.kind]);
      const limit = command.kind === "NUMBER" ? 1 : 5;
      if (Number(count.rows[0]?.count) >= limit) throw new Error("QUOTA");
      if (command.kind === "RECORD") {
        const unresolved = await client.query('SELECT id FROM "PocOperation" WHERE audio_status IN ($1,$2)', ["PENDING", "DELETE_FAILED"]);
        if (unresolved.rowCount) throw new Error("CLEANUP_REQUIRED");
      }
      // A crash after this commit may precede or follow the effect. Fail closed as UNKNOWN.
      await client.query('INSERT INTO "PocOperation" (id,account,campaign,kind,state,audio_status,deadline) VALUES($1,$2,$3,$4,$5,$6,$7)', [command.id, FAKE_ACCOUNT, campaign, command.kind, "UNKNOWN", command.kind === "RECORD" ? "PENDING" : null, command.kind === "RECORD" ? new Date(Date.now() + 900000) : null]);
      return true;
    });
  }
  async receive(route: Route, event: Envelope) {
    return this.transaction(async client => {
      const operation = await client.query<{ id: string; status: string | null; sequence: number | null }>('SELECT id,status,sequence FROM "PocOperation" WHERE account=$1 AND campaign=$2 AND resource=$3 FOR UPDATE', [event.account, campaign, event.resource]);
      const current = operation.rows[0];
      if (!current) throw new Error("FORBIDDEN");
      if (event.parent !== null) {
        const parent = await client.query('SELECT id FROM "PocOperation" WHERE resource=$1 AND campaign=$2', [event.parent, campaign]);
        if (!parent.rowCount) throw new Error("FORBIDDEN");
      }
      const key = `${route}:${event.resource}:${event.sequence ?? event.status}`;
      const inserted = await client.query('INSERT INTO "PocWebhookReceipt" (account,campaign,operation_id,event_key,route,resource,status,sequence) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING RETURNING event_key', [event.account, campaign, current.id, key, route, event.resource, event.status, event.sequence]);
      if (!inserted.rowCount) {
        const prior = await client.query<{ status: string }>('SELECT status FROM "PocWebhookReceipt" WHERE event_key=$1', [key]);
        if (prior.rows[0]?.status !== event.status) throw new Error("COLLISION");
        return "DUPLICATE";
      }
      if (!terminal.has(current.status ?? "") && (event.sequence === null || current.sequence === null || event.sequence > current.sequence)) {
        await client.query('UPDATE "PocOperation" SET status=$1,sequence=$2,version=version+1 WHERE id=$3', [event.status, event.sequence, current.id]);
      }
      return "ACCEPTED";
    });
  }
  async cleanup(provider: TelephonyProvider) {
    const pending = await this.pool.query<{ id: string; resource: string | null; attempts: number; deadline: Date; state: string }>('SELECT id,resource,attempts,deadline,state FROM "PocOperation" WHERE audio_status IN ($1,$2)', ["PENDING", "DELETE_FAILED"]);
    let failures = 0;
    for (const operation of pending.rows) {
      const client = await this.pool.connect();
      const lockKey = operation.id;
      try {
        await client.query("SELECT pg_advisory_lock(hashtextextended($1, 5011))", [lockKey]);
        const claim = await client.query('SELECT attempts,audio_status,resource,deadline FROM "PocOperation" WHERE id=$1', [operation.id]);
        const current = claim.rows[0];
        if (current?.audio_status === "DELETED") continue;
        if (!current?.resource || current.attempts >= 3 || current.deadline.getTime() < Date.now()) {
          await client.query('UPDATE "PocOperation" SET audio_status=$1 WHERE id=$2', ["DELETE_FAILED", operation.id]); failures++; continue;
        }
        // Durable attempt before effect; no open SQL transaction during provider calls.
        await client.query('UPDATE "PocOperation" SET attempts=attempts+1 WHERE id=$1', [operation.id]);
        try {
          await this.bounded(provider.stopRecording(current.resource));
          const proof = await this.bounded(provider.deleteRecording(current.resource));
          const valid = proof.confirmed && proof.providerDeleted !== false && proof.mediaUnavailable && proof.authenticated && current.deadline.getTime() >= Date.now();
          await client.query('UPDATE "PocOperation" SET audio_status=$1,delete_confirmed=$2,provider_deleted=$3,media_unavailable=$4,version=version+1 WHERE id=$5', [valid ? "DELETED" : "DELETE_FAILED", proof.confirmed, proof.providerDeleted, proof.mediaUnavailable && proof.authenticated, operation.id]);
          if (!valid) failures++;
        } catch { await client.query('UPDATE "PocOperation" SET audio_status=$1 WHERE id=$2', ["DELETE_FAILED", operation.id]); failures++; }
      } finally {
        try { await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 5011))", [lockKey]); }
        finally { client.release(); }
      }
    }

    if (failures) throw new Error("CLEANUP_REQUIRED");
  }
  async reconcile(id: string, provider: TelephonyProvider) {
    const row = await this.pool.query<{ resource: string | null; state: string; kind: string; version: number }>('SELECT resource,state,kind,version FROM "PocOperation" WHERE id=$1', [commandSchema.shape.id.parse(id)]);
    const current = row.rows[0];
    if (!current?.resource) throw new Error("MANUAL_RECONCILIATION_REQUIRED");
    if (current.kind !== "CALL") throw new Error("UNSUPPORTED_RECONCILIATION");
    const result = await this.bounded(provider.getCall(current.resource));
    if (result.resource !== current.resource) throw new Error("FORBIDDEN");
    const updated = await this.pool.query('UPDATE "PocOperation" SET status=$1,state=$2,version=version+1 WHERE id=$3 AND version=$4', [result.status, terminal.has(result.status) ? "COMPLETE" : current.state, id, current.version]);
    if (!updated.rowCount) throw new Error("CONFLICT");
    return { status: result.status };
  }
}
