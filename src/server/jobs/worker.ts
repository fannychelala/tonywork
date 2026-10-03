import "dotenv/config";
import { setTimeout } from "node:timers/promises";
import { parseRuntimeEnvironment } from "../config/env";
// Lot 0 process scaffold. No queue, lease or business execution is implemented.
parseRuntimeEnvironment(process.env);
const controller = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => controller.abort());
console.info(JSON.stringify({ event: "worker_started", mode: "foundation_idle" }));
while (!controller.signal.aborted) {
 try { await setTimeout(30_000, undefined, { signal: controller.signal }); }
 catch (error) { if (!controller.signal.aborted) throw error; }
}
console.info(JSON.stringify({ event: "worker_stopped" }));
