import twilio from "twilio";
import { z } from "zod";
import { BASE_URL, FAKE_ACCOUNT, FAKE_SECRET } from "./config";
export const routes = ["voice", "dial-result", "call-status", "message-status", "recording-status"] as const;
export type Route = typeof routes[number];
const sid = z.string().regex(/^(AC|CA|SM|RE)[0-9a-f]{32}$/);
const envelope = z.object({ account: z.literal(FAKE_ACCOUNT), resource: sid, parent: sid.nullable(), status: z.enum(["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled", "sent", "delivered", "undelivered", "deleted"]), sequence: z.number().int().min(0).max(10000).nullable() }).strict();
export type Envelope = z.infer<typeof envelope>;
export function verifyEnvelope(route: Route, raw: string, signature: string): Envelope {
  if (Buffer.byteLength(raw) > 32768 || /%(?![0-9a-fA-F]{2})/.test(raw)) throw new Error("INVALID_ENVELOPE");
  const params = new URLSearchParams(raw);
  const fields: Record<string, string> = Object.create(null);
  if ([...params].length > 100) throw new Error("INVALID_ENVELOPE");
  for (const [key, value] of params) {
    if (Object.hasOwn(fields, key) || key.length > 100 || value.length > 4096 || ["__proto__", "constructor", "prototype"].includes(key)) throw new Error("INVALID_ENVELOPE");
    fields[key] = value;
  }
  if (!twilio.validateRequest(FAKE_SECRET, signature, `${BASE_URL}/poc/webhooks/twilio/${route}`, fields)) throw new Error("FORBIDDEN");
  if (fields.AccountSid !== FAKE_ACCOUNT || Object.hasOwn(fields, "organizationId")) throw new Error("FORBIDDEN");
  const resource = route === "recording-status" ? fields.RecordingSid : route === "message-status" ? fields.MessageSid : fields.CallSid;
  const expected = route === "recording-status" ? "RE" : route === "message-status" ? "SM" : "CA";
  if (!resource?.startsWith(expected)) throw new Error("INVALID_ENVELOPE");
  const sequence = fields.SequenceNumber;
  if (sequence !== undefined && !/^\d+$/.test(sequence)) throw new Error("INVALID_ENVELOPE");
  const status = route === "dial-result" ? fields.DialCallStatus : route === "message-status" ? fields.MessageStatus : route === "recording-status" ? fields.RecordingStatus : fields.CallStatus;
  return envelope.parse({ account: fields.AccountSid, resource, parent: fields.ParentCallSid ?? null, status, sequence: sequence === undefined ? null : Number(sequence) });
}
