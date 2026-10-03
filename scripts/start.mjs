import "dotenv/config";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
process.env.HOSTNAME ||= "127.0.0.1";
// Standalone output omits static assets; copy them before starting the server.
cpSync(fileURLToPath(new URL("../.next/static", import.meta.url)), fileURLToPath(new URL("../.next/standalone/.next/static", import.meta.url)), { recursive: true });
await import("../.next/standalone/server.js");
