import { describe, expect, it } from "vitest";
import twilio from "twilio";
import type { AddressInfo } from "node:net";
import { livePrivateFixture } from "./live-fixtures";
import { parseLiveBinding } from "../live-binding";
import { createLivePocServer } from "../live-server";
import { routes, type Route } from "../webhook";
const binding = parseLiveBinding(livePrivateFixture());
const fields = (route: Route): Record<string, string> => ({ AccountSid: binding.manifest.accountSid, ...(route === "voice" ? { From: binding.testers[0]!.phone, To: binding.number, CallSid: "CA" + "6".repeat(32), CallStatus: "ringing" } : route === "message-status" ? { MessageSid: "SM" + "6".repeat(32), MessageStatus: "delivered" } : route === "recording-status" ? { RecordingSid: "RE" + "6".repeat(32), RecordingStatus: "completed", CallSid: "CA" + "7".repeat(32) } : route === "dial-result" ? { DialCallSid: "CA" + "6".repeat(32), CallSid: "CA" + "7".repeat(32), DialCallStatus: "no-answer" } : { CallSid: "CA" + "6".repeat(32), CallStatus: "completed" }) });
function signed(route: Route, data = fields(route)) { return { body: new URLSearchParams(data).toString(), headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": twilio.getExpectedTwilioSignature(binding.secrets.authToken, binding.manifest.publicOrigin + "/poc/webhooks/twilio/" + route, data) } }; }
async function run(work: (base: string) => Promise<void>, fail = false) {
  let admissions = 0;
  const server = createLivePocServer(binding, { receive: async () => { admissions++; if (fail) throw new Error("private-sql-marker"); return "<Response><Hangup/></Response>"; } });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  try { await work(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  return admissions;
}
describe("five LIVE HTTP surfaces in an entirely synthetic local rehearsal", () => {
  it.each(routes)("admits only a verified signed %s request before commit acknowledgement", async route => {
    expect(await run(async base => { const response = await fetch(base + "/poc/webhooks/twilio/" + route, { method: "POST", ...signed(route) }); expect(response.status).toBe(route === "voice" || route === "dial-result" ? 200 : 204); expect(response.headers.get("cache-control")).toBe("no-store"); })).toBe(1);
  });
  it.each(routes)("refuses cookies and unsigned %s requests", async route => {
    expect(await run(async base => { const response = await fetch(base + "/poc/webhooks/twilio/" + route, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", cookie: "session=synthetic-tenant-A" }, body: signed(route).body }); expect(response.status).toBe(403); expect(await response.text()).toBe(""); })).toBe(0);
  });
  it("never reconstructs the signed URL from proxy headers", async () => {
    expect(await run(async base => { const input = signed("voice"); const response = await fetch(base + "/poc/webhooks/twilio/voice", { method: "POST", ...input, headers: { ...input.headers, "x-forwarded-host": "attacker.example", "x-forwarded-proto": "http" } }); expect(response.status).toBe(200); })).toBe(1);
  });
  it("refuses account/tenant injection, duplicate fields and altered signed body", async () => {
    expect(await run(async base => {
      const input = signed("voice"), path = base + "/poc/webhooks/twilio/voice";
      expect((await fetch(path, { method: "POST", ...input, body: input.body + "&AccountSid=other" })).status).toBe(400);
      const tenant = signed("voice", { ...fields("voice"), organizationId: "tenant-B" }); expect((await fetch(path, { method: "POST", ...tenant })).status).toBe(403);
      expect((await fetch(path, { method: "POST", ...input, body: input.body + "&Unexpected=changed" })).status).toBe(403);
    })).toBe(0);
  });
  it("exposes neither operator API, SQL, health nor media; refuses query/MIME/method/oversize", async () => {
    expect(await run(async base => {
      const input = signed("voice"), path = base + "/poc/webhooks/twilio/voice";
      for (const route of ["/execute", "/health", "/readiness", "/api/crm", "/media", "/poc/webhooks/twilio/voice?organizationId=B"]) expect((await fetch(base + route)).status).toBe(404);
      expect((await fetch(path)).status).toBe(405);
      expect((await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status).toBe(415);
      expect((await fetch(path, { method: "POST", ...input, body: "x=" + "x".repeat(33000) })).status).toBe(413);
    })).toBe(0);
  });
  it("acknowledges no failed persistence and reveals no private details", async () => {
    expect(await run(async base => { const response = await fetch(base + "/poc/webhooks/twilio/call-status", { method: "POST", ...signed("call-status") }); expect(response.status).toBe(503); expect(await response.text()).toBe(""); }, true)).toBe(1);
  });
  it("accepts a consented inbound SMS with no response text or creator effect", async () => {
    const data = { AccountSid: binding.manifest.accountSid, MessageSid: "SM" + "9".repeat(32), SmsStatus: "received", From: binding.testers[0]!.phone, To: binding.number, Body: "Synthetic message ignored before persistence" };
    expect(await run(async base => { const response = await fetch(base + "/poc/webhooks/twilio/message-status", { method: "POST", ...signed("message-status", data) }); expect(response.status).toBe(200); expect(await response.text()).toBe("<Response/>"); })).toBe(1);
  });
});
