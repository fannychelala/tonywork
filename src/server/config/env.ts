import { z } from "zod";
const postgresUrl = z.url().refine((value) => {
 try { return ["postgresql:", "postgres:"].includes(new URL(value).protocol); }
 catch { return false; }
}, "PostgreSQL URL required");
export const runtimeEnvironmentSchema = z.object({ DATABASE_URL: postgresUrl });
export function parseRuntimeEnvironment(input: unknown) {
 const result = runtimeEnvironmentSchema.safeParse(input);
 if (!result.success) throw new Error("Invalid server configuration: DATABASE_URL must be a PostgreSQL URL");
 return result.data;
}
