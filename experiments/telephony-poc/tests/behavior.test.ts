import { describe, expect, it } from "vitest";
import { FakeTelephonyProvider, TwilioTelephonyProvider, AmbiguousEffect, commandSchema } from "../provider";
import { verifyEnvelope } from "../webhook";
import { SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE } from "./fixtures";
import { assertPocGraph } from "./boundary";
describe("synthetic effects and boundary", () => {
  it("SDK transport is exclusively injected and fake", async () => {
    const requests: unknown[] = []; const adapter = new TwilioTelephonyProvider(async request => { requests.push(request); return {status:201,body:{sid:"SM"+"0".repeat(32)}}; }, "LOCAL_FAKE");
    expect((await adapter.sendSms()).resource).toMatch(/^SM/); expect(requests).toHaveLength(1);
  });
  it("ambiguous creation is explicit", async () => { const fake = new FakeTelephonyProvider(); fake.ambiguous = true; await expect(fake.makeOutboundCall()).rejects.toBeInstanceOf(AmbiguousEffect); expect(fake.effects).toBe(1); });
  it.each([{kind:"CALL",id:"not-uuid"}, {kind:"SMS",id:"00000000-0000-4000-8000-000000000000",phone:"+123456789"}, {kind:"CALL",id:"00000000-0000-4000-8000-000000000000",recipient:"real"}])("rejects operator data outside synthetic contract", value => expect(() => commandSchema.parse(value)).toThrow());
  it("retains synthetic deletion semantics independently of metadata", async () => expect(await new FakeTelephonyProvider().deleteRecording()).toEqual({confirmed:true,providerDeleted:true,mediaUnavailable:true,authenticated:true}));
  it.each([SYNTHETIC_CALLBACK+"&CallStatus=completed", "%GG", "x="+"x".repeat(33000)])("rejects ambiguous/oversized envelope", raw => expect(() => verifyEnvelope("call-status",raw,SYNTHETIC_SIGNATURE)).toThrow());
  // Human-approved scope evolution: complete transitive fake graph, including config and aliases.
  it("entire LOCAL_FAKE entry graph is isolated from product and network clients", () => {
    expect(assertPocGraph("experiments/telephony-poc/main.ts", "LOCAL_FAKE").size).toBeGreaterThan(4);
  });
});

describe("Twilio adapter synthetic transport proofs", () => {
  it("classifies lost POST response UNKNOWN and makes no retry", async () => {
    let requests=0; const adapter=new TwilioTelephonyProvider(async()=>{requests++;throw new Error("timeout");},"LOCAL_FAKE");
    await expect(adapter.makeOutboundCall()).rejects.toBeInstanceOf(AmbiguousEffect);expect(requests).toBe(1);
  });
  it.each([500,201])("ambiguous status/malformed response %s is never silently accepted",async status=>{
    const adapter=new TwilioTelephonyProvider(async()=>({status,body:{}}),"LOCAL_FAKE");await expect(adapter.sendSms()).rejects.toBeInstanceOf(AmbiguousEffect);
  });
  it.each([404,200,401,503])("deletion distinguishes media response %s",async status=>{
    const adapter=new TwilioTelephonyProvider(async request=>request.method==="DELETE"?{status:204,body:null}:request.path.endsWith(".wav")?{status,body:null}:{status:200,body:{status:"deleted",sid:"RE"+"0".repeat(32)}},"LOCAL_FAKE");
    expect(await adapter.deleteRecording("RE"+"0".repeat(32))).toEqual({confirmed:true,providerDeleted:true,mediaUnavailable:status===404,authenticated:true});
  });
  it("does not treat bad auth as successful media deletion",async()=>{
    const adapter=new TwilioTelephonyProvider(async request=>({status:request.method==="DELETE"?204:request.path.endsWith(".wav")?404:401,body:null}),"LOCAL_FAKE");
    expect((await adapter.deleteRecording("RE"+"0".repeat(32))).authenticated).toBe(false);
  });
  it("does not infer DELETE confirmation from missing media",async()=>{
    let count=0;const adapter=new TwilioTelephonyProvider(async()=>{count++;return {status:404,body:null};},"LOCAL_FAKE");expect((await adapter.deleteRecording("RE"+"0".repeat(32))).confirmed).toBe(false);expect(count).toBe(1);
  });
});
