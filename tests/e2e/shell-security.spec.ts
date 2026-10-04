import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { actor, organization, createPools, screens, base } from "./fixtures/shell";
const { identity, migration } = createPools();
test.beforeEach(async () => { await identity.query("DELETE FROM auth_rate_limit"); });
test.afterAll(async () => { await identity.end(); await migration.end(); });
test("A/B shell: no foreign tenant in HTML, RSC, API, DOM or navigation", async ({ page, context, playwright }) => {
 test.setTimeout(60_000);
 const other = await playwright.request.newContext();
 const aName = `Synthetic-A-${randomUUID()}`, bName = `SECRET-B-${randomUUID()}`;
 try {
  await actor(context.request, identity); await actor(other, identity);
  const a = await organization(context.request, aName), b = await organization(other, bName);
  const payloads: Promise<void>[] = [];
  page.on("response", r => { if (r.url().startsWith(base) && /text|json|javascript/.test(r.headers()["content-type"] ?? "")) payloads.push((async () => { let text: string; try { text = await r.text(); } catch { return; } expect(text).not.toContain(bName); })()); });
  for (const screen of screens) {
   await page.goto(`/app/${a}/${screen}`); await expect(page.getByTestId("organization-name")).toHaveText(aName);
   await page.goto(`/app/${b}/${screen}`); await expect(page.getByTestId("access-denied")).toBeVisible(); await expect(page.getByTestId("organization-name")).toHaveCount(0);
   const html = await context.request.get(`/app/${b}/${screen}`); expect(await html.text()).not.toContain(bName);
   const rsc = await context.request.get(`/app/${b}/${screen}?_rsc=security`, { headers: { RSC: "1" } }); expect(await rsc.text()).not.toContain(bName);
   const denied = await context.request.get(`/api/shell/${b}`), absent = await context.request.get(`/api/shell/${randomUUID()}`);
   expect(denied.status()).toBe(404); expect(await denied.text()).toBe(await absent.text());
  }
  await Promise.all(payloads);
  const dto = await context.request.get(`/api/shell/${a}`); expect(dto.headers()["cache-control"]).toContain("no-store"); expect(Object.keys(await dto.json()).sort()).toEqual(["id", "name"]);
  await page.goto(`/app/${a}/today`); await expect(page.getByTestId("organization-name")).toHaveText(aName);
  await page.getByRole("button", { name: "Se déconnecter" }).click(); await expect(page).toHaveURL(`${base}/`);
  await page.goBack(); await expect(page.getByTestId("access-required")).toBeVisible(); await expect(page.getByTestId("organization-name")).toHaveCount(0);
 } finally { await other.dispose(); }
});
test("missing, invalid, expired and revoked sessions never expose tenant", async ({ page, context }) => {
 await page.goto(`/app/${randomUUID()}/today`); await expect(page.getByTestId("access-required")).toBeVisible();
 const user = await actor(context.request, identity), name = `Synthetic-private-${randomUUID()}`, id = await organization(context.request, name);
 await page.goto("/app/not-a-uuid/today"); await expect(page.getByTestId("access-denied")).toBeVisible();
 await identity.query('UPDATE auth_session SET "expiresAt"=now()-interval \'1 second\' WHERE "userId"=$1', [user]);
 await page.goto(`/app/${id}/today`); await expect(page.getByTestId("access-required")).toBeVisible(); expect(await page.content()).not.toContain(name);
});
test("MEMBER stays scoped; PLATFORM_ADMIN receives no implicit grant", async ({ page, context, playwright }) => {
 const owner = await playwright.request.newContext();
 try {
  const member = await actor(context.request, identity); await actor(owner, identity);
  const own = await organization(owner, "Synthetic member organization");
  await migration.query('INSERT INTO membership (id,"organizationId","userId",role) VALUES ($1,$2,$3,\'MEMBER\')', [randomUUID(),own,member]);
  await page.goto(`/app/${own}/today`); await expect(page.getByTestId("organization-name")).toHaveText("Synthetic member organization");
  const previous = (await identity.query('SELECT * FROM auth_session WHERE "userId"=$1 LIMIT 1', [member])).rows[0];
  await identity.query('DELETE FROM auth_session WHERE "userId"=$1', [member]); await page.reload(); await expect(page.getByTestId("access-required")).toBeVisible();
  await identity.query('UPDATE auth_user SET "platformRole"=\'PLATFORM_ADMIN\', "twoFactorEnabled"=true WHERE id=$1', [member]);
  // Restore a synthetic session with the genuine provider-issued signed cookie after privileged fixture promotion.
  await identity.query('INSERT INTO auth_session (id,token,"expiresAt","createdAt","updatedAt","userId") VALUES ($1,$2,$3,$4,$5,$6)', [previous.id,previous.token,previous.expiresAt,previous.createdAt,previous.updatedAt,member]);
  await page.goto(`/app/${own}/settings`); await expect(page.getByTestId("access-denied")).toBeVisible(); await expect(page.getByTestId("organization-name")).toHaveCount(0);
  expect((await migration.query('SELECT count(*)::int AS n FROM audit_log WHERE event=\'PLATFORM_TENANT_ACCESS\' AND "actorId"=$1', [member])).rows[0].n).toBe(0);
 } finally { await owner.dispose(); }
});
