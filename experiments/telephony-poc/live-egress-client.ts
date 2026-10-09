import { Agent, type RequestOptions } from "node:https";
import { connect, type TLSSocket } from "node:tls";
import { LIVE_EGRESS_GATEWAY, TWILIO_IE1_EGRESS_TARGET } from "./live-egress-policy";

type RequestedTlsDestination = Readonly<{
  host?: string | null | undefined;
  hostname?: string | null | undefined;
  port?: number | string | null | undefined;
  servername?: string | undefined;
}>;

export function routeLiveTlsConnection(request: RequestedTlsDestination) {
  const host = request.hostname ?? request.host;
  const port = typeof request.port === "string" ? Number(request.port) : request.port;
  if (host !== TWILIO_IE1_EGRESS_TARGET.host || port !== TWILIO_IE1_EGRESS_TARGET.port) {
    throw new Error("FORBIDDEN_EGRESS_DESTINATION");
  }
  if (request.servername !== undefined && request.servername !== TWILIO_IE1_EGRESS_TARGET.serverName) {
    throw new Error("FORBIDDEN_EGRESS_DESTINATION");
  }
  return Object.freeze({
    host: LIVE_EGRESS_GATEWAY.host,
    port: LIVE_EGRESS_GATEWAY.port,
    servername: TWILIO_IE1_EGRESS_TARGET.serverName,
    rejectUnauthorized: true as const,
  });
}

class LiveEgressAgent extends Agent {
  override createConnection(options: RequestOptions): TLSSocket {
    return connect(routeLiveTlsConnection(options));
  }
}

export function createLiveEgressAgent(): Agent {
  return new LiveEgressAgent({ keepAlive: false, maxSockets: 4, maxCachedSessions: 0, timeout: 6000 });
}
