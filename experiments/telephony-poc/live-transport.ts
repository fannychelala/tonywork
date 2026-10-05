import twilio from "twilio";
import { request as httpsRequest } from "node:https";
import { z } from "zod";
import { assertLiveEffectsAuthorized } from "./live-config";
import { parseLiveBinding, type LiveBinding } from "./live-binding";
import type { LiveRequest, LiveTransport, MediaProbe } from "./live-provider";
const host = "api.dublin.ie1.twilio.com";
export function assertSafeLiveEnvironment(env: Readonly<Record<string, string | undefined>>) {
  if (Object.keys(env).some(key => env[key] !== undefined && /^(TWILIO_|HTTP_PROXY$|HTTPS_PROXY$|ALL_PROXY$|NODE_EXTRA_CA_CERTS$|NODE_TLS_REJECT_UNAUTHORIZED$|DATABASE_URL$|AUTH_DATABASE_URL$|MIGRATION_DATABASE_URL$|BETTER_AUTH)/i.test(key))) throw new Error("FOREIGN_LIVE_ENVIRONMENT");
}
export type SdkRequest = (options: { method: "GET" | "POST" | "DELETE"; uri: string; data?: Readonly<Record<string, string>>; timeout: number; allowRedirects: boolean }) => Promise<unknown>;
export function prepareSdkTransport(binding: LiveBinding, send: SdkRequest): LiveTransport {
  return async (input: LiveRequest) => {
    const prefix = `/2010-04-01/Accounts/${binding.manifest.accountSid}/`;
    if (!input.path.startsWith(prefix) || /[\r\n#\\]/.test(input.path)) throw new Error("FORBIDDEN");
    const suffix = input.path.slice(prefix.length);
    if (!/^(Calls(?:\/(?:CA[0-9a-f]{32})(?:\/Recordings(?:\/RE[0-9a-f]{32})?)?)?|Messages|Recordings(?:\/RE[0-9a-f]{32})?|IncomingPhoneNumbers\/PN[0-9a-f]{32})\.json(?:\?(?:IncludeSoftDeleted=true|PageSize=1))?$/.test(suffix)) throw new Error("FORBIDDEN");
    // Provisioning, routing and releasing a number never belong to this runtime.
    if (suffix.startsWith("IncomingPhoneNumbers/") && input.method !== "GET") throw new Error("ADMINISTRATIVE_ONLY");
    const allowed = input.method === "DELETE" ? /^Recordings\/RE[0-9a-f]{32}\.json$/ : input.method === "POST" ? /^(Calls(?:\/CA[0-9a-f]{32}(?:\/Recordings(?:\/RE[0-9a-f]{32})?)?)?|Messages)\.json$/ : /^(Calls(?:\/CA[0-9a-f]{32})?\.json(?:\?PageSize=1)?|Recordings\/RE[0-9a-f]{32}\.json\?IncludeSoftDeleted=true|IncomingPhoneNumbers\/PN[0-9a-f]{32}\.json)$/;
    if (!allowed.test(suffix)) throw new Error("FORBIDDEN");
    try {
      const response: unknown = await send({ method: input.method, uri: `https://${host}${input.path}`, ...(input.data ? { data: input.data } : {}), timeout: 5000, allowRedirects: false });
      const parsed = z.object({ statusCode: z.number().int(), body: z.unknown() }).passthrough().safeParse(response);
      if (!parsed.success) throw new Error();
      let body = parsed.data.body;
      if (typeof body === "string") {
        if (Buffer.byteLength(body) > 32768) throw new Error();
        body = body.length ? JSON.parse(body) as unknown : null;
      }
      return { status: parsed.data.statusCode, body };
    } catch { throw new Error("PROVIDER_IO_FAILED"); }
  };
}

type ProbeResponse = { statusCode?: number | undefined; pause(): unknown; destroy(): unknown };
type ProbeSocket = { once(event: string, callback: () => void): unknown; destroy(error?: Error): unknown; end(): unknown };
export type ProbeRequest = (options: { hostname: string; port: number; path: string; method: string; auth: string; timeout: number }, receive: (response: ProbeResponse) => void) => ProbeSocket;
// Injectable HTTPS-shaped synthetic driver; no listener for data or audio accumulator.
export function prepareStreamingProbe(binding: LiveBinding, request: ProbeRequest): MediaProbe {
  return sid => {
    if (!/^RE[0-9a-f]{32}$/.test(sid)) return Promise.reject(new Error("INVALID_SID"));
    return new Promise((resolve, reject) => {
      const req = request({ hostname: host, port: 443, path: `/2010-04-01/Accounts/${binding.manifest.accountSid}/Recordings/${sid}.wav`, method: "GET", auth: `${binding.secrets.apiKey}:${binding.secrets.apiSecret}`, timeout: 5000 }, response => {
      const status = response.statusCode ?? 0;
      response.pause(); response.destroy();
      // Authentication validity is confirmed separately by authenticated metadata reads.
      resolve({ status, authenticated: status === 200 || status === 404 });
      });
      req.once("timeout", () => req.destroy(new Error("PROVIDER_IO_FAILED")));
      req.once("error", () => reject(new Error("PROVIDER_IO_FAILED"))); req.end();
    });
  };
}
export function probeMediaWithHttps(binding: LiveBinding, sid: string): Promise<{ status: number; authenticated: boolean }> {
  assertLiveEffectsAuthorized();
  return prepareStreamingProbe(binding, (options, receive) => httpsRequest(options, receive))(sid);
}

export function createLiveNetworkTransport(loadPrivate: () => unknown): { binding: LiveBinding; transport: LiveTransport; probe: MediaProbe } {
  assertLiveEffectsAuthorized();
  assertSafeLiveEnvironment(process.env);
  const binding = parseLiveBinding(loadPrivate());
  const client = twilio(binding.secrets.apiKey, binding.secrets.apiSecret, { accountSid: binding.manifest.accountSid, region: "ie1", edge: "dublin", autoRetry: false, maxRetries: 0, timeout: 5000 });
  client.httpClient.axios.defaults.maxContentLength = 32768;
  return { binding, transport: prepareSdkTransport(binding, options => client.request({ ...options, method: options.method === "GET" ? "get" : options.method === "POST" ? "post" : "delete" })), probe: sid => probeMediaWithHttps(binding, sid) };
}
