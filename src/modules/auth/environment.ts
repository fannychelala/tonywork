import { z } from "zod";
import { parseRuntimeEnvironment } from "../../server/config/env";
const schema = z.object({
 AUTH_DATABASE_URL: z.url().refine(v => { try { return ["postgres:", "postgresql:"].includes(new URL(v).protocol); } catch { return false; } }),
 BETTER_AUTH_SECRET: z.string().min(32).refine(v => !v.includes("REPLACE_WITH") && new Set(v).size >= 12),
 BETTER_AUTH_URL: z.url().refine(v => { try { const u = new URL(v); return ["http:", "https:"].includes(u.protocol) && u.pathname === "/" && !u.username && !u.password && !u.search && !u.hash; } catch { return false; } }),
 AUTH_MAIL_MODE: z.literal("local"),
});
export function parseAuthEnvironment(input: unknown) {
 const runtime = parseRuntimeEnvironment(input);
 const parsed = schema.safeParse(input);
 if (!parsed.success) throw new Error("Invalid authentication configuration");
 const host = new URL(parsed.data.BETTER_AUTH_URL).hostname;
 if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) throw new Error("Local mail requires a loopback authentication URL");
 if (runtime.DATABASE_URL === parsed.data.AUTH_DATABASE_URL) throw new Error("Authentication and tenant credentials must be separate");
 return { ...runtime, ...parsed.data };
}
