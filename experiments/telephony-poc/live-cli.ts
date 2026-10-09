import { Pool } from "pg";
import { z } from "zod";
import { assertLiveEffectsAuthorized } from "./live-config";
import { createLiveNetworkTransport } from "./live-transport";
import { LiveTwilioProvider } from "./live-provider";
import { LivePocRepository } from "./live-repository";
export const liveCommandSchema = z.discriminatedUnion("command", [
  z.object({ command: z.literal("execute"), id: z.string().uuid(), kind: z.enum(["CALL", "SMS", "RECORD"]), slot: z.enum(["T1", "T2"]), callSid: z.string().regex(/^CA[0-9a-f]{32}$/).optional(), audibleReminderConfirmed: z.literal(true).optional() }).strict(),
  z.object({ command: z.literal("reconcile"), id: z.string().uuid() }).strict(),
  z.object({ command: z.literal("cleanup") }).strict(),
  z.object({ command: z.literal("emergency-stop") }).strict(),
]);
// Local operator entry only. No public trigger, environment/file loader or output of private values.
export async function runPreparedLiveCommand(input: unknown, loadPrivate: () => unknown): Promise<void> {
  assertLiveEffectsAuthorized();
  const command = liveCommandSchema.parse(input);
  const { binding, transport, probe } = createLiveNetworkTransport(loadPrivate);
  const provider = new LiveTwilioProvider(binding, transport, probe);
  if (command.command === "execute") await provider.verifyNumber();
  const pool = new Pool({ connectionString: binding.manifest.databaseUrl, max: 2 });
  const repository = new LivePocRepository(pool, binding);
  try {
    if (command.command === "execute") { const { command: _, ...action } = command; void _; await repository.execute(action, provider); }
    else if (command.command === "reconcile") await repository.reconcile(command.id, provider);
    else if (command.command === "cleanup") await repository.cleanup(provider, true);
    else { try { await repository.emergencyStop(provider); } finally { await repository.cleanup(provider, true); } }
  } finally { await pool.end(); }
}
