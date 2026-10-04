import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {actor,organization,createPools,base} from "./fixtures/shell";
const pools=createPools();test.beforeEach(()=>pools.identity.query("DELETE FROM auth_rate_limit"));test.afterAll(async()=>{await pools.identity.end();await pools.migration.end();});
test("CRM API A/B denies cross-tenant and strict mutations",async({playwright,page,context})=> {
 const a=context.request,b=await playwright.request.newContext();
 await actor(a,pools.identity);await actor(b,pools.identity);
 const oa=await organization(a,"Synthetic CRM A"),ob=await organization(b,"SECRET_CRM_B");
 const url=(org:string,kind:string,id="")=>`${base}/api/crm/${org}/${kind}${id?`/${id}`:""}`;
 const c=await b.post(url(ob,"contacts"),{headers:{origin:base},data:{name:"SECRET_CONTACT_B",phone:"+33123456789",email:null}});expect(c.status()).toBe(201);
 const id=(await c.json()).id;
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
 page.on("response",r=>{if(r.url().startsWith(base)&&/text|json|javascript/.test(r.headers()["content-type"]??""))payloads.push((async()=>{let body:string;try{body=await r.text();}catch{return;}expect(body).not.toContain("SECRET_CONTACT_B");expect(body).not.toContain("SECRET_CRM_B");})());});
 for(const screen of ["contacts","opportunities","services","today"]){
  await page.goto(`/app/${oa}/${screen}`);await expect(page.getByTestId("organization-name")).toHaveText("Synthetic CRM A");
  await page.goto(`/app/${ob}/${screen}`);await expect(page.getByTestId("access-denied")).toBeVisible();
  for(const headers of [{},{RSC:"1"}]){const r=await a.get(`${base}/app/${ob}/${screen}`,{headers});expect(await r.text()).not.toContain("SECRET_CONTACT_B");}
 }
 await Promise.all(payloads);await b.dispose();
});
