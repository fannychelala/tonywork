import {randomUUID} from "node:crypto";
import {test,expect} from "@playwright/test";
import {actor,organization,createPools,base} from "./fixtures/shell";
const pools=createPools();test.beforeEach(()=>pools.identity.query("DELETE FROM auth_rate_limit"));test.afterAll(async()=>{await pools.identity.end();await pools.migration.end();});
test("CRM API CRUD, version, replay and tenant permissions",async({context,playwright})=>{
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic CRM flow");
 const api=`${base}/api/crm/${org}`,headers={origin:base};
 const post=async(kind:string,data:object)=>{const r=await context.request.post(`${api}/${kind}`,{headers,data});expect(r.status()).toBe(201);return r.json();};
 const c=await post("contacts",{name:"Synthetic contact",phone:"+33612345678",email:null});
 expect((await context.request.post(`${api}/contacts`,{headers,data:{name:"Duplicate",phone:c.phone,email:null}})).status()).toBe(409);
 const service=await post("services",{name:"Synthetic service",currency:"EUR",description:null,averageAmountMinor:120000,minAmountMinor:90000,maxAmountMinor:170000,durationMinutes:240,active:true});
 const input={title:"Synthetic opportunity",contactId:c.id,serviceTemplateId:service.id,description:null};
 const opp=await post("opportunities",input),replay=await post("opportunities",input);expect(replay.id).not.toBe(opp.id);
 const task=await post("tasks",{title:"Synthetic task",opportunityId:opp.id,dueAt:null});
 const changes=await Promise.all([context.request.patch(`${api}/tasks/${task.id}`,{headers,data:{version:1,status:"DONE"}}),context.request.patch(`${api}/tasks/${task.id}`,{headers,data:{version:1,status:"DONE"}})]);expect(changes.map(r=>r.status()).sort()).toEqual([200,409]);
 const done=await (await context.request.get(`${api}/tasks/${task.id}`)).json();expect(done.completedAt).not.toBeNull();
 expect((await context.request.patch(`${api}/tasks/${task.id}`,{headers,data:{version:2,status:"OPEN"}})).status()).toBe(200);
 expect((await context.request.delete(`${api}/contacts/${c.id}`,{headers,data:{version:1}})).status()).toBe(409);
 expect((await context.request.patch(`${api}/opportunities/${opp.id}`,{headers,data:{version:1,status:"ARCHIVED"}})).status()).toBe(200);
 expect((await context.request.patch(`${api}/opportunities/${opp.id}`,{headers,data:{version:2,status:"WON"}})).status()).toBe(400);
 expect((await context.request.patch(`${api}/opportunities/${opp.id}`,{headers,data:{version:2,status:"NEW"}})).status()).toBe(200);
 for(const kind of ["contacts","services","opportunities","tasks","today"]){const r=await context.request.get(`${api}/${kind}`);expect(r.status()).toBe(200);expect(r.headers()["cache-control"]).toContain("no-store");expect(await r.text()).not.toContain("session");}
 const member=await playwright.request.newContext();const uid=await actor(member,pools.identity);
 await pools.migration.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'MEMBER\')',[randomUUID(),org,uid]);
 expect((await member.get(`${api}/contacts`)).status()).toBe(200);
 expect((await member.post(`${api}/contacts`,{headers,data:{name:"Denied",phone:"+33699999999",email:null}})).status()).toBe(403);
 expect((await member.patch(`${api}/contacts/${c.id}`,{headers,data:{version:1,name:"Denied"}})).status()).toBe(403);
 expect((await member.delete(`${api}/contacts/${c.id}`,{headers,data:{version:1}})).status()).toBe(403);
 await member.dispose();
});
test("Today uses existing organization timezone and half-open civil bounds",async({context})=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic timezone");const api=`${base}/api/crm/${org}`,headers={origin:base};
 const post=async(kind:string,data:object)=>{const r=await context.request.post(`${api}/${kind}`,{headers,data});expect(r.status()).toBe(201);return r.json();};
 const c=await post("contacts",{name:"Timezone contact",phone:"+33712345678",email:null});const o=await post("opportunities",{title:"Timezone opportunity",contactId:c.id,serviceTemplateId:null,description:null});
 const first=await (await context.request.get(`${api}/today`)).json();expect(first.timeZone).toBe("Europe/Paris");
 for(const [title,dueAt] of [["at-start",first.start],["at-end",first.finish],["overdue",new Date(new Date(first.start).getTime()-1).toISOString()],["undated",null]])await post("tasks",{title,opportunityId:o.id,dueAt});
 const data=await (await context.request.get(`${api}/today`)).json();expect(data.due.map((r:{title:string})=>r.title)).toEqual(["at-start"]);expect(data.overdue.map((r:{title:string})=>r.title)).toEqual(["overdue"]);
 expect((await context.request.get(`${api}/today?timeZone=UTC`)).status()).toBe(400);
 const other=await context.request.post(`${base}/api/organizations`,{headers,data:{name:"Other timezone",defaultLocale:"en-GB",currency:"USD",timeZone:"America/New_York"}});expect(other.status()).toBe(201);const oid=(await other.json()).id;
 expect((await (await context.request.get(`${base}/api/crm/${oid}/today`)).json()).timeZone).toBe("America/New_York");
});
test("CRM bounded pagination/search and measured synthetic round-trip",async({context},info)=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic pagination");const api=`${base}/api/crm/${org}/contacts`,headers={origin:base};
 for(let i=0;i<30;i++){const r=await context.request.post(api,{headers,data:{name:`Synthetic page ${String(i).padStart(2,"0")}`,phone:`+3390000${String(i).padStart(4,"0")}`,email:null}});expect(r.status()).toBe(201);}
 const first=await (await context.request.get(api)).json();expect(first.items).toHaveLength(25);expect(first.nextCursor).not.toBeNull();
 const second=await (await context.request.get(`${api}?cursor=${first.nextCursor}`)).json();expect(second.items).toHaveLength(5);expect(second.nextCursor).toBeNull();
 expect(new Set([...first.items,...second.items].map((r:{id:string})=>r.id)).size).toBe(30);
 const result=await (await context.request.get(`${api}?q=${encodeURIComponent("page 29")}`)).json();expect(result.items).toHaveLength(1);
 expect((await (await context.request.get(`${api}?q=${encodeURIComponent("%' OR true --")}`)).json()).items).toEqual([]);
 const times:number[]=[];for(let i=0;i<20;i++){const start=performance.now();const r=await context.request.get(api);expect(r.status()).toBe(200);await r.body();times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);const measurement={scope:"CI synthetic HTTP round-trip, not production server P95",records:30,samples:20,p50Ms:times[9],p95Ms:times[18],maxMs:times[19]};
 console.log(JSON.stringify(measurement));await info.attach("crm-performance.json",{body:JSON.stringify(measurement,null,2),contentType:"application/json"});
});
