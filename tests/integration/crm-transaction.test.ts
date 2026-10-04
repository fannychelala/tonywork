import "dotenv/config";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../../src/db/generated/client";
import {withTenant} from "../../src/server/security/tenant";
import {crmFixture} from "./fixtures/crm";
import {beforeAll,afterAll,it,expect} from "vitest";
const f=crmFixture(),db=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL!})});
beforeAll(()=>f.setup());afterAll(async()=>{await db.$disconnect();await f.close();});
it("failed SQL keeps primary error and rolls context back",async()=> {
 let failure:unknown;
 try{await withTenant(db,{token:f.tokens.owner,organizationId:f.a},tx=>tx.$executeRaw`INSERT INTO contact ("organizationId",name,phone) VALUES (${f.a}::uuid,'Duplicate','+33123456789')`);}catch(e){failure=e;}
 expect(failure).toBeDefined();expect(JSON.stringify(failure)).not.toContain("25P02");expect(JSON.stringify(failure)).toContain("23505");
 expect(await db.$queryRaw`SELECT * FROM contact`).toEqual([]);
 const rows=await withTenant(db,{token:f.tokens.owner,organizationId:f.a},tx=>tx.contact.findMany());expect(rows).toHaveLength(1);
});
it("bounded runtime query measures execution without customer data",async()=> {
 const result=await f.tx(f.tokens.owner,f.a,async c=>c.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) SELECT id,name FROM contact WHERE "organizationId"=$1 ORDER BY id LIMIT 25',[f.a]));
 const plan=result.rows[0]["QUERY PLAN"][0];expect(plan.Plan["Actual Rows"]).toBeLessThanOrEqual(25);
 console.log(JSON.stringify({measurement:"synthetic-contact-list-small-fixture",planningMs:plan["Planning Time"],executionMs:plan["Execution Time"],rows:plan.Plan["Actual Rows"]}));
});
