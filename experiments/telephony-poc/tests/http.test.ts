import { describe, expect, it } from "vitest";
import { createPocServer } from "../server";
import { routes } from "../webhook";
import { SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE } from "./fixtures";
import type { AddressInfo } from "node:net";
async function run(work:(base:string)=>Promise<void>, fail=false) {
 let received=0;
 const server=createPocServer({receive:async()=>{received++;if(fail)throw new Error("SQL_ERROR_WITH_PRIVATE_DETAILS");return "ACCEPTED";}});
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 try{await work(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);}finally{await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
 return received;
}
const headers={"content-type":"application/x-www-form-urlencoded","x-twilio-signature":SYNTHETIC_SIGNATURE};
describe("HTTP admission negative fixtures",()=>{
 it.each(routes)("route %s refuses unsigned cookie authorization",async route=>{
  expect(await run(async base=>{const response=await fetch(base+`/poc/webhooks/twilio/${route}`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded",cookie:"session=A"},body:SYNTHETIC_CALLBACK});expect(response.status).toBe(403);expect(await response.text()).toBe("");})).toBe(0);
 });
 it("rejects oversized bodies, wrong MIME, query and method",async()=>{
  expect(await run(async base=>{
   const path=base+"/poc/webhooks/twilio/call-status";
   expect((await fetch(path,{method:"POST",headers,body:"x="+"x".repeat(33000)})).status).toBe(413);
   expect((await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:"{}"})).status).toBe(415);
   expect((await fetch(path+"?organizationId=B",{method:"POST",headers,body:SYNTHETIC_CALLBACK})).status).toBe(404);
   expect((await fetch(path)).status).toBe(405);
  })).toBe(0);
 });
 it("responds 503 if persistence fails and reveals no SQL/body details",async()=>{
  expect(await run(async base=>{const response=await fetch(base+"/poc/webhooks/twilio/call-status",{method:"POST",headers,body:SYNTHETIC_CALLBACK});expect(response.status).toBe(503);expect(await response.text()).toBe("");},true)).toBe(1);
 });
 it("proxy headers cannot change canonical signing URL",async()=>{
  expect(await run(async base=>{const response=await fetch(base+"/poc/webhooks/twilio/call-status",{method:"POST",headers:{...headers,host:"untrusted.example","x-forwarded-proto":"https","x-forwarded-host":"untrusted.example"},body:SYNTHETIC_CALLBACK});expect(response.status).toBe(204);})).toBe(1);
 });
 it("limits incoming request floods independently of downstream effects",async()=>{
  expect(await run(async base=>{const responses=await Promise.all(Array.from({length:40},()=>fetch(base+"/poc/webhooks/twilio/call-status",{method:"POST",headers,body:SYNTHETIC_CALLBACK})));expect(responses.some(r=>r.status===429)).toBe(true);})).toBeLessThanOrEqual(30);
 });
});
