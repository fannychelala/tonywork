import {test,expect} from "@playwright/test";
import {randomUUID} from "node:crypto";
import {actor,organization,createPools,base} from "./fixtures/shell";
const pools=createPools();test.beforeEach(()=>pools.identity.query("DELETE FROM auth_rate_limit"));test.afterAll(async()=>{await pools.identity.end();await pools.migration.end();});
test("CRM UI creation, editing, focus, deletion and 320px",async({page,context},info)=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Atelier synthétique CRM");
 await page.goto(`/app/${org}/contacts`);const create=page.getByRole("button",{name:"Créer — Contacts",exact:true});await create.focus();await page.keyboard.press("Enter");
 let dialog=page.getByRole("dialog",{name:"Créer — Contacts",exact:true});await expect(dialog.getByRole("button",{name:"Fermer"})).toBeFocused();
 await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(dialog.getByRole("alert").first()).toBeVisible();await page.screenshot({path:info.outputPath("contact-form-error.png"),fullPage:true});
 await dialog.getByLabel("Nom",{exact:true}).fill("Contact synthétique");await dialog.getByLabel("Téléphone international").fill("+33612345678");
 let submissions=0;await page.route(`**/api/crm/${org}/contacts`,async route=>{if(route.request().method()==="POST"){submissions++;await new Promise(r=>setTimeout(r,600));}await route.continue();});
 await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(dialog.getByRole("button",{name:"Enregistrer",exact:true})).toBeDisabled();await dialog.locator("form").evaluate(f=>{f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));});
 await expect(page.getByRole("heading",{name:"Contact synthétique",exact:true})).toBeVisible();expect(submissions).toBe(1);await page.unroute(`**/api/crm/${org}/contacts`);await expect(dialog).not.toBeVisible();await expect(create).toBeFocused();
 await page.screenshot({path:info.outputPath("contacts.png"),fullPage:true});
 const c=(await (await context.request.get(`${base}/api/crm/${org}/contacts`)).json()).items[0];
 await page.goto(`/app/${org}/services`);await page.getByRole("button",{name:"Créer — Prestations",exact:true}).click();dialog=page.getByRole("dialog",{name:"Créer — Prestations",exact:true});
 await dialog.getByLabel("Nom",{exact:true}).fill("Prestation synthétique");await dialog.getByLabel("Devise",{exact:true}).selectOption("GBP");await dialog.getByLabel("Valeur moyenne indicative").fill("100.00");await dialog.getByLabel("Durée indicative (minutes)").fill("60");
 await page.screenshot({path:info.outputPath("service-form.png"),fullPage:true});await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole("heading",{name:"Prestation synthétique",exact:true})).toBeVisible();await page.screenshot({path:info.outputPath("services.png"),fullPage:true});
 await page.goto(`/app/${org}/opportunities`);await page.getByRole("button",{name:"Créer — Opportunités",exact:true}).click();dialog=page.getByRole("dialog",{name:"Créer — Opportunités",exact:true});
 await dialog.getByLabel("Intitulé",{exact:true}).fill("Opportunité synthétique");await expect(dialog.getByLabel("Contact",{exact:true}).getByRole("option",{name:"Contact synthétique"})).toHaveCount(1);await dialog.getByLabel("Contact",{exact:true}).selectOption(c.id);await page.screenshot({path:info.outputPath("opportunity-form.png"),fullPage:true});
 await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(page.getByRole("heading",{name:"Opportunité synthétique",exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Modifier",exact:true}).click();dialog=page.getByRole("dialog",{name:"Modifier — Opportunité synthétique",exact:true});await expect(dialog.getByLabel("Contact",{exact:true}).getByRole("option",{name:"Contact synthétique"})).toHaveCount(1);await expect(dialog.getByLabel("Contact",{exact:true})).toHaveValue(c.id);await dialog.getByLabel("État",{exact:true}).selectOption("ARCHIVED");await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(dialog).not.toBeVisible();await expect(page.locator(".crm-list > li > p")).toHaveText("Archivé");
 await page.screenshot({path:info.outputPath("opportunities.png"),fullPage:true});
 await page.goto(`/app/${org}/today`);await page.getByRole("button",{name:"Créer — Tâches",exact:true}).click();dialog=page.getByRole("dialog",{name:"Créer — Tâches",exact:true});await dialog.getByLabel("Intitulé",{exact:true}).fill("Tâche synthétique");await dialog.getByLabel("Échéance UTC (facultative)").fill(new Date().toISOString());const opp=(await (await context.request.get(`${base}/api/crm/${org}/opportunities`)).json()).items[0];await expect(dialog.getByLabel("Opportunité",{exact:true}).getByRole("option",{name:"Opportunité synthétique"})).toHaveCount(1);await dialog.getByLabel("Opportunité",{exact:true}).selectOption(opp.id);await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(page.getByRole("heading",{name:"Tâche synthétique",exact:true})).toBeVisible();
 await page.setViewportSize({width:320,height:720});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath("today-320.png"),fullPage:true});
 await page.getByRole("button",{name:"Supprimer",exact:true}).click();dialog=page.getByRole("dialog",{name:"Confirmer la suppression — Tâche synthétique",exact:true});await page.keyboard.press("Escape");await expect(page.getByRole("button",{name:"Supprimer",exact:true})).toBeFocused();await page.getByRole("button",{name:"Supprimer",exact:true}).click();await dialog.getByRole("button",{name:"Confirmer la suppression",exact:true}).click();await expect(page.getByRole("heading",{name:"Tâche synthétique",exact:true})).toHaveCount(0);
});
test("CRM revoked session removes open private form and history data",async({page,context})=> {
 const user=await actor(context.request,pools.identity),org=await organization(context.request,"Synthetic revocation");
 const r=await context.request.post(`${base}/api/crm/${org}/contacts`,{headers:{origin:base},data:{name:"PRIVATE_A_CONTACT",phone:"+33798765432",email:null}});expect(r.status()).toBe(201);
 await page.goto(`/app/${org}/contacts`);await expect(page.getByRole("heading",{name:"PRIVATE_A_CONTACT"})).toBeVisible();await page.getByRole("button",{name:"Modifier",exact:true}).click();
 await pools.identity.query('DELETE FROM auth_session WHERE "userId"=$1',[user]);
 await page.getByRole("dialog",{name:"Modifier — PRIVATE_A_CONTACT"}).getByRole("button",{name:"Enregistrer",exact:true}).click();
 await expect(page.getByTestId("access-required")).toBeVisible();await expect(page.getByText("PRIVATE_A_CONTACT",{exact:true})).toHaveCount(0);await expect(page.getByRole("dialog")).toHaveCount(0);
 await page.goto("/");await page.goBack();await expect(page.getByTestId("access-required")).toBeVisible();await expect(page.getByText("PRIVATE_A_CONTACT",{exact:true})).toHaveCount(0);
});
test("CRM delayed authorized response cannot restore DOM after pagehide",async({page,context})=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic delayed response");
 expect((await context.request.post(`${base}/api/crm/${org}/contacts`,{headers:{origin:base},data:{name:"DELAYED_PRIVATE_CONTACT",phone:"+33787654321",email:null}})).status()).toBe(201);
 const payload=await (await context.request.get(`${base}/api/crm/${org}/contacts?q=`)).body();
 await page.goto(`/app/${org}/contacts`);await expect(page.getByRole("heading",{name:"DELAYED_PRIVATE_CONTACT",exact:true})).toBeVisible();
 let release!:()=>void,served!:()=>void;const wait=new Promise<void>(r=>{release=r;}),done=new Promise<void>(r=>{served=r;});
 const started=page.waitForRequest(r=>r.url().includes(`/api/crm/${org}/contacts?`)&&r.method()==="GET");
 await page.route(`**/api/crm/${org}/contacts?**`,async route=>{await wait;await route.fulfill({status:200,body:payload,headers:{"content-type":"application/json","cache-control":"private, no-store"}}).catch(()=>{});served();});
 await page.getByRole("button",{name:"Réessayer",exact:true}).click();await started;
 expect(await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));return document.querySelector(".shell-private")===null;})).toBe(true);
 release();await done;await expect(page.getByText("DELAYED_PRIVATE_CONTACT",{exact:true})).toHaveCount(0);
 await page.unroute(`**/api/crm/${org}/contacts?**`);await page.reload();await expect(page.getByRole("heading",{name:"DELAYED_PRIVATE_CONTACT",exact:true})).toBeVisible();
});
test("CRM maximal unbroken titles fit 320px",async({page,context})=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic long text"),headers={origin:base};
 const c=await context.request.post(`${base}/api/crm/${org}/contacts`,{headers,data:{name:"C".repeat(120),phone:"+33776543210",email:null}});expect(c.status()).toBe(201);
 const o=await context.request.post(`${base}/api/crm/${org}/opportunities`,{headers,data:{title:"O".repeat(160),description:null,contactId:(await c.json()).id,serviceTemplateId:null}});expect(o.status()).toBe(201);
 expect((await context.request.post(`${base}/api/crm/${org}/tasks`,{headers,data:{title:"T".repeat(160),opportunityId:(await o.json()).id,dueAt:new Date().toISOString()}})).status()).toBe(201);
 await page.setViewportSize({width:320,height:720});
 for(const screen of ["today","contacts","opportunities"]){await page.goto(`/app/${org}/${screen}`);await expect(page.locator(".crm-list > li")).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole("button",{name:"Modifier",exact:true}).click();await expect(page.getByRole("dialog")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.keyboard.press("Escape");}
});
test("CRM committed creation with lost HTTP response is not automatically replayed",async({page,context})=> {
 await actor(context.request,pools.identity);const org=await organization(context.request,"Synthetic uncertain creation");
 await page.goto(`/app/${org}/contacts`);await page.getByRole("button",{name:"Créer — Contacts",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"Créer — Contacts",exact:true});await dialog.getByLabel("Nom",{exact:true}).fill("COMMITTED_SYNTHETIC_CONTACT");await dialog.getByLabel("Téléphone international").fill("+33765432109");
 let posts=0;await page.route(`**/api/crm/${org}/contacts`,async route=>{if(route.request().method()!=="POST"){await route.continue();return;}posts++;const committed=await route.fetch();expect(committed.status()).toBe(201);await route.abort("connectionfailed");});
 await dialog.getByRole("button",{name:"Enregistrer",exact:true}).click();await expect(dialog.getByRole("alert").first()).toHaveText("Résultat incertain. Relisez la liste avant de confirmer une nouvelle création. Aucun renvoi automatique n’est effectué.");
 await expect(dialog.getByRole("button",{name:"Enregistrer",exact:true})).toBeEnabled();
 expect((await (await context.request.get(`${base}/api/crm/${org}/contacts`)).json()).items).toHaveLength(1);
 await page.keyboard.press("Escape");await page.getByRole("button",{name:"Réessayer",exact:true}).click();await expect(page.getByRole("heading",{name:"COMMITTED_SYNTHETIC_CONTACT",exact:true})).toHaveCount(1);expect(posts).toBe(1);
 await page.unroute(`**/api/crm/${org}/contacts`);
});
test("CRM MEMBER has readable records and no write UI on any screen",async({page,context,playwright})=> {
 const owner=await playwright.request.newContext();await actor(owner,pools.identity);const org=await organization(owner,"Synthetic member workspace"),api=`${base}/api/crm/${org}`,headers={origin:base};
 const contact={name:"Member-visible contact",phone:"+33754321098",email:null},service={name:"Member-visible service",description:null,currency:"EUR",averageAmountMinor:null,minAmountMinor:null,maxAmountMinor:null,durationMinutes:null,active:true};
 const post=async(kind:string,data:object)=>{const r=await owner.post(`${api}/${kind}`,{headers,data});expect(r.status()).toBe(201);return r.json();};
 const c=await post("contacts",contact),s=await post("services",service),opportunity={title:"Member-visible opportunity",description:null,contactId:c.id,serviceTemplateId:s.id},o=await post("opportunities",opportunity),task={title:"Member-visible task",opportunityId:o.id,dueAt:null};await post("tasks",task);
 const uid=await actor(context.request,pools.identity);await pools.migration.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'MEMBER\')',[randomUUID(),org,uid]);
 for(const [screen,name,kind,input] of [["contacts",contact.name,"contacts",contact],["services",service.name,"services",service],["opportunities",opportunity.title,"opportunities",opportunity],["today",task.title,"tasks",task]] as const){
  await page.goto(`/app/${org}/${screen}`);await expect(page.getByRole("heading",{name,exact:true})).toBeVisible();await expect(page.getByText("Lecture seule",{exact:true})).toBeVisible();await expect(page.getByRole("button",{name:/^(Créer|Modifier|Supprimer)/})).toHaveCount(0);await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByText("Voir la fiche",{exact:true}).focus();await page.keyboard.press("Enter");await expect(page.locator("details[open]")).toHaveCount(1);expect((await context.request.post(`${api}/${kind}`,{headers,data:input})).status()).toBe(403);
 }
 await owner.dispose();
});
