import type {Prisma} from "@/db/generated/client";
import type {Kind} from "./validation";
export type Row={id:string;version:number;[key:string]:unknown};
export const definitions:Record<Kind,{table:string;fields:readonly string[]}>= {
 contacts:{table:"contact",fields:["id","name","phone","email","version","createdAt","updatedAt"]},
 services:{table:"service_template",fields:["id","name","description","currency","averageAmountMinor","minAmountMinor","maxAmountMinor","durationMinutes","active","version","createdAt","updatedAt"]},
 opportunities:{table:"opportunity",fields:["id","contactId","serviceTemplateId","title","description","status","version","createdAt","updatedAt"]},
 tasks:{table:"task",fields:["id","opportunityId","title","dueAt","status","completedAt","version","createdAt","updatedAt"]},
};
const quoted=(v:string)=>`"${v}"`;
function writeKeys(kind:Kind,data:Record<string,unknown>) {
 const allowed=definitions[kind].fields.filter(k=>!["id","version","createdAt","updatedAt"].includes(k));
 if(Object.keys(data).some(k=>!allowed.includes(k)))throw new Error("Unexpected repository field");
 return allowed.filter(k=>Object.hasOwn(data,k));
}
export async function find(tx:Prisma.TransactionClient,kind:Kind,org:string,id:string,lock=false) {
 const d=definitions[kind];const rows=await tx.$queryRawUnsafe<Row[]>(`SELECT ${d.fields.map(quoted).join(",")} FROM public.${d.table} WHERE "organizationId"=$1::uuid AND id=$2::uuid${lock?" FOR UPDATE":""}`,org,id);return rows[0];
}
export async function list(tx:Prisma.TransactionClient,kind:Kind,org:string,filter:{limit:number;cursor?:string|undefined;q?:string|undefined;status?:string|undefined}) {
 const d=definitions[kind],values:unknown[]=[org],where=['"organizationId"=$1::uuid'];
 if(filter.cursor){values.push(filter.cursor);where.push(`id>$${values.length}::uuid`);}
 if(filter.q){values.push(filter.q);const p=`$${values.length}::text`;where.push(kind==="contacts"?`(strpos(lower(name),lower(${p}))>0 OR strpos(phone,${p})>0)`:`strpos(lower(${kind==="services"?"name":"title"}),lower(${p}))>0`);}
 if(filter.status){values.push(filter.status);where.push(`status=$${values.length}::text`);}
 values.push(filter.limit+1);
 return tx.$queryRawUnsafe<Row[]>(`SELECT ${d.fields.map(quoted).join(",")} FROM public.${d.table} WHERE ${where.join(" AND ")} ORDER BY id LIMIT $${values.length}::integer`,...values);
}
export async function create(tx:Prisma.TransactionClient,kind:Kind,org:string,data:Record<string,unknown>) {
 const d=definitions[kind],keys=writeKeys(kind,data);const values=keys.map(k=>data[k]);
 const rows=await tx.$queryRawUnsafe<Row[]>(`INSERT INTO public.${d.table} ("organizationId",${keys.map(quoted).join(",")}) VALUES ($1::uuid,${keys.map((k,i)=>`$${i+2}${k.endsWith("Id")?"::uuid":k==="dueAt"?"::timestamptz":""}`).join(",")}) RETURNING ${d.fields.map(quoted).join(",")}`,org,...values);return rows[0]!;
}
export async function change(tx:Prisma.TransactionClient,kind:Kind,org:string,id:string,version:number,data:Record<string,unknown>|null) {
 const d=definitions[kind],keys=writeKeys(kind,data??{}),values=[org,id,version,...keys.map(k=>data![k])];
 const set=keys.map((k,i)=>`${quoted(k)}=$${i+4}${k.endsWith("Id")?"::uuid":["dueAt","completedAt"].includes(k)?"::timestamptz":""}`).concat('version=version+1');
 const sql=data?`UPDATE public.${d.table} SET ${set.join(",")}`:`DELETE FROM public.${d.table}`;
 const rows=await tx.$queryRawUnsafe<Row[]>(`${sql} WHERE "organizationId"=$1::uuid AND id=$2::uuid AND version=$3::integer RETURNING ${d.fields.map(quoted).join(",")}`,...values);return rows[0];
}
