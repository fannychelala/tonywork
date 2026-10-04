import {z} from "zod";
const common={id:z.uuid(),version:z.number().int().positive(),createdAt:z.iso.datetime(),updatedAt:z.iso.datetime()};
const nullableText=z.string().nullable(),money=z.number().int().nullable();
export const rows={
 contacts:z.object({...common,name:z.string(),phone:z.string(),email:nullableText}).strict(),
 services:z.object({...common,name:z.string(),description:nullableText,currency:z.string(),averageAmountMinor:money,minAmountMinor:money,maxAmountMinor:money,durationMinutes:money,active:z.boolean()}).strict(),
 opportunities:z.object({...common,title:z.string(),description:nullableText,contactId:z.uuid(),serviceTemplateId:z.uuid().nullable(),status:z.string()}).strict(),
 tasks:z.object({...common,title:z.string(),opportunityId:z.uuid(),dueAt:z.iso.datetime().nullable(),status:z.string(),completedAt:z.iso.datetime().nullable()}).strict(),
};
