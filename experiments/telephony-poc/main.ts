import { Pool } from "pg";
import { parseConfig } from "./config";
import { PocRepository } from "./repository";
import { createPocServer } from "./server";
import { FakeTelephonyProvider } from "./provider";
// Deliberately do not load dotenv or accept provider credentials / modes.
if (Object.keys(process.env).some(key => /TWILIO|BETTER_AUTH|^AUTH_DATABASE_URL$|^DATABASE_URL$|^MIGRATION_DATABASE_URL$/.test(key))) throw new Error("FOREIGN_CONFIG");
const config = parseConfig({ ...(process.env.POC_DATABASE_URL ? { databaseUrl: process.env.POC_DATABASE_URL } : {}), ...(process.env.POC_MODE ? { mode: process.env.POC_MODE } : {}) });
const pool = new Pool({ connectionString: config.databaseUrl, max: 4 });
const repository = new PocRepository(pool);
const provider = new FakeTelephonyProvider();
const args = process.argv.slice(2);
if (args.length) {
  try {
    if (args[0] === "cleanup" && args.length === 1) await repository.cleanup(provider);
    else if (args[0] === "reconcile" && args.length === 2) await repository.reconcile(args[1]!, provider);
    else if (args[0] === "execute" && args.length === 4 && args[3] === "--confirm-synthetic") await repository.execute({ id: args[1], kind: args[2] }, provider);
    else throw new Error("INVALID_COMMAND");
    console.log("POC_OK");
  } catch { console.error("POC_FAILED"); process.exitCode = 1; }
  finally { await pool.end(); }
} else {
  await repository.cleanup(provider);
  const server = createPocServer(repository);
  server.listen(4315, "127.0.0.1");
  server.requestTimeout = 5000;
  for (const signal of ["SIGTERM", "SIGINT"] as const) process.once(signal, () => {
    server.close(async () => { try { await repository.cleanup(provider); } catch { process.exitCode = 1; } finally { await pool.end(); } });
  });
}
