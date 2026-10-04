import {z} from "zod";
export const kinds=["contacts","services","opportunities","tasks"] as const;
export const kindSchema=z.enum(kinds);export type Kind=z.infer<typeof kindSchema>;
export const opportunityStates=["NEW","TO_CONTACT","WAITING_CUSTOMER","WON","LOST","ARCHIVED"] as const;
const name=z.string().trim().min(1).max(120),title=z.string().trim().min(1).max(160),description=z.string().trim().max(2000).nullable();
const amount=z.number().int().min(0).max(999999999).nullable();
export const inputs={
 contacts:z.object({name,phone:z.string().regex(/^\+[1-9][0-9]{1,14}$/),email:z.email().max(254).nullable()}).strict(),
 services:z.object({name,description,currency:z.enum(["EUR","GBP","USD","JPY","KWD"]),averageAmountMinor:amount,minAmountMinor:amount,maxAmountMinor:amount,durationMinutes:z.number().int().min(1).max(525600).nullable(),active:z.boolean()} ).strict(),
 opportunities:z.object({title,description,contactId:z.uuid(),serviceTemplateId:z.uuid().nullable()}).strict(),
 tasks:z.object({title,opportunityId:z.uuid(),dueAt:z.iso.datetime({offset:true}).nullable()}).strict(),
};
export const updates={
 contacts:inputs.contacts.partial().extend({version:z.number().int().positive()} ).strict(),
 services:inputs.services.partial().extend({version:z.number().int().positive()} ).strict(),
 opportunities:inputs.opportunities.partial().extend({version:z.number().int().positive(),status:z.enum(opportunityStates).optional()}).strict(),
 tasks:inputs.tasks.partial().extend({version:z.number().int().positive(),status:z.enum(["OPEN","DONE"]).optional()}).strict(),
};
export const deleteInput=z.object({version:z.number().int().positive()}).strict();
export const listInput=z.object({limit:z.coerce.number().int().min(1).max(50).default(25),cursor:z.uuid().optional(),q:z.string().trim().max(120).optional(),status:z.string().max(30).optional()}).strict();
export function validateAmounts(data:Record<string,unknown>) {
 const min=data.minAmountMinor,avg=data.averageAmountMinor,max=data.maxAmountMinor;
 return !(typeof min==="number"&&typeof max==="number"&&min>max)&&!(typeof min==="number"&&typeof avg==="number"&&min>avg)&&!(typeof avg==="number"&&typeof max==="number"&&avg>max);
}
