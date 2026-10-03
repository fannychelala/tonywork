import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/db/generated/client";
import { parseRuntimeEnvironment } from "@/server/config/env";
const globalDatabase = globalThis as unknown as { tonyDatabase?: PrismaClient };
export function getDatabase() {
 if (!globalDatabase.tonyDatabase) {
  const { DATABASE_URL } = parseRuntimeEnvironment(process.env);
  globalDatabase.tonyDatabase = new PrismaClient({ adapter: new PrismaPg({ connectionString: DATABASE_URL, connectionTimeoutMillis: 2000, query_timeout: 2000, max: 5 }) });
 }
 return globalDatabase.tonyDatabase;
}
