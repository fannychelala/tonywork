import { z } from "zod";
import { randomUUID } from "node:crypto";
import { verifyEnvelope, type Route } from "./webhook";
export const commandSchema = z.object({ id: z.string().uuid(), kind: z.enum(["CALL", "SMS", "RECORD", "NUMBER"]), recipient: z.enum(["synthetic-a", "synthetic-b"]).default("synthetic-a") }).strict();
export type Command = z.infer<typeof commandSchema>;
export type Effect = { resource: string };
export type DeletionProof = { confirmed: boolean; providerDeleted: boolean | null; mediaUnavailable: boolean; authenticated: boolean };
export interface TelephonyProvider {
  verifyWebhook(route: Route, raw: string, signature: string): ReturnType<typeof verifyEnvelope>;
  provisionNumber(): Promise<Effect>;
  releaseNumber(sid: string): Promise<void>;
  makeOutboundCall(): Promise<Effect>;
  sendSms(): Promise<Effect>;
  getCall(sid: string): Promise<{ resource: string; status: string }>;
  startRecording(): Promise<Effect>;
  stopRecording(sid: string): Promise<void>;
  deleteRecording(sid: string): Promise<DeletionProof>;
}
export class AmbiguousEffect extends Error { constructor() { super("UNKNOWN"); } }
export class FakeTelephonyProvider implements TelephonyProvider {
  verifyWebhook = verifyEnvelope;
  effects = 0;
  ambiguous = false;
  deletion: DeletionProof = { confirmed: true, providerDeleted: true, mediaUnavailable: true, authenticated: true };
  private async effect(prefix: string): Promise<Effect> {
    this.effects++;
    if (this.ambiguous) throw new AmbiguousEffect();
    return { resource: prefix + randomUUID().replaceAll("-", "") };
  }
  provisionNumber() { return this.effect("PN"); }
  async releaseNumber() {}
  makeOutboundCall() { return this.effect("CA"); }
  sendSms() { return this.effect("SM"); }
  async getCall(resource: string) { return { resource, status: "completed" }; }
  startRecording() { return this.effect("RE"); }
  async stopRecording() {}
  async deleteRecording() { return { ...this.deletion }; }
}
// No SDK client construction or live transport. The injected transport is a local test double.
export class TwilioTelephonyProvider implements TelephonyProvider {
  verifyWebhook = verifyEnvelope;
  constructor(private readonly transport: TelephonyProvider, mode: "LOCAL_FAKE") {
    if (mode !== "LOCAL_FAKE") throw new Error("MODE_DISABLED");
  }
  provisionNumber() { return this.transport.provisionNumber(); }
  releaseNumber(sid: string) { return this.transport.releaseNumber(sid); }
  makeOutboundCall() { return this.transport.makeOutboundCall(); }
  sendSms() { return this.transport.sendSms(); }
  getCall(sid: string) { return this.transport.getCall(sid); }
  startRecording() { return this.transport.startRecording(); }
  stopRecording(sid: string) { return this.transport.stopRecording(sid); }
  deleteRecording(sid: string) { return this.transport.deleteRecording(sid); }
}
