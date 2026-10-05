import { Pool, type PoolClient } from "pg";
import { FAKE_ACCOUNT } from "./config";
import { type Command, type TelephonyProvider, AmbiguousEffect, commandSchema } from "./provider";
import { type Envelope, type Route } from "./webhook";
const campaign = "synthetic-local-v1";
const terminal = new Set(["completed", "busy", "no-answer", "failed", "canceled", "delivered", "undelivered", "deleted"]);
export class PocRepository {
  constructor(readonly pool: Pool) {}
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
      const effect = command.kind === "CALL" ? await provider.makeOutboundCall() : command.kind === "SMS" ? await provider.sendSms() : command.kind === "RECORD" ? await provider.startRecording() : await provider.provisionNumber();
      await this.pool.query('UPDATE "PocOperation" SET state=$1,resource=$2,version=version+1 WHERE id=$3', ["ACCEPTED", effect.resource, command.id]);
      return effect;
    } catch (error) {
      await this.pool.query('UPDATE "PocOperation" SET state=$1,version=version+1 WHERE id=$2', [error instanceof AmbiguousEffect ? "UNKNOWN" : "FAILED", command.id]);
      throw new Error(error instanceof AmbiguousEffect ? "UNKNOWN" : "EFFECT_FAILED");
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
      await this.transaction(async client => {
        const claim = await client.query('SELECT attempts,audio_status FROM "PocOperation" WHERE id=$1 FOR UPDATE', [operation.id]);
        if (claim.rows[0]?.audio_status === "DELETED") return;
        if (!operation.resource || claim.rows[0]?.attempts >= 3 || operation.deadline.getTime() < Date.now()) {
          await client.query('UPDATE "PocOperation" SET audio_status=$1 WHERE id=$2', ["DELETE_FAILED", operation.id]); failures++; return;
        }
        // Only the fake transport can run here. No remote IO is enabled in LOCAL_FAKE.
        await client.query('UPDATE "PocOperation" SET attempts=attempts+1 WHERE id=$1', [operation.id]);
        try {
          await provider.stopRecording(operation.resource);
          const proof = await provider.deleteRecording(operation.resource);
          const valid = proof.confirmed && proof.providerDeleted !== false && proof.mediaUnavailable && proof.authenticated;
          await client.query('UPDATE "PocOperation" SET audio_status=$1,delete_confirmed=$2,provider_deleted=$3,media_unavailable=$4,version=version+1 WHERE id=$5', [valid ? "DELETED" : "DELETE_FAILED", proof.confirmed, proof.providerDeleted, proof.mediaUnavailable && proof.authenticated, operation.id]);
          if (!valid) failures++;
        } catch { await client.query('UPDATE "PocOperation" SET audio_status=$1 WHERE id=$2', ["DELETE_FAILED", operation.id]); failures++; }
      });
    }
    if (failures) throw new Error("CLEANUP_REQUIRED");
  }
  async reconcile(id: string, provider: TelephonyProvider) {
    const row = await this.pool.query<{ resource: string | null; state: string }>('SELECT resource,state FROM "PocOperation" WHERE id=$1', [commandSchema.shape.id.parse(id)]);
    if (!row.rows[0]?.resource) throw new Error("MANUAL_RECONCILIATION_REQUIRED");
    const result = await provider.getCall(row.rows[0].resource);
    return { status: result.status };
  }
}
