import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {actor,organization,createPools,base} from "./fixtures/shell";
const pools=createPools();test.beforeEach(()=>pools.identity.query("DELETE FROM auth_rate_limit"));test.afterAll(async()=>{await pools.identity.end();await pools.migration.end();});
test("CRM API A/B denies cross-tenant and strict mutations",async({playwright,page,context})=> {
 const a=context.request,b=await playwright.request.newContext();
 await actor(a,pools.identity);const bUser=await actor(b,pools.identity);
 const oa=await organization(a,"Synthetic CRM A"),ob=await organization(b,"SECRET_CRM_B");
 const url=(org:string,kind:string,id="")=>`${base}/api/crm/${org}/${kind}${id?`/${id}`:""}`;
 const c=await b.post(url(ob,"contacts"),{headers:{origin:base},data:{name:"SECRET_CONTACT_B",phone:"+33123456789",email:null}});expect(c.status()).toBe(201);
 const id=(await c.json()).id;
 const service=await b.post(url(ob,"services"),{headers:{origin:base},data:{name:"SECRET_SERVICE_B",description:"SECRET_DESCRIPTION_B",currency:"GBP",averageAmountMinor:null,minAmountMinor:null,maxAmountMinor:null,durationMinutes:null,active:true}});expect(service.status()).toBe(201);const sid=(await service.json()).id;
 const opportunity=await b.post(url(ob,"opportunities"),{headers:{origin:base},data:{title:"SECRET_OPPORTUNITY_B",description:"SECRET_DESCRIPTION_B",contactId:id,serviceTemplateId:sid}});expect(opportunity.status()).toBe(201);const oid=(await opportunity.json()).id;
 const task=await b.post(url(ob,"tasks"),{headers:{origin:base},data:{title:"SECRET_TASK_B",opportunityId:oid,dueAt:null}});expect(task.status()).toBe(201);
 expect((await a.post(url(oa,"opportunities"),{headers:{origin:base},data:{title:"Foreign parent",description:null,contactId:id,serviceTemplateId:sid}})).status()).toBe(404);
 expect((await a.post(url(oa,"tasks"),{headers:{origin:base},data:{title:"Foreign parent",opportunityId:oid,dueAt:null}})).status()).toBe(404);
 expect((await a.post(url(oa,"contacts"),{headers:{origin:"https://untrusted.example.invalid"},data:{name:"A",phone:"+33123456789",email:null}})).status()).toBe(403);
 expect((await a.post(url(oa,"contacts"),{headers:{origin:base,"content-type":"application/json"},data:'{"name":"'+"x".repeat(17000)+'"}'})).status()).toBe(413);
 expect((await a.get(url(oa,"contacts")+"?limit=51")).status()).toBe(400);
 const anon=await playwright.request.newContext();expect((await anon.get(url(oa,"contacts"))).status()).toBe(401);await anon.dispose();
 for(const kind of ["contacts","opportunities","services","tasks","today"]) {
  const denied=await a.get(url(ob,kind)),missing=await a.get(url(randomUUID(),kind));expect(denied.status()).toBe(404);expect(await denied.text()).toBe(await missing.text());expect(denied.headers()["cache-control"]).toContain("no-store");
 }
 expect((await a.get(url(oa,"contacts",id))).status()).toBe(404);
 expect((await a.patch(url(oa,"contacts",id),{headers:{origin:base},data:{version:1,name:"Forbidden"}})).status()).toBe(404);
 expect((await a.delete(url(oa,"contacts",id),{headers:{origin:base},data:{version:1}})).status()).toBe(404);
 expect((await a.post(url(oa,"contacts"),{data:{name:"A",phone:"+33123456789",email:null}})).status()).toBe(403);
 expect((await a.post(url(oa,"contacts"),{headers:{origin:base},data:{name:"A",phone:"+33123456789",email:null,organizationId:ob}})).status()).toBe(400);
 expect((await b.get(url(ob,"contacts",id))).status()).toBe(200);
 const payloads:Promise<void>[]=[];
 page.on("response",r=>{if(r.url().startsWith(base)&&/text|json|javascript/.test(r.headers()["content-type"]??""))payloads.push((async()=>{let body:string;try{body=await r.text();}catch{return;}for(const marker of ["SECRET_CONTACT_B","SECRET_SERVICE_B","SECRET_OPPORTUNITY_B","SECRET_TASK_B","SECRET_DESCRIPTION_B","SECRET_CRM_B"])expect(body).not.toContain(marker);})());});
 for(const screen of ["contacts","opportunities","services","today"]){
  await page.goto(`/app/${oa}/${screen}`);await expect(page.getByTestId("organization-name")).toHaveText("Synthetic CRM A");
  await page.goto(`/app/${ob}/${screen}`);await expect(page.getByTestId("access-denied")).toBeVisible();
  for(const headers of [{},{RSC:"1"}]){const r=await a.get(`${base}/app/${ob}/${screen}`,{headers});expect(await r.text()).not.toContain("SECRET_CONTACT_B");}
 }
 await Promise.all(payloads);
 const session=(await pools.identity.query('SELECT * FROM auth_session WHERE "userId"=$1',[bUser])).rows[0];
 await pools.identity.query('UPDATE auth_user SET "platformRole"=\'PLATFORM_ADMIN\',"twoFactorEnabled"=true WHERE id=$1',[bUser]);
 await pools.identity.query('INSERT INTO auth_session (id,token,"userId","expiresAt","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6)',[session.id,session.token,bUser,session.expiresAt,session.createdAt,session.updatedAt]);
 expect((await (await b.get(`${base}/api/auth/get-session`)).json()).user.platformRole).toBe("PLATFORM_ADMIN");
 const before=(await pools.migration.query("SELECT count(*)::int AS n FROM audit_log WHERE event='PLATFORM_TENANT_ACCESS' AND \"actorId\"=$1",[bUser])).rows[0].n;
 for(const kind of ["contacts","services","opportunities","tasks","today"])expect((await b.get(url(ob,kind))).status()).toBe(404);
 expect((await pools.migration.query("SELECT count(*)::int AS n FROM audit_log WHERE event='PLATFORM_TENANT_ACCESS' AND \"actorId\"=$1",[bUser])).rows[0].n).toBe(before);
 await b.dispose();
});
