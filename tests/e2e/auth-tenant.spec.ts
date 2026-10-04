import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { test, expect, type APIRequestContext } from "@playwright/test";
const base = "http://127.0.0.1:3000";
const identities = new Pool({ connectionString: process.env.AUTH_DATABASE_URL });
test.afterAll(async () => { await identities.end(); });
async function signupAndLogin(request: APIRequestContext) {
 const email = `${randomUUID()}@example.invalid`; const password = "Synthetic-password-42!";
 const signup = await request.post("/api/auth/sign-up/email", { headers: { origin: base }, data: { name: "Synthetic E2E", email, password, platformRole: "PLATFORM_ADMIN" } }); expect(signup.status()).toBe(200);
 const mail = await identities.query("SELECT url FROM auth_mail WHERE recipient=$1 AND kind='verification' ORDER BY \"createdAt\" DESC LIMIT 1", [email]);
 expect(mail.rows).toHaveLength(1);
 expect((await request.get(mail.rows[0].url)).status()).toBeLessThan(400);
 const login = await request.post("/api/auth/sign-in/email", { headers: { origin: base }, data: { email, password } }); expect(login.status()).toBe(200);
 const session = await request.get("/api/auth/get-session"); const body = await session.json(); expect(body.user.platformRole).toBe("USER"); expect(body.session.token).toBeUndefined();
}
test("session authorization and cross-tenant API requests", async ({ playwright, request }) => {
 const other = await playwright.request.newContext({ baseURL: base });
 try {
  await signupAndLogin(request); await signupAndLogin(other);
  const data = { name: "Synthetic organization", defaultLocale: "fr-FR", currency: "EUR", timeZone: "Europe/Paris" };
  const one = await request.post("/api/organizations", { headers: { origin: base }, data }); expect(one.status()).toBe(201);
  const two = await other.post("/api/organizations", { headers: { origin: base }, data }); expect(two.status()).toBe(201);
  const a = (await one.json()).id; const b = (await two.json()).id;
  const own = await request.get(`/api/organizations/${a}`); expect(own.status()).toBe(200); expect((await own.json()).organization.id).toBe(a);
  expect((await request.get(`/api/organizations/${b}`)).status()).toBe(404);
  expect((await other.get(`/api/organizations/${a}`)).status()).toBe(404);
  expect((await request.get(`/api/organizations/${randomUUID()}`)).status()).toBe(404);
  expect((await request.get("/api/organizations/not-a-uuid")).status()).toBe(404);
  expect((await request.post(`/api/platform/organizations/${b}`, { headers: { origin: base }, data: { reason: "Synthetic support review" } })).status()).toBe(404);
  expect((await request.post("/api/organizations", { headers: { origin: "https://foreign.invalid" }, data })).status()).toBe(403);
  expect((await request.post("/api/auth/sign-out", { headers: { origin: base }, data: {} })).status()).toBe(200);
  expect((await request.get(`/api/organizations/${a}`)).status()).toBe(401);
 } finally { await other.dispose(); }
});
