import { z } from "zod";
import type { LiveBinding } from "./live-binding";
import type { TelephonyProvider, DeletionProof } from "./provider";
import { AmbiguousEffect, ProviderRejected } from "./provider";
import { verifyLiveWebhook, type LiveEvent } from "./live-webhook";
export type LiveRequest = { method: "GET" | "POST" | "DELETE"; path: string; data?: Readonly<Record<string, string>> };
export type LiveTransport = (request: LiveRequest) => Promise<{ status: number; body: unknown }>;
export type MediaProbe = (sid: string) => Promise<{ status: number; authenticated: boolean }>;
export class LiveTwilioProvider implements TelephonyProvider<LiveEvent> {
  #binding: LiveBinding;
  constructor(binding: LiveBinding, private readonly transport: LiveTransport, private readonly probe: MediaProbe, private readonly slot: "T1" | "T2" = "T1", private readonly callSid?: string) { this.#binding = binding; }
  verifyWebhook(route: Parameters<typeof verifyLiveWebhook>[1], raw: string, signature: string) { return verifyLiveWebhook(this.#binding, route, raw, signature); }
  forAction(slot: "T1" | "T2", callSid?: string) {
    if (!this.#binding.testers.some(t => t.slot === slot)) throw new Error("FORBIDDEN");
    if (callSid !== undefined) this.sid(callSid, "CA");
    return new LiveTwilioProvider(this.#binding, this.transport, this.probe, slot, callSid);
  }
  private path(suffix: string) { return `/2010-04-01/Accounts/${this.#binding.manifest.accountSid}/${suffix}`; }
  private callback(route: string) { return `${this.#binding.manifest.publicOrigin}/poc/webhooks/twilio/${route}`; }
  private sid(value: string, prefix: string) { if (!new RegExp(`^${prefix}[0-9a-f]{32}$`).test(value)) throw new Error("INVALID_SID"); }
  private async create(suffix: string, prefix: string, data: Record<string, string>) {
    let result;
    try { result = await this.transport({ method: "POST", path: this.path(suffix), data }); } catch { throw new AmbiguousEffect(); }
    if (result.status >= 500) throw new AmbiguousEffect();
    if (result.status !== 201) throw new ProviderRejected();
    const body = z.object({ sid: z.string().regex(new RegExp(`^${prefix}[0-9a-f]{32}$`)) }).passthrough().safeParse(result.body);
    if (!body.success) throw new AmbiguousEffect(); return { resource: body.data.sid };
  }
  async provisionNumber(): Promise<never> { throw new Error("ADMINISTRATIVE_ONLY"); }
  async releaseNumber(_sid: string): Promise<never> { void _sid; throw new Error("ADMINISTRATIVE_ONLY"); }
  makeOutboundCall() {
    const target = this.#binding.testers.find(t => t.slot === this.slot); if (!target) throw new Error("FORBIDDEN");
    // Provider-side ten-second call limit bounds any later REST recording even after process death.
    return this.create("Calls.json", "CA", { From: this.#binding.number, To: target.phone, TimeLimit: "10", Record: "false", Twiml: "<Response><Say>Test Tony. Aucun enregistrement sans accord distinct.</Say><Pause length=\"10\"/><Hangup/></Response>", StatusCallback: this.callback("call-status"), StatusCallbackMethod: "POST", StatusCallbackEvent: "completed" });
  }
  sendSms() {
    const target = this.#binding.testers.find(t => t.slot === this.slot); if (!target) throw new Error("FORBIDDEN");
    return this.create("Messages.json", "SM", { From: this.#binding.number, To: target.phone, Body: "Test technique Tony autorise. Aucun message commercial.", StatusCallback: this.callback("message-status"), ValidityPeriod: "60" });
  }
  async getCall(sid: string) {
    this.sid(sid, "CA"); const response = await this.transport({ method: "GET", path: this.path(`Calls/${sid}.json`) });
    const parsed = z.object({ sid: z.literal(sid), account_sid: z.literal(this.#binding.manifest.accountSid), status: z.enum(["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled"]), direction: z.literal("outbound-api"), to: z.string(), from: z.literal(this.#binding.number) }).passthrough().safeParse(response.body);
    if (response.status !== 200 || !parsed.success || !this.#binding.testers.some(t => t.slot === this.slot && t.phone === parsed.data.to)) throw new Error("READ_FAILED");
    return { resource: parsed.data.sid, status: parsed.data.status };
  }
  async startRecording() {
    if (!this.callSid || !this.#binding.testers.every(t => t.audioConsent)) throw new Error("AUDIO_CONSENT_REQUIRED");
    const call = await this.getCall(this.callSid); if (call.status !== "in-progress") throw new Error("CALL_NOT_ACTIVE");
    return this.create(`Calls/${this.callSid}/Recordings.json`, "RE", { RecordingStatusCallback: this.callback("recording-status"), RecordingStatusCallbackMethod: "POST", RecordingStatusCallbackEvent: "completed", RecordingChannels: "mono" });
  }
  async stopRecording(sid: string) {
    this.sid(sid, "RE"); if (!this.callSid) throw new Error("RECORDING_PARENT_REQUIRED");
    const response = await this.transport({ method: "POST", path: this.path(`Calls/${this.callSid}/Recordings/${sid}.json`), data: { Status: "stopped" } });
    if (response.status !== 200) throw new Error("STOP_FAILED");
  }
  async endCall(sid: string) {
    this.sid(sid, "CA"); const response = await this.transport({ method: "POST", path: this.path(`Calls/${sid}.json`), data: { Status: "completed" } });
    if (response.status !== 200) throw new Error("STOP_FAILED");
  }
  async deleteRecording(sid: string): Promise<DeletionProof> {
    this.sid(sid, "RE"); const empty = { confirmed: false, providerDeleted: null, mediaUnavailable: false, authenticated: false };
    let removed; try { removed = await this.transport({ method: "DELETE", path: this.path(`Recordings/${sid}.json`) }); } catch { return empty; }
    if (removed.status !== 204) return empty;
    return this.verifyDeletionAfterConfirmedDelete(sid);
  }
  async verifyDeletionAfterConfirmedDelete(sid: string): Promise<DeletionProof> {
    this.sid(sid, "RE");
    const empty = { confirmed: false, providerDeleted: null, mediaUnavailable: false, authenticated: false };
    try {
      // The locked SDK supports IncludeSoftDeleted on single-recording fetch.
      const metadata = await this.transport({ method: "GET", path: this.path(`Recordings/${sid}.json?IncludeSoftDeleted=true`) });
      let providerDeleted: boolean | null = null;
      if (metadata.status === 404) {
        const auth = await this.transport({ method: "GET", path: this.path("Calls.json?PageSize=1") });
        if (auth.status !== 200) return { ...empty, confirmed: true };
        const media = await this.probe(sid);
        return { confirmed: true, providerDeleted: null, mediaUnavailable: media.status === 404 && media.authenticated, authenticated: media.authenticated };
      }
      if (metadata.status !== 200) return { ...empty, confirmed: true };
      const direct = z.object({ sid: z.literal(sid), status: z.string() }).passthrough().safeParse(metadata.body);
      const listed = z.object({ recordings: z.array(z.object({ sid: z.string(), status: z.string() }).passthrough()) }).passthrough().safeParse(metadata.body);
      const found = direct.success ? direct.data : listed.success ? listed.data.recordings.find(row => row.sid === sid) : undefined;
      if (!direct.success && !listed.success) return { ...empty, confirmed: true };
      if (found) providerDeleted = found.status === "deleted";
      const media = await this.probe(sid);
      return { confirmed: true, providerDeleted, mediaUnavailable: media.status === 404 && media.authenticated, authenticated: media.authenticated };
    } catch { return { ...empty, confirmed: true }; }
  }
}
