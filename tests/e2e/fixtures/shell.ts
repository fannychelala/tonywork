import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { expect, type APIRequestContext } from "@playwright/test";
export const base = "http://127.0.0.1:3000";
export function createPools() { return { identity: new Pool({ connectionString: process.env.AUTH_DATABASE_URL }), migration: new Pool({ connectionString: process.env.MIGRATION_DATABASE_URL }) }; }
export const screens = ["today", "opportunities", "contacts", "services", "settings"];
export async function actor(request: APIRequestContext, identity: Pool) {
 const email = `${randomUUID()}@example.invalid`, password = "Synthetic-shell-password-42!";
 expect((await request.post(`${base}/api/auth/sign-up/email`, { headers: { origin: base }, data: { name: "Synthetic shell", email, password } })).status()).toBe(200);
 const mail = await identity.query("SELECT url FROM auth_mail WHERE recipient=$1", [email]);
 expect((await request.get(mail.rows[0].url)).status()).toBeLessThan(400);
 expect((await request.post(`${base}/api/auth/sign-in/email`, { headers: { origin: base }, data: { email, password } })).status()).toBe(200);
 return (await (await request.get(`${base}/api/auth/get-session`)).json()).user.id as string;
}
export async function organization(request: APIRequestContext, name: string) {
 const response = await request.post(`${base}/api/organizations`, { headers: { origin: base }, data: { name, defaultLocale: "fr-FR", currency: "EUR", timeZone: "Europe/Paris" } });
 expect(response.status()).toBe(201); return (await response.json()).id as string;
}
