import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { twoFactor } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../db/generated/client";
import { parseAuthEnvironment } from "./environment";
export function createAuth(input: unknown) {
 const env = parseAuthEnvironment(input);
 const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.AUTH_DATABASE_URL, max: 5, connectionTimeoutMillis: 2000 }) });
 // Local private outbox only. Tokens must never appear in logs or HTTP responses.
 async function send(recipient: string, kind: string, url: string) {
  await db.authMail.create({ data: { recipient, kind, url } });
 }
 const auth = betterAuth({
  appName: "Tony", baseURL: env.BETTER_AUTH_URL, secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL],
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  emailAndPassword: {
   enabled: true, requireEmailVerification: true, minPasswordLength: 12, maxPasswordLength: 128,
   revokeSessionsOnPasswordReset: true,
   sendResetPassword: async ({ user, url }) => send(user.email, "password_reset", url),
  },
  emailVerification: { sendOnSignUp: true, autoSignInAfterVerification: false, sendVerificationEmail: async ({ user, url }) => send(user.email, "verification", url) },
  user: { additionalFields: { platformRole: { type: "string", required: true, defaultValue: "USER", input: false } } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: false } },
  advanced: {
   database: { generateId: () => randomUUID() }, useSecureCookies: env.BETTER_AUTH_URL.startsWith("https:"),
   defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
   ipAddress: { ipAddressHeaders: [], trustedProxies: [] },
  },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 100, customRules: { "/sign-in/email": { window: 60, max: 20 }, "/request-password-reset": { window: 60, max: 5 } } },
  plugins: [twoFactor({ issuer: "Tony" })],
 });
 const handle = auth.handler.bind(auth);
 auth.handler = async (request: Request) => {
  if (request.method !== "GET" && request.method !== "HEAD" && request.headers.get("origin") !== env.BETTER_AUTH_URL) {
   return Response.json({ error: "Forbidden origin" }, { status: 403 });
  }
  const response = await handle(request);
  const retryAfter = response.headers.get("X-Retry-After");
  if (response.status === 429 && retryAfter) response.headers.set("Retry-After", retryAfter);
  return response;
 };
 return { auth, db };
}
