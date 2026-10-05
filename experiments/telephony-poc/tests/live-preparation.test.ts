import { describe, expect, it } from "vitest";
import { parseLivePreparation, assertLiveEffectsAuthorized } from "../live-config";

// Entirely invented fixtures. No tester telephone, provider account or secret.
const fixture = () => ({
  mode: "LIVE_POC", region: "ie1", edge: "dublin", country: "FR",
  numberCategory: "TECHNICAL_PLATFORM", voice: true, sms: true,
  accountSid: "AC" + "1".repeat(32), numberSid: "PN" + "2".repeat(32),
  publicOrigin: "https://synthetic-poc.trycloudflare.com",
  maximumBudgetCents: 5000, currency: "EUR",
  startsAt: "2026-10-12T12:00:00.000Z", endsAt: "2026-10-12T14:00:00.000Z",
  testers: 2, inboundLimit: 10, outboundSegmentLimit: 5, smsSegmentLimit: 5,
  recordingLimit: 2, recordingSeconds: 10, callSeconds: 60,
  databaseUrl: "postgresql://tony_poc_runtime:synthetic-preparation-only@127.0.0.1:5545/tony_poc",
});

describe("LIVE preparation has no effect authorization", () => {
  it("parses an entirely synthetic, explicit IE1 manifest", () => {
    expect(parseLivePreparation(fixture()).region).toBe("ie1");
  });
  it.each(Object.keys(fixture()))("requires the explicit field %s", field => {
    const input: Record<string, unknown> = fixture(); delete input[field];
    expect(() => parseLivePreparation(input)).toThrow("INVALID_LIVE_CONFIGURATION");
  });
  it.each([
    { region: "us1" }, { region: "latest" }, { edge: "ashburn" }, { country: "US" },
    { numberCategory: "MOBILE_P2P" }, { voice: false }, { sms: false },
    { maximumBudgetCents: 5001 }, { maximumBudgetCents: 0 }, { currency: "USD" },
    { testers: 3 }, { inboundLimit: 11 }, { outboundSegmentLimit: 6 },
    { smsSegmentLimit: 6 }, { recordingLimit: 3 }, { recordingSeconds: 11 },
    { callSeconds: 61 }, { startsAt: "2026-10-12T14:00:00Z" },
    { endsAt: "2026-10-12T12:00:00Z" },
    { accountSid: "AC" + "0".repeat(32) }, { numberSid: "CA" + "2".repeat(32) },
    { databaseUrl: "postgresql://tony_app:x@postgres/tony" },
    { databaseUrl: "postgresql://tony_poc_runtime:x@external.example/tony_poc" },
    { publicOrigin: "http://synthetic-poc.trycloudflare.com" },
    { publicOrigin: "https://synthetic-poc.trycloudflare.com/voice" },
    { publicOrigin: "https://synthetic-poc.trycloudflare.com?secret=x" },
    { publicOrigin: "https://synthetic-poc.trycloudflare.com.attacker.example" },
    { publicOrigin: "https://user:password@synthetic-poc.trycloudflare.com" },
    { publicOrigin: "https://synthetic-poc.trycloudflare.com:8443" },
    { authToken: "synthetic-forbidden-input" }, { organizationId: "tenant-B" },
    { activation: true }, { finalHumanApproval: true },
  ])("rejects a divergent or foreign manifest", override => {
    expect(() => parseLivePreparation({ ...fixture(), ...override })).toThrow("INVALID_LIVE_CONFIGURATION");
  });
  it("returns generic errors without input or secrets", () => {
    let caught: unknown;
    try { parseLivePreparation({ accountSid: "private-marker", secret: "private-secret-marker" }); }
    catch (error) { caught = error; }
    expect(String(caught)).toBe("Error: INVALID_LIVE_CONFIGURATION");
    expect(JSON.stringify(caught)).not.toMatch(/private-marker|private-secret-marker/);
  });
  it("does not mutate the manifest", () => {
    const input = Object.freeze(fixture()); const before = JSON.stringify(input);
    parseLivePreparation(input); expect(JSON.stringify(input)).toBe(before);
  });
  it("cannot authorize network, credentials or activation, even with a complete manifest", () => {
    parseLivePreparation(fixture());
    expect(() => assertLiveEffectsAuthorized()).toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED");
  });
});
