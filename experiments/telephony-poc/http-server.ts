import { createServer } from "node:http";
import { routes, type Route } from "./webhook";
export function createWebhookServer<Event extends { resource: string }>(handler: {
  verify: (route: Route, raw: string, signature: string) => Event;
  receive: (route: Route, event: Event) => Promise<string>;
  inboundSms?: (event: Event) => boolean;
}) {
  let windowStart = Date.now(), requests = 0;
  const resources = new Map<string, { start: number; count: number }>();
  return createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (Date.now() - windowStart >= 1000) { windowStart = Date.now(); requests = 0; }
    if (++requests > 30) { res.writeHead(429).end(); return; }
    const route = req.url?.replace("/poc/webhooks/twilio/", "") as Route;
    if (!routes.includes(route) || req.url !== `/poc/webhooks/twilio/${route}`) { res.writeHead(404).end(); return; }
    if (req.method !== "POST") { res.writeHead(405).end(); return; }
    if (req.headers["content-type"] !== "application/x-www-form-urlencoded") { res.writeHead(415).end(); return; }
    try {
      const chunks: Buffer[] = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 32768) { res.writeHead(413).end(); return; } chunks.push(chunk); }
      const signature = req.headers["x-twilio-signature"];
      const event = handler.verify(route, new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)), typeof signature === "string" ? signature : "");
      const now = Date.now(); for (const [key, value] of resources) if (now - value.start >= 60000) resources.delete(key);
      const window = resources.get(event.resource) ?? { start: now, count: 0 };
      if ((!resources.has(event.resource) && resources.size >= 1000) || ++window.count > 300) { res.writeHead(429).end(); return; }
      resources.set(event.resource, window);
      const xml = await handler.receive(route, event);
      if (route === "voice" || route === "dial-result" || handler.inboundSms?.(event)) { res.setHeader("Content-Type", "text/xml"); res.writeHead(200).end(handler.inboundSms?.(event) ? "<Response/>" : xml); }
      else res.writeHead(204).end();
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      res.writeHead(code === "FORBIDDEN" || code === "CAMPAIGN_CLOSED" ? 403 : code === "QUOTA" || code === "BUDGET" ? 429 : code === "INVALID_ENVELOPE" || error instanceof TypeError || code.startsWith("[") ? 400 : 503).end();
    }
  });
}
