import { z } from "zod";
export const organizationIdSchema = z.uuid();
export const organizationInputSchema = z.object({ name: z.string().trim().min(1).max(120), defaultLocale: z.enum(["fr-FR", "en-GB"]), currency: z.enum(["EUR", "GBP", "USD", "JPY", "KWD"]), timeZone: z.string().max(80).refine(v => { try { new Intl.DateTimeFormat("en", { timeZone: v }); return true; } catch { return false; } }) }).strict();
export const membershipRoleSchema = z.enum(["OWNER", "MEMBER"]);
