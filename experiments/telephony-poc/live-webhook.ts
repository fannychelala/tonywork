import twilio from "twilio";
import { z } from "zod";
import type { LiveBinding } from "./live-binding";
import type { Route } from "./webhook";
const statuses = z.enum(["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled", "sent", "delivered", "undelivered", "deleted", "absent", "received"]);
export type LiveEvent = { account: string; resource: string; parent: string | null; status: z.infer<typeof statuses>; sequence: number | null; caller: "T1" | "T2" | null; inboundSms: boolean };
export function verifyLiveWebhook(binding: LiveBinding, route: Route, raw: string, signature: string): LiveEvent {
  if (Buffer.byteLength(raw) > 32768 || /%(?![0-9a-fA-F]{2})/.test(raw)) throw new Error("INVALID_ENVELOPE");
  const params = new URLSearchParams(raw), fields: Record<string, string> = Object.create(null);
  try { for (const part of raw.split("&")) for (const component of part.split("=")) decodeURIComponent(component.replaceAll("+", "%20")); } catch { throw new Error("INVALID_ENVELOPE"); }
  if ([...params].length > 100) throw new Error("INVALID_ENVELOPE");
  for (const [key, value] of params) {
    if (Object.hasOwn(fields, key) || key.length > 100 || value.length > 4096 || ["__proto__", "prototype", "constructor"].includes(key)) throw new Error("INVALID_ENVELOPE");
    fields[key] = value;
  }
  if (!twilio.validateRequest(binding.secrets.authToken, signature, `${binding.manifest.publicOrigin}/poc/webhooks/twilio/${route}`, fields)
      || fields.AccountSid !== binding.manifest.accountSid || Object.hasOwn(fields, "organizationId")) throw new Error("FORBIDDEN");
  const inboundSms = route === "message-status" && fields.SmsStatus === "received" && fields.MessageStatus === undefined;
  let caller: LiveEvent["caller"] = null;
  if (route === "voice" || inboundSms) {
    caller = binding.testers.find(t => t.phone === fields.From)?.slot ?? null;
    if (!caller || fields.To !== binding.number) throw new Error("FORBIDDEN");
  }
  const resource = route === "dial-result" ? fields.DialCallSid : route === "recording-status" ? fields.RecordingSid : route === "message-status" ? fields.MessageSid : fields.CallSid;
  const prefix = route === "recording-status" ? "RE" : route === "message-status" ? "SM" : "CA";
  if (!resource || !new RegExp(`^${prefix}[0-9a-f]{32}$`).test(resource)) throw new Error("INVALID_ENVELOPE");
  const parent = route === "dial-result" || route === "recording-status" ? fields.CallSid : fields.ParentCallSid;
  if ((route === "dial-result" || route === "recording-status") && parent === undefined) throw new Error("INVALID_ENVELOPE");
  if (parent !== undefined && !/^CA[0-9a-f]{32}$/.test(parent)) throw new Error("INVALID_ENVELOPE");
  const value = route === "dial-result" ? fields.DialCallStatus : route === "recording-status" ? fields.RecordingStatus : route === "message-status" ? inboundSms ? "received" : fields.MessageStatus : fields.CallStatus;
  const status = statuses.safeParse(value); if (!status.success) throw new Error("INVALID_ENVELOPE");
  const allowed = route === "message-status" ? inboundSms ? ["received"] : ["queued", "sent", "delivered", "undelivered", "failed"] : route === "recording-status" ? ["in-progress", "completed", "absent", "deleted"] : route === "dial-result" ? ["completed", "busy", "no-answer", "failed", "canceled"] : ["queued", "ringing", "in-progress", "completed", "busy", "no-answer", "failed", "canceled"];
  if (!allowed.includes(status.data)) throw new Error("INVALID_ENVELOPE");
  if (fields.SequenceNumber !== undefined && !/^\d{1,5}$/.test(fields.SequenceNumber)) throw new Error("INVALID_ENVELOPE");
  return { account: binding.manifest.accountSid, resource, parent: parent ?? null, status: status.data, sequence: fields.SequenceNumber === undefined ? null : Number(fields.SequenceNumber), caller, inboundSms };
}
