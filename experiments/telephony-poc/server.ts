import { createServer } from "node:http";
import { routes, verifyEnvelope, type Route } from "./webhook";
import { type PocRepository } from "./repository";
export function createPocServer(repository: PocRepository) {
  let windowStart = Date.now(), requests = 0;
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
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 32768) { res.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const signature = req.headers["x-twilio-signature"];
      const event = verifyEnvelope(route, new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)), typeof signature === "string" ? signature : "");
      await repository.receive(route, event);
      if (route === "voice" || route === "dial-result") {
        res.setHeader("Content-Type", "text/xml"); res.writeHead(200).end("<Response><Hangup/></Response>");
      } else res.writeHead(204).end();
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      res.writeHead(code === "FORBIDDEN" ? 403 : code === "INVALID_ENVELOPE" || error instanceof TypeError || code.startsWith("[") ? 400 : 503).end();
    }
  });
}
