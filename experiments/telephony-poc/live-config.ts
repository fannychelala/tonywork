import { z } from "zod";

// Documentary manifest only. No credential, telephone, loader or activation flag.
const manifest = z.object({
  mode: z.literal("LIVE_POC"), region: z.literal("ie1"), edge: z.literal("dublin"),
  country: z.literal("FR"), numberCategory: z.literal("TECHNICAL_PLATFORM"),
  voice: z.literal(true), sms: z.literal(true),
  accountSid: z.string().regex(/^AC[0-9a-f]{32}$/).refine(value => value !== "AC" + "0".repeat(32)),
  numberSid: z.string().regex(/^PN[0-9a-f]{32}$/),
  publicOrigin: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && /^[a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com$/.test(url.hostname)
      && value === url.origin && !url.username && !url.password && !url.port && url.pathname === "/" && !url.search && !url.hash;
  }),
  maximumBudgetCents: z.number().int().min(1).max(5000), currency: z.literal("EUR"),
  startsAt: z.literal("2026-10-12T12:00:00.000Z"), endsAt: z.literal("2026-10-12T14:00:00.000Z"),
  testers: z.number().int().min(1).max(2),
  inboundLimit: z.number().int().min(1).max(10),
  outboundSegmentLimit: z.number().int().min(1).max(5),
  smsSegmentLimit: z.number().int().min(1).max(5),
  recordingLimit: z.number().int().min(1).max(2),
  recordingSeconds: z.number().int().min(1).max(10),
  callSeconds: z.number().int().min(1).max(60),
  databaseUrl: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "postgresql:" && url.username === "tony_poc_runtime" && !!url.password
      && url.pathname === "/tony_poc" && ["127.0.0.1", "poc-postgres", "poc-live-postgres"].includes(url.hostname)
      && !url.search && !url.hash;
  }),
}).strict();

export type LivePreparation = z.infer<typeof manifest>;
export function parseLivePreparation(input: unknown): Readonly<LivePreparation> {
  const result = manifest.safeParse(input);
  // Zod issues may echo values: never expose them at this external boundary.
  if (!result.success) throw new Error("INVALID_LIVE_CONFIGURATION");
  return Object.freeze(result.data);
}

// Fail before loading credentials, constructing a client, connecting or listening.
// No environment variable, manifest field or operator CLI flag can remove this lock.
export function assertLiveEffectsAuthorized(): void {
  throw new Error("FINAL_LIVE_AUTHORIZATION_REQUIRED");
}
