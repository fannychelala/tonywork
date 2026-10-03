import "dotenv/config";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/db/generated/client";
import { parseRuntimeEnvironment } from "../../src/server/config/env";
const env = parseRuntimeEnvironment(process.env);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
afterAll(async () => { await db.$disconnect(); });
describe("real PostgreSQL foundation", () => {
 it("reads the migrated probe using Prisma", async () => { expect(await db.systemProbe.findUnique({ where: { id: "foundation" } })).toEqual({ id: "foundation" }); });
 it("runs under an unprivileged non-owner role", async () => {
  const rows = await db.$queryRaw<Array<{ rolsuper: boolean; rolbypassrls: boolean; owns_probe: boolean }>>`SELECT r.rolsuper, r.rolbypassrls, c.relowner = r.oid AS owns_probe FROM pg_roles r CROSS JOIN pg_class c WHERE r.rolname = current_user AND c.oid = 'public.system_probe'::regclass`;
  expect(rows).toEqual([{ rolsuper: false, rolbypassrls: false, owns_probe: false }]);
 });
 it("cannot create tables", async () => { await expect(db.$executeRawUnsafe('CREATE TABLE forbidden_probe (id text)')).rejects.toThrow(); });
});
