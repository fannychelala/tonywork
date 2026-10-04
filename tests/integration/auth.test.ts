import "dotenv/config";
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, it, expect } from "vitest";
import { createAuth } from "../../src/modules/auth/auth";
const { auth, db } = createAuth(process.env);
const base = process.env.BETTER_AUTH_URL!;
// Each scenario starts with independent limiter state; the dedicated limit test keeps every attempt.
beforeEach(async () => { await db.rateLimit.deleteMany(); });
afterAll(async () => { await db.rateLimit.deleteMany(); await db.$disconnect(); });
async function request(path: string, body?: object, cookie?: string) {
 return auth.handler(new Request(`${base}/api/auth${path}`, { method: body ? "POST" : "GET", headers: { "content-type": "application/json", origin: base, ...(cookie ? { cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
}
it("Better Auth signup, verification, login, password hashing, revoke, invalid credentials and privilege injection", async () => {
 const email = `${randomUUID()}@example.invalid`; const password = "Synthetic-password-42!";
 const signup = await request("/sign-up/email", { name: "Synthetic", email, password, platformRole: "PLATFORM_ADMIN", twoFactorEnabled: true });
 expect(signup.status).toBe(200);
 const user = await db.user.findUniqueOrThrow({ where: { email } });
 expect(user.platformRole).toBe("USER"); expect(user.twoFactorEnabled).toBe(false); expect(user.emailVerified).toBe(false);
 const account = await db.account.findFirstOrThrow({ where: { userId: user.id } }); expect(account.password).not.toBe(password); expect(account.password?.length).toBeGreaterThan(32);
 expect((await request("/sign-in/email", { email, password })).status).toBe(403);
 const mail = await db.authMail.findFirstOrThrow({ where: { recipient: email, kind: "verification" }, orderBy: { createdAt: "desc" } });
 const verified = await auth.handler(new Request(mail.url)); expect(verified.status).toBeLessThan(400);
 expect((await request("/sign-in/email", { email, password: "Wrong-password-42!" })).status).toBe(401);
 const login = await request("/sign-in/email", { email, password }); expect(login.status).toBe(200);
 const cookie = login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
 expect(cookie).toContain("session_token"); expect(login.headers.get("set-cookie")).toMatch(/httponly/i); expect(login.headers.get("set-cookie")).toMatch(/samesite=lax/i);
 const session = await request("/get-session", undefined, cookie); expect((await session.json()).user.id).toBe(user.id);
 expect((await request("/sign-out", {}, cookie)).status).toBe(200);
 expect(await (await request("/get-session", undefined, cookie)).json()).toBeNull();
 expect((await request("/sign-up/email", { name: "Synthetic", email: `${randomUUID()}@example.invalid`, password: "short" })).status).toBe(400);
 const csrf = await auth.handler(new Request(`${base}/api/auth/sign-in/email`, { method: "POST", headers: { origin: "https://foreign.invalid", "content-type": "application/json" }, body: JSON.stringify({ email, password }) })); expect(csrf.status).toBe(403);
});
it("password reset revokes sessions and the old password", async () => {
 const email = `${randomUUID()}@example.invalid`; const password = "Original-password-42!";
 await request("/sign-up/email", { name: "Synthetic", email, password });
 const mail = await db.authMail.findFirstOrThrow({ where: { recipient: email, kind: "verification" } }); await auth.handler(new Request(mail.url));
 const login = await request("/sign-in/email", { email, password }); expect(login.status).toBe(200);
 const cookie = login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
 expect((await request("/request-password-reset", { email, redirectTo: base })).status).toBe(200);
 const resetMail = await db.authMail.findFirstOrThrow({ where: { recipient: email, kind: "password_reset" } });
 const token = new URL(resetMail.url).pathname.split("/").at(-1)!;
 expect((await request("/reset-password", { token, newPassword: "Changed-password-42!" })).status).toBe(200);
 expect(await (await request("/get-session", undefined, cookie)).json()).toBeNull();
 expect((await request("/sign-in/email", { email, password })).status).toBe(401);
 expect((await request("/sign-in/email", { email, password: "Changed-password-42!" })).status).toBe(200);
});

it("MFA requires a successful second factor before granting a login session", async () => {
 const email = `${randomUUID()}@example.invalid`; const password = "MFA-synthetic-password-42!";
 expect((await request("/sign-up/email", { name: "Synthetic MFA", email, password })).status).toBe(200);
 const mail = await db.authMail.findFirstOrThrow({ where: { recipient: email, kind: "verification" } }); await auth.handler(new Request(mail.url));
 const login = await request("/sign-in/email", { email, password }); expect(login.status).toBe(200);
 let cookie = login.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
 const enable = await request("/two-factor/enable", { password }, cookie); expect(enable.status).toBe(200);
 const data = await enable.json(); const secret = new URL(data.totpURI).searchParams.get("secret")!;
 const { createHmac } = await import("node:crypto");
 function code() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.toUpperCase().replace(/=+$/, "")].map(c => alphabet.indexOf(c).toString(2).padStart(5,"0")).join("");
  const bytes = Buffer.from(bits.match(/.{8}/g)!.map(b => parseInt(b,2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30_000)));
  const digest = createHmac("sha1",bytes).update(counter).digest(); const offset = digest[digest.length-1]! & 15;
  return ((digest.readUInt32BE(offset)&0x7fffffff)%1_000_000).toString().padStart(6,"0");
 }
 expect((await request("/two-factor/verify-totp", { code: code() }, cookie)).status).toBe(200);
 expect((await db.user.findUniqueOrThrow({ where: { email } })).twoFactorEnabled).toBe(true);
 await request("/sign-out", {}, cookie);
 const challenge = await request("/sign-in/email", { email, password }); expect(challenge.status).toBe(200); expect((await challenge.json()).twoFactorRedirect).toBe(true);
 cookie = challenge.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
 expect(await (await request("/get-session", undefined, cookie)).json()).toBeNull();
 expect((await request("/two-factor/verify-totp", { code: "invalid" }, cookie)).status).toBeGreaterThanOrEqual(400);
 const verified = await request("/two-factor/verify-totp", { code: code() }, cookie); expect(verified.status).toBe(200);
 cookie = verified.headers.getSetCookie().map(c => c.split(";")[0]).join("; ");
 expect((await (await request("/get-session", undefined, cookie)).json()).user.email).toBe(email);
}, 20_000);
it("rate limiting cannot be bypassed by forged forwarded IP headers", async () => {
 await db.rateLimit.deleteMany();
 let response: Response | undefined;
 for (let i = 0; i < 21; i++) {
  response = await auth.handler(new Request(`${base}/api/auth/sign-in/email`, { method: "POST", headers: { origin: base, "content-type": "application/json", "x-forwarded-for": `192.0.2.${i+1}` }, body: JSON.stringify({ email: "synthetic-missing@example.invalid", password: "Synthetic-password-42!" }) }));
 }
 expect(response?.status).toBe(429);
 expect(response?.headers.get("retry-after")).toBeTruthy();
}, 20_000);
