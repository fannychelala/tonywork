// CI-only disposable upgrade rehearsal. No production target or CRM seed.
import { Pool } from "pg";
import { readdir, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const name = "tony_crm_upgrade_check";
if (!process.env.CI || !process.env.UPGRADE_BOOTSTRAP_URL) throw new Error("CI upgrade configuration required");
const bootstrap = new Pool({ connectionString: process.env.UPGRADE_BOOTSTRAP_URL });
let migration;
try {
 await bootstrap.query(`CREATE DATABASE ${name}`);
 const upgrade = new URL(process.env.MIGRATION_DATABASE_URL); upgrade.pathname = `/${name}`;
 const setup = new Pool({ connectionString: process.env.UPGRADE_BOOTSTRAP_URL.replace(/\/tony$/, `/${name}`) });
 try { await setup.query("ALTER SCHEMA public OWNER TO tony_migrator; REVOKE CREATE ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA public TO tony_app,tony_auth;"); await setup.query(`GRANT CONNECT,CREATE ON DATABASE ${name} TO tony_migrator`); } finally { await setup.end(); }
 migration = new Pool({ connectionString: upgrade.toString() });
 const dirs = (await readdir("prisma/migrations", { withFileTypes: true })).filter(d=>d.isDirectory()).map(d=>d.name).sort();
 const crm = "20261004000300_crm_minimal";
 for (const dir of dirs.filter(d=>d<crm)) await migration.query(await readFile(`prisma/migrations/${dir}/migration.sql`,"utf8"));
 assert.equal((await migration.query("SELECT count(*)::int AS n FROM pg_class WHERE relname IN ('contact','opportunity','service_template','task')")).rows[0].n,0);
 await migration.query("INSERT INTO system_probe (id) VALUES ('synthetic-upgrade-preserved')");
 await migration.query(await readFile(`prisma/migrations/${crm}/migration.sql`,"utf8"));
 assert.equal((await migration.query("SELECT count(*)::int AS n FROM system_probe WHERE id='synthetic-upgrade-preserved'")).rows[0].n,1);
 const tables=(await migration.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE relname IN ('contact','opportunity','service_template','task')")).rows;
 assert.equal(tables.length,4);assert.ok(tables.every(r=>r.relrowsecurity&&r.relforcerowsecurity));
 console.log("Lot 2 → Lot 3 additive upgrade: existing probe preserved, four forced RLS tables verified");
} finally {
 if(migration)await migration.end();
 await bootstrap.query(`DROP DATABASE IF EXISTS ${name}`);
 await bootstrap.end();
}
