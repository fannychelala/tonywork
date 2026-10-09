import { describe, expect, it, vi } from "vitest";
import { parseLiveBinding } from "../live-binding";
import { livePrivateFixture } from "./live-fixtures";
import { prepareSdkTransport, probeMediaWithHttps, prepareStreamingProbe, assertSafeLiveEnvironment } from "../live-transport";
import { cloudflaredArguments, cloudflaredLock, launchPreparedTunnel, verifyCloudflaredArtifact } from "../live-tunnel";
describe("prepared network capabilities remain closed", () => {
  it("pins IE1, disables redirect and bounds SDK request time", async () => {
    const send = vi.fn(async () => ({ statusCode: 200, body: "{}" })); const binding = parseLiveBinding(livePrivateFixture());
    await prepareSdkTransport(binding, send)({ method: "GET", path: `/2010-04-01/Accounts/${binding.manifest.accountSid}/Calls.json?PageSize=1` });
    expect(send).toHaveBeenCalledWith({ method: "GET", uri: `https://api.dublin.ie1.twilio.com/2010-04-01/Accounts/${binding.manifest.accountSid}/Calls.json?PageSize=1`, timeout: 5000, allowRedirects: false });
  });
  it.each(["https://attacker.example", "/2010-04-01/Accounts/AC" + "9".repeat(32) + "/Calls.json", "/admin", "/2010-04-01/Accounts/AC" + "1".repeat(32) + "/Calls.json?url=https://attacker.example"])("rejects arbitrary endpoints %s", async path => {
    const send = vi.fn(); await expect(prepareSdkTransport(parseLiveBinding(livePrivateFixture()), send)({ method: "GET", path })).rejects.toThrow("FORBIDDEN"); expect(send).not.toHaveBeenCalled();
  });
  it("never exposes upstream body or retries an IO error", async () => {
    const send = vi.fn(async () => { throw new Error("private-token-marker"); }); const binding = parseLiveBinding(livePrivateFixture());
    await expect(prepareSdkTransport(binding, send)({ method: "POST", path: `/2010-04-01/Accounts/${binding.manifest.accountSid}/Calls.json` })).rejects.toThrow("PROVIDER_IO_FAILED"); expect(send).toHaveBeenCalledTimes(1);
  });
  it("never deletes calls or creates a recording through an unapproved method", async () => {
    const send = vi.fn(), binding = parseLiveBinding(livePrivateFixture()), transport = prepareSdkTransport(binding, send);
    await expect(transport({ method: "DELETE", path: `/2010-04-01/Accounts/${binding.manifest.accountSid}/Calls/CA${"6".repeat(32)}.json` })).rejects.toThrow("FORBIDDEN");
    await expect(transport({ method: "POST", path: `/2010-04-01/Accounts/${binding.manifest.accountSid}/Recordings/RE${"7".repeat(32)}.json` })).rejects.toThrow("FORBIDDEN"); expect(send).not.toHaveBeenCalled();
  });
  it("forbids real media IO before the final approval", () => expect(() => probeMediaWithHttps(parseLiveBinding(livePrivateFixture()), "RE" + "7".repeat(32))).toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED"));
  it.each([200, 302, 401, 403, 404, 500])("destroys media response %s before reading a byte", async statusCode => {
    const pause = vi.fn(), destroy = vi.fn();
    const probe = prepareStreamingProbe(parseLiveBinding(livePrivateFixture()), (_options, receive) => { queueMicrotask(() => receive({ statusCode, pause, destroy })); return { once: vi.fn(), destroy: vi.fn(), end: vi.fn() }; });
    const result = await probe("RE" + "7".repeat(32)); expect(result.status).toBe(statusCode); expect(pause).toHaveBeenCalledTimes(1); expect(destroy).toHaveBeenCalledTimes(1); expect(result.authenticated).toBe(statusCode === 200 || statusCode === 404);
  });
  it.each(["TWILIO_LOG_LEVEL", "TWILIO_CA_BUNDLE", "HTTP_PROXY", "HTTPS_PROXY", "NODE_TLS_REJECT_UNAUTHORIZED", "DATABASE_URL", "BETTER_AUTH_SECRET"])("rejects inherited credential/proxy/debug setting %s", key => expect(() => assertSafeLiveEnvironment({ [key]: "synthetic" })).toThrow("FOREIGN_LIVE_ENVIRONMENT"));
  it("pins the tunnel executable, origin and update policy without launching it", () => {
    expect(cloudflaredLock.version).toBe("2026.9.3"); expect(cloudflaredArguments("2026.9.3")).toContain("--no-autoupdate"); expect(cloudflaredArguments("2026.9.3")).toContain("http://127.0.0.1:4316");
    expect(() => cloudflaredArguments("latest")).toThrow(); expect(() => verifyCloudflaredArtifact(Buffer.from("tampered"), "darwinArm64")).toThrow();
  });
  it("does not invoke a tunnel launcher in preparation mode", async () => { const launch = vi.fn(); await expect(launchPreparedTunnel(launch)).rejects.toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED"); expect(launch).not.toHaveBeenCalled(); });
});
