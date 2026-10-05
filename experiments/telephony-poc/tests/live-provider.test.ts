import twilio from "twilio";
import { describe, expect, it, vi } from "vitest";
import { livePrivateFixture } from "./live-fixtures";
import { parseLiveBinding } from "../live-binding";
import { LiveTwilioProvider, type LiveRequest } from "../live-provider";
import { verifyLiveWebhook } from "../live-webhook";
import { startPreparedLive } from "../live-main";
import { createLiveNetworkTransport } from "../live-transport";
import { assertPocGraph } from "./boundary";

describe("synthetic rehearsal of the LIVE boundary", () => {
  it.each([{ secrets: {} }, { number: "+33100000000" }, { testers: [] }, { fixedCostCents: 5001 }])("rejects incomplete private binding", override => expect(() => parseLiveBinding({ ...livePrivateFixture(), ...override })).toThrow("INVALID_LIVE_BINDING"));
  it.each(["region", "accountSid", "keyType"])("rejects foreign credentials %s", field => {
    const input = livePrivateFixture();
    expect(() => parseLiveBinding({ ...input, secrets: { ...input.secrets, [field]: "foreign" } })).toThrow("INVALID_LIVE_BINDING");
  });
  it("rejects duplicated testers or absent consent", () => {
    const input = livePrivateFixture();
    expect(() => parseLiveBinding({ ...input, testers: [input.testers[0], input.testers[0]] })).toThrow();
    expect(() => parseLiveBinding({ ...input, testers: [{ ...input.testers[0], callSmsConsent: false }] })).toThrow();
  });
  it("never loads credentials, constructs SDK, connects or listens at preparation startup", async () => {
    const load = vi.fn(); await expect(startPreparedLive(load)).rejects.toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED"); expect(load).not.toHaveBeenCalled();
    expect(() => createLiveNetworkTransport(load)).toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED"); expect(load).not.toHaveBeenCalled();
  });
  it("checks the complete LIVE graph independently", () => expect(assertPocGraph("experiments/telephony-poc/live-main.ts", "LIVE").size).toBeGreaterThan(4));
  it("translates a single bounded call to the expected regional request without retry", async () => {
    const requests: LiveRequest[] = [], binding = parseLiveBinding(livePrivateFixture());
    const provider = new LiveTwilioProvider(binding, async request => { requests.push(request); return { status: 201, body: { sid: "CA" + "6".repeat(32) } }; }, async () => ({ status: 404, authenticated: true }));
    await provider.forAction("T1").makeOutboundCall(); expect(requests).toHaveLength(1);
    expect(requests[0]?.data).toMatchObject({ From: binding.number, To: binding.testers[0]!.phone, TimeLimit: "10", Record: "false" });
    expect(requests[0]?.path).toContain(binding.manifest.accountSid);
  });
  it("makes no retry after ambiguous creation and never reflects provider payload", async () => {
    let calls = 0;
    const provider = new LiveTwilioProvider(parseLiveBinding(livePrivateFixture()), async () => { calls++; throw new Error("private-provider-payload"); }, async () => ({ status: 404, authenticated: true }));
    await expect(provider.makeOutboundCall()).rejects.toThrow("UNKNOWN"); expect(calls).toBe(1);
  });
  it("honors a smaller configured audio/call cap in the provider request", async () => {
    const fixture = livePrivateFixture();
    const binding = parseLiveBinding({ ...fixture, manifest: { ...fixture.manifest, recordingSeconds: 3, callSeconds: 5 } });
    const transport = vi.fn(async (_request: LiveRequest) => { void _request; return { status: 201, body: { sid: "CA" + "6".repeat(32) } }; });
    await new LiveTwilioProvider(binding, transport, vi.fn()).makeOutboundCall();
    expect(transport.mock.calls[0]?.[0]?.data?.TimeLimit).toBe("3");
  });
  it("refuses provider provisioning from the runtime", async () => {
    const transport = vi.fn(), provider = new LiveTwilioProvider(parseLiveBinding(livePrivateFixture()), transport, vi.fn());
    await expect(provider.provisionNumber()).rejects.toThrow("ADMINISTRATIVE_ONLY"); await expect(provider.releaseNumber("PN" + "2".repeat(32))).rejects.toThrow("ADMINISTRATIVE_ONLY"); expect(transport).not.toHaveBeenCalled();
  });
  it.each([401, 403, 500, 200])("does not call media status %s proof of deletion", async status => {
    const provider = new LiveTwilioProvider(parseLiveBinding(livePrivateFixture()), async request => ({ status: request.method === "DELETE" ? 204 : 200, body: { sid: "RE" + "7".repeat(32), status: "deleted" } }), async () => ({ status, authenticated: status !== 401 && status !== 403 }));
    expect((await provider.deleteRecording("RE" + "7".repeat(32))).mediaUnavailable).toBe(false);
  });
  it("accepts deletion only with confirmed DELETE and authenticated missing media", async () => {
    const requests: LiveRequest[] = [], provider = new LiveTwilioProvider(parseLiveBinding(livePrivateFixture()), async request => { requests.push(request); return { status: request.method === "DELETE" ? 204 : 200, body: { sid: "RE" + "7".repeat(32), status: "deleted" } }; }, async () => ({ status: 404, authenticated: true }));
    expect(await provider.deleteRecording("RE" + "7".repeat(32))).toEqual({ confirmed: true, providerDeleted: true, mediaUnavailable: true, authenticated: true });
    expect(requests[1]?.path).toContain(`Recordings/RE${"7".repeat(32)}.json?IncludeSoftDeleted=true`);
  });
  it("does not probe media if DELETE is unconfirmed", async () => {
    const probe = vi.fn(), provider = new LiveTwilioProvider(parseLiveBinding(livePrivateFixture()), async () => ({ status: 500, body: null }), probe);
    expect((await provider.deleteRecording("RE" + "7".repeat(32))).confirmed).toBe(false); expect(probe).not.toHaveBeenCalled();
  });
  it("verifies the entire signed form before projection, ignores proxy headers and binds caller/line", () => {
    const binding = parseLiveBinding(livePrivateFixture());
    const fields = { AccountSid: binding.manifest.accountSid, CallSid: "CA" + "6".repeat(32), From: binding.testers[0]!.phone, To: binding.number, CallStatus: "ringing", ExtraTwilioField: "synthetic" };
    const signature = twilio.getExpectedTwilioSignature(binding.secrets.authToken, binding.manifest.publicOrigin + "/poc/webhooks/twilio/voice", fields);
    expect(verifyLiveWebhook(binding, "voice", new URLSearchParams(fields).toString(), signature).caller).toBe("T1");
    expect(() => verifyLiveWebhook(binding, "voice", new URLSearchParams({ ...fields, ExtraTwilioField: "changed" }).toString(), signature)).toThrow("FORBIDDEN");
    const foreign = { ...fields, From: "+33600000003" };
    const signed = twilio.getExpectedTwilioSignature(binding.secrets.authToken, binding.manifest.publicOrigin + "/poc/webhooks/twilio/voice", foreign);
    expect(() => verifyLiveWebhook(binding, "voice", new URLSearchParams(foreign).toString(), signed)).toThrow("FORBIDDEN");
  });
});
