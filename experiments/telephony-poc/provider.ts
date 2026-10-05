import { z } from "zod";
import { randomUUID } from "node:crypto";
import { BASE_URL, FAKE_ACCOUNT } from "./config";
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
export class ProviderRejected extends Error { constructor() { super("PROVIDER_REJECTED"); } }
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
// Injected HTTP-shaped local transport. No network client or credential configuration exists.
export type SyntheticTransport = (request: { method: "GET" | "POST" | "DELETE"; path: string; data?: Readonly<Record<string, string>> }) => Promise<{ status: number; body: unknown }>;
export class TwilioTelephonyProvider implements TelephonyProvider {
  verifyWebhook = verifyEnvelope;
  constructor(private readonly transport: SyntheticTransport, mode: "LOCAL_FAKE") {
    if (mode !== "LOCAL_FAKE") throw new Error("MODE_DISABLED");
  }
  private path(suffix: string) { return `/2010-04-01/Accounts/${FAKE_ACCOUNT}/${suffix}`; }
  private async create(path: string, data: Record<string, string>) {
    let response;
    try { response = await this.transport({ method: "POST", path: this.path(path), data }); }
    catch { throw new AmbiguousEffect(); }
    if (response.status >= 500) throw new AmbiguousEffect();
    if (response.status !== 201) throw new ProviderRejected();
    const result = z.object({ sid: z.string().regex(/^(CA|SM|RE|PN)[0-9a-f]{32}$/) }).passthrough().safeParse(response.body);
    if (!result.success) throw new AmbiguousEffect();
    return { resource: result.data.sid };
  }
  provisionNumber() { return this.create("IncomingPhoneNumbers.json", { PhoneNumber: "+15005550006" }); }
  async releaseNumber(sid: string) { this.sid(sid, "PN"); const result = await this.transport({ method: "DELETE", path: this.path(`IncomingPhoneNumbers/${sid}.json`) }); if (result.status !== 204) throw new Error("DELETE_UNCONFIRMED"); }
  makeOutboundCall() { return this.create("Calls.json", { From: "+15005550006", To: "+15005550001", Twiml: "<Response><Hangup/></Response>", TimeLimit: "60" }); }
  sendSms() { return this.create("Messages.json", { From: "+15005550006", To: "+15005550001", Body: "Synthetic Tony POC test" }); }
  async getCall(sid: string) {
    this.sid(sid, "CA"); const result = await this.transport({ method: "GET", path: this.path(`Calls/${sid}.json`) });
    if (result.status !== 200) throw new Error("READ_FAILED");
    const body = z.object({ sid: z.literal(sid), status: z.enum(["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled"]) }).passthrough().parse(result.body);
    return { resource: body.sid, status: body.status };
  }
  // The target is synthetic and fixed; no CallSid received from a client becomes a destination.
  startRecording() { return this.create(`Calls/CA${"0".repeat(32)}/Recordings.json`, { RecordingStatusCallback: `${BASE_URL}/poc/webhooks/twilio/recording-status` }); }
  async stopRecording(sid: string) { this.sid(sid, "RE"); const result = await this.transport({ method: "POST", path: this.path(`Calls/CA${"0".repeat(32)}/Recordings/${sid}.json`), data: { Status: "stopped" } }); if (result.status !== 200) throw new Error("STOP_FAILED"); }
  async deleteRecording(sid: string): Promise<DeletionProof> {
    this.sid(sid, "RE");
    const removed = await this.transport({ method: "DELETE", path: this.path(`Recordings/${sid}.json`) });
    if (removed.status !== 204) return { confirmed: false, providerDeleted: null, mediaUnavailable: false, authenticated: false };
    const metadata = await this.transport({ method: "GET", path: this.path(`Recordings/${sid}.json?IncludeSoftDeleted=true`) });
    let providerDeleted: boolean | null = null;
    let authenticated = metadata.status === 200;
    if (metadata.status === 200) {
      const body = z.object({ status: z.string() }).passthrough().parse(metadata.body);
      providerDeleted = body.status === "deleted";
    } else if (metadata.status === 404) {
      const authProbe = await this.transport({ method: "GET", path: this.path("Calls.json?PageSize=1") });
      authenticated = authProbe.status === 200;
    }
    const media = await this.transport({ method: "GET", path: this.path(`Recordings/${sid}.wav`) });
    return { confirmed: true, providerDeleted, mediaUnavailable: media.status === 404, authenticated };
  }
  private sid(value: string, prefix: string) { if (!new RegExp(`^${prefix}[0-9a-f]{32}$`).test(value)) throw new Error("INVALID_SID"); }
}
