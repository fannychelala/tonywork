import "dotenv/config";
import {Pool} from "pg";
import {afterAll,it,expect} from "vitest";
const db=new Pool({connectionString:process.env.DATABASE_URL});afterAll(()=>db.end());
// The same parameterized SQL expression will be used only after authorized organization lookup.
async function bounds(zone:string,instant:string) {
 return (await db.query("WITH d AS (SELECT ($1::timestamptz AT TIME ZONE $2)::date AS day) SELECT day::timestamp AT TIME ZONE $2 AS start, (day+1)::timestamp AT TIME ZONE $2 AS finish FROM d",[instant,zone])).rows[0] as {start:Date;finish:Date};
}
it.each([["2026-03-29T12:00:00Z",23],["2026-10-25T12:00:00Z",25]])("civil Paris day %s respects DST",async(instant,hours)=> {
 const b=await bounds("Europe/Paris",instant as string);expect((b.finish.getTime()-b.start.getTime())/3600000).toBe(hours);
});
it("same UTC instant has different organization days",async()=> {
 const a=await bounds("Europe/Paris","2026-10-04T00:30:00Z"),b=await bounds("America/New_York","2026-10-04T00:30:00Z");
 expect(a.start.toISOString()).toBe("2026-10-03T22:00:00.000Z");expect(b.start.toISOString()).toBe("2026-10-03T04:00:00.000Z");
});
it("invalid persisted timezone fails without fallback",async()=> {await expect(bounds("Invalid/Zone","2026-10-04T12:00:00Z")).rejects.toMatchObject({code:"22023"});});
