import {describe,it,expect} from "vitest";
import {randomUUID} from "node:crypto";
import {sqlState} from "../../src/modules/crm/errors";
import {inputs,updates,listInput,validateAmounts} from "../../src/modules/crm/validation";
describe("CRM strict boundaries",()=> {
 it("maps adapter metadata without exposing details",()=> {
  expect(sqlState({code:"P2010",meta:{driverAdapterError:{cause:{originalCode:"23505",originalMessage:"SECRET"}}}})).toBe("23505");
  expect(sqlState({meta:{driverAdapterError:{cause:{originalCode:"42501"}}}})).toBe("42501");expect(sqlState(null)).toBeUndefined();
 });
 it("accepts only international phone and bounded name, rejects tenant mass assignment",()=> {
  const valid={name:" Synthetic ",phone:"+33123456789",email:null};expect(inputs.contacts.parse(valid).name).toBe("Synthetic");
  for(const phone of ["0612345678","+012345","<script>","+1234567890123456"])expect(inputs.contacts.safeParse({...valid,phone}).success).toBe(false);
  expect(inputs.contacts.safeParse({...valid,organizationId:randomUUID()}).success).toBe(false);
 });
 it("validates money ranges without converting currency",()=> {
  expect(validateAmounts({minAmountMinor:100,averageAmountMinor:150,maxAmountMinor:200})).toBe(true);
  expect(validateAmounts({minAmountMinor:200,averageAmountMinor:150})).toBe(false);expect(validateAmounts({averageAmountMinor:300,maxAmountMinor:200})).toBe(false);
  const data={name:"Service",description:null,currency:"JPY",averageAmountMinor:100,minAmountMinor:null,maxAmountMinor:null,durationMinutes:null,active:true};expect(inputs.services.parse(data).currency).toBe("JPY");
  for(const amount of [-1,0.5,1000000000])expect(inputs.services.safeParse({...data,averageAmountMinor:amount}).success).toBe(false);
 });
 it("versions and status cannot inject another archive mechanism",()=> {
  expect(updates.opportunities.safeParse({version:1,status:"ARCHIVED"}).success).toBe(true);
  for(const data of [{version:0,status:"NEW"},{version:1,deletedAt:null},{version:1,status:"PLANNED"}])expect(updates.opportunities.safeParse(data).success).toBe(false);
 });
 it("bounds list requests and UTC date inputs",()=> {
  expect(listInput.parse({}).limit).toBe(25);expect(listInput.safeParse({limit:51}).success).toBe(false);expect(listInput.safeParse({cursor:"raw"}).success).toBe(false);
  const data={title:"Task",opportunityId:randomUUID(),dueAt:"2026-03-29T10:00:00Z"};expect(inputs.tasks.safeParse(data).success).toBe(true);expect(inputs.tasks.safeParse({...data,dueAt:"2026-03-29"}).success).toBe(false);
 });
});
