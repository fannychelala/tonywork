import { describe, expect, it } from "vitest";
import { FakeTelephonyProvider, TwilioTelephonyProvider, AmbiguousEffect, commandSchema } from "../provider";
import { verifyEnvelope } from "../webhook";
import { SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE } from "./fixtures";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
describe("synthetic effects and boundary", () => {
  it("SDK transport is exclusively injected and fake", async () => {
    const fake = new FakeTelephonyProvider(); const adapter = new TwilioTelephonyProvider(fake, "LOCAL_FAKE");
    expect((await adapter.sendSms()).resource).toMatch(/^SM/); expect(fake.effects).toBe(1);
  });
  it("ambiguous creation is explicit", async () => { const fake = new FakeTelephonyProvider(); fake.ambiguous = true; await expect(fake.makeOutboundCall()).rejects.toBeInstanceOf(AmbiguousEffect); expect(fake.effects).toBe(1); });
  it.each([{kind:"CALL",id:"not-uuid"}, {kind:"SMS",id:"00000000-0000-4000-8000-000000000000",phone:"+123456789"}, {kind:"CALL",id:"00000000-0000-4000-8000-000000000000",recipient:"real"}])("rejects operator data outside synthetic contract", value => expect(() => commandSchema.parse(value)).toThrow());
  it("retains synthetic deletion semantics independently of metadata", async () => expect(await new FakeTelephonyProvider().deleteRecording()).toEqual({confirmed:true,providerDeleted:true,mediaUnavailable:true,authenticated:true}));
  it.each([SYNTHETIC_CALLBACK+"&CallStatus=completed", "%GG", "x="+"x".repeat(33000)])("rejects ambiguous/oversized envelope", raw => expect(() => verifyEnvelope("call-status",raw,SYNTHETIC_SIGNATURE)).toThrow());
  it("has no imports of product/auth/scoring or network clients", () => {
    for (const name of readdirSync("experiments/telephony-poc").filter(name=>name.endsWith(".ts")&&!name.endsWith("config.ts"))) {
      const source=readFileSync(join("experiments/telephony-poc",name),"utf8");
      expect(source).not.toMatch(/from\s+["'][^"']*(?:src\/|better-auth|withTenant|scoring|prisma|https|net)[^"']*["']/);
      expect(source).not.toMatch(/\bfetch\s*\(|new\s+twilio\s*\(/);
    }
  });
});
