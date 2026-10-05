import { z } from "zod";
export const FAKE_ACCOUNT = "AC" + "0".repeat(32);
export const FAKE_SECRET = "synthetic-poc-signature-key-not-a-credential";
export const BASE_URL = "http://127.0.0.1:4315";
export const configSchema = z.object({
  mode: z.literal("LOCAL_FAKE").default("LOCAL_FAKE"),
  databaseUrl: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "postgresql:" && url.username === "tony_poc_runtime" && url.pathname === "/tony_poc" && ["127.0.0.1", "poc-postgres"].includes(url.hostname) && url.password === "synthetic_poc_runtime_only";
  }).default("postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5545/tony_poc"),
}).strict();
export function parseConfig(input: unknown) { return configSchema.parse(input); }
