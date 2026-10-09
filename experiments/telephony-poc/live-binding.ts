import { z } from "zod";
import { parseLivePreparation, type LivePreparation } from "./live-config";
const schema = z.object({
  manifest: z.unknown(), number: z.string().regex(/^\+33939(?:03|24|20)[0-9]{4}$/),
  testers: z.array(z.object({ slot: z.enum(["T1", "T2"]), phone: z.string().regex(/^\+33[67][0-9]{8}$/), callSmsConsent: z.literal(true), audioConsent: z.boolean() }).strict()).min(1).max(2),
  secrets: z.object({ region: z.literal("ie1"), accountSid: z.string().regex(/^AC[0-9a-f]{32}$/), keyType: z.literal("Restricted"), apiKey: z.string().regex(/^SK[0-9a-f]{32}$/), apiSecret: z.string().min(32).max(128).regex(/^[A-Za-z0-9]+$/), authToken: z.string().regex(/^[0-9a-f]{32}$/) }).strict(),
  fixedCostCents: z.number().int().min(0).max(5000), callReserveCents: z.number().int().min(1).max(5000), smsReserveCents: z.number().int().min(1).max(5000), recordingReserveCents: z.number().int().min(1).max(5000),
}).strict();
export type LiveBinding = Omit<z.infer<typeof schema>, "manifest"> & { manifest: Readonly<LivePreparation> };
export function parseLiveBinding(input: unknown): LiveBinding {
  try {
    const result = schema.parse(input), manifest = parseLivePreparation(result.manifest);
    if (result.secrets.accountSid !== manifest.accountSid || result.testers.length !== manifest.testers || result.fixedCostCents >= manifest.maximumBudgetCents) throw new Error();
    if (new Set(result.testers.map(t => t.phone)).size !== result.testers.length || new Set(result.testers.map(t => t.slot)).size !== result.testers.length) throw new Error();
    for (const tester of result.testers) Object.freeze(tester);
    return Object.freeze({ ...result, testers: Object.freeze(result.testers) as typeof result.testers, secrets: Object.freeze(result.secrets), manifest });
  } catch { throw new Error("INVALID_LIVE_BINDING"); }
}
