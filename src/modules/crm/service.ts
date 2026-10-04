import {getDatabase} from "@/server/repositories/database";
import {withTenant} from "@/server/security/tenant";
import {deleteInput,inputs,updates,listInput,validateAmounts,type Kind,opportunityStates} from "./validation";
import * as repo from "./repository";
import type {Prisma} from "@/db/generated/client";
export class CrmError extends Error {constructor(public status:number){super("CRM request refused");}}
async function access(tx:Prisma.TransactionClient,org:string) {
 const organization=await tx.organization.findUnique({where:{id:org},select:{timeZone:true}});if(!organization)throw new CrmError(404);
 const contexts=await tx.$queryRaw<Array<{owner_access:boolean;administrator:boolean}>>`SELECT owner_access,administrator FROM tony_security.current_context()`;
 if(!contexts[0]||contexts[0].administrator)throw new CrmError(404);
 return {canWrite:contexts[0].owner_access,timeZone:organization.timeZone};
}
async function parents(tx:Prisma.TransactionClient,org:string,kind:Kind,data:Record<string,unknown>) {
 if(kind==="opportunities") {if(typeof data.contactId==="string"&&!await repo.find(tx,"contacts",org,data.contactId))throw new CrmError(404);if(typeof data.serviceTemplateId==="string"&&!await repo.find(tx,"services",org,data.serviceTemplateId))throw new CrmError(404);}
 if(kind==="tasks"&&typeof data.opportunityId==="string"&&!await repo.find(tx,"opportunities",org,data.opportunityId))throw new CrmError(404);
}
export async function crm(token:string,org:string,kind:Kind,method:"GET"|"POST"|"PATCH"|"DELETE",id:string|undefined,input:unknown) {
 return withTenant(getDatabase(),{token,organizationId:org},async tx=> {
  const a=await access(tx,org);
  if(method==="GET") {
   if(id){const row=await repo.find(tx,kind,org,id);if(!row)throw new CrmError(404);return row;}
   const filters=listInput.parse(input);
   if(filters.status&&(!["opportunities","tasks"].includes(kind)||!(kind==="tasks"?["OPEN","DONE"]:[...opportunityStates]).includes(filters.status)))throw new CrmError(400);
   if(filters.cursor&&!await repo.find(tx,kind,org,filters.cursor))throw new CrmError(404);
   const rows=await repo.list(tx,kind,org,filters),items=rows.slice(0,filters.limit);
   return {items,nextCursor:rows.length>filters.limit?items.at(-1)!.id:null,canWrite:a.canWrite};
  }
  // Resolve existence before reporting a role/version conflict, to avoid a foreign-ID oracle.
  const old=id?await repo.find(tx,kind,org,id):undefined;if(id&&!old)throw new CrmError(404);
  if(!a.canWrite)throw new CrmError(403);
  if(method==="POST") {
   const data=inputs[kind].parse(input) as Record<string,unknown>;if(kind==="services"&&!validateAmounts(data))throw new CrmError(400);await parents(tx,org,kind,data);return repo.create(tx,kind,org,data);
  }
  if(!id||!old)throw new CrmError(400);
  if(method==="DELETE"){const {version}=deleteInput.parse(input);if(old.version!==version)throw new CrmError(409);const row=await repo.change(tx,kind,org,id,version,null);if(!row)throw new CrmError(409);return {deleted:true};}
  const parsed=updates[kind].parse(input),{version,...data}=parsed;if(Object.keys(data).length===0)throw new CrmError(400);if(old.version!==version)throw new CrmError(409);
  if(kind==="services"&&!validateAmounts({...old,...data}))throw new CrmError(400);
  if(kind==="opportunities"&&old.status==="ARCHIVED"&&"status" in data&&!["ARCHIVED","NEW"].includes(String(data.status)))throw new CrmError(400);
  const write:Record<string,unknown>={...data};if(kind==="tasks"&&"status" in write)write.completedAt=write.status==="DONE"?new Date():null;
  await parents(tx,org,kind,write);const row=await repo.change(tx,kind,org,id,version,write);if(!row)throw new CrmError(409);return row;
 });
}
export async function today(token:string,org:string,now=new Date()) {
 return withTenant(getDatabase(),{token,organizationId:org},async tx=> {
  const a=await access(tx,org);
  // Validate existing organization timezone. PostgreSQL derives civil-day boundaries, not 24h arithmetic.
  new Intl.DateTimeFormat("en",{timeZone:a.timeZone});
  const bounds=await tx.$queryRaw<Array<{start:Date;finish:Date}>>`WITH d AS (SELECT (${now}::timestamptz AT TIME ZONE ${a.timeZone})::date AS day) SELECT day::timestamp AT TIME ZONE ${a.timeZone} AS start,(day+1)::timestamp AT TIME ZONE ${a.timeZone} AS finish FROM d`;
  const {start,finish}=bounds[0]!;
  const taskSelect={id:true,title:true,dueAt:true,status:true,version:true,opportunityId:true} as const;
  const overdue=await tx.task.findMany({where:{organizationId:org,status:"OPEN",dueAt:{lt:start}},select:taskSelect,orderBy:[{dueAt:"asc"},{id:"asc"}],take:25});
  const due=await tx.task.findMany({where:{organizationId:org,status:"OPEN",dueAt:{gte:start,lt:finish}},select:taskSelect,orderBy:[{dueAt:"asc"},{id:"asc"}],take:25});
  const opportunities=await tx.opportunity.findMany({where:{organizationId:org,status:{in:["NEW","TO_CONTACT"]}},select:{id:true,title:true,status:true,version:true},orderBy:[{createdAt:"asc"},{id:"asc"}],take:25});
  return {overdue,due,opportunities,timeZone:a.timeZone,start,finish,canWrite:a.canWrite};
 });
}
