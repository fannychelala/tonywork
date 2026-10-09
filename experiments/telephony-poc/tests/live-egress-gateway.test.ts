import { once } from "node:events";
import { connect, createServer, type Server } from "node:net";
import { connect as connectTls } from "node:tls";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFixedTlsGateway,
  inspectTlsClientHello,
  type FixedTlsGateway,
} from "../live-egress-gateway";
import { routeLiveTlsConnection } from "../live-egress-client";
import { LIVE_EGRESS_GATEWAY, TWILIO_IE1_EGRESS_TARGET } from "../live-egress-policy";

const openServers: Array<Server | FixedTlsGateway> = [];

afterEach(async () => {
  await Promise.all(openServers.splice(0).map(server => server.close()));
});

function clientHello(serverName: string): Buffer {
  const name = Buffer.from(serverName, "ascii");
  const serverNameList = Buffer.concat([
    Buffer.from([0, 0, name.length]),
    name,
  ]);
  const sni = Buffer.concat([
    Buffer.from([0, 0, 0, serverNameList.length + 2, 0, serverNameList.length]),
    serverNameList,
  ]);
  const body = Buffer.concat([
    Buffer.from([3, 3]), Buffer.alloc(32), Buffer.from([0]),
    Buffer.from([0, 2, 0x13, 0x01]), Buffer.from([1, 0]),
    Buffer.from([0, sni.length]), sni,
  ]);
  const handshake = Buffer.concat([
    Buffer.from([1, body.length >> 16, body.length >> 8, body.length]), body,
  ]);
  return Buffer.concat([
    Buffer.from([0x16, 3, 1, handshake.length >> 8, handshake.length]), handshake,
  ]);
}

async function listen(server: Server): Promise<number> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("INVALID_TEST_ADDRESS");
  return address.port;
}

async function roundTrip(port: number, payload: Buffer): Promise<Buffer> {
  const socket = connect({ host: "127.0.0.1", port });
  const chunks: Buffer[] = [];
  socket.on("data", chunk => chunks.push(Buffer.from(chunk)));
  socket.end(payload);
  await once(socket, "close");
  return Buffer.concat(chunks);
}

describe("fixed TLS egress gateway", () => {
  it("keeps the real gateway entry behind the unconditional final lock", async () => {
    await expect(import("../live-egress-entry")).rejects.toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED");
  });

  it("pins the only prepared LIVE target to Twilio IE1", () => {
    expect(TWILIO_IE1_EGRESS_TARGET).toEqual(Object.freeze({
      host: "api.dublin.ie1.twilio.com",
      port: 443,
      serverName: "api.dublin.ie1.twilio.com",
    }));
    expect(Object.isFrozen(TWILIO_IE1_EGRESS_TARGET)).toBe(true);
  });

  it("routes only the exact Twilio IE1 TLS destination through the fixed gateway", () => {
    expect(routeLiveTlsConnection({ host: TWILIO_IE1_EGRESS_TARGET.host, port: 443 })).toEqual({
      host: LIVE_EGRESS_GATEWAY.host,
      port: LIVE_EGRESS_GATEWAY.port,
      servername: TWILIO_IE1_EGRESS_TARGET.serverName,
      rejectUnauthorized: true,
    });
    for (const request of [
      { host: "api.twilio.com", port: 443 },
      { host: TWILIO_IE1_EGRESS_TARGET.host, port: 80 },
      { host: TWILIO_IE1_EGRESS_TARGET.host, port: 443, servername: "example.test" },
    ]) expect(() => routeLiveTlsConnection(request)).toThrow("FORBIDDEN_EGRESS_DESTINATION");
  });

  it("parses one complete TLS ClientHello and waits for partial input", () => {
    const hello = clientHello(TWILIO_IE1_EGRESS_TARGET.serverName);
    expect(inspectTlsClientHello(hello.subarray(0, 12))).toEqual({ state: "INCOMPLETE" });
    expect(inspectTlsClientHello(hello)).toEqual({
      state: "READY",
      serverName: TWILIO_IE1_EGRESS_TARGET.serverName,
    });
  });

  it.each([
    ["plaintext", Buffer.from("CONNECT example.test:443 HTTP/1.1\r\n\r\n")],
    ["missing SNI", clientHello("")],
    ["non-ASCII SNI", clientHello("twilio.com\u0000.example")],
    ["oversized prelude", Buffer.alloc(8193, 0x16)],
  ])("rejects %s before any upstream connection", async (_label, payload) => {
    const connectUpstream = vi.fn();
    const gateway = createFixedTlsGateway({
      target: TWILIO_IE1_EGRESS_TARGET,
      connectUpstream,
      idleTimeoutMs: 100,
    });
    openServers.push(gateway);
    const port = await gateway.listen(0, "127.0.0.1");
    await roundTrip(port, payload);
    expect(connectUpstream).not.toHaveBeenCalled();
  });

  it("rejects a different SNI before any upstream connection", async () => {
    const connectUpstream = vi.fn();
    const gateway = createFixedTlsGateway({ target: TWILIO_IE1_EGRESS_TARGET, connectUpstream });
    openServers.push(gateway);
    const port = await gateway.listen(0, "127.0.0.1");
    await roundTrip(port, clientHello("api.twilio.com"));
    expect(connectUpstream).not.toHaveBeenCalled();
  });

  it("forwards an authorized stream only to the injected fixed target", async () => {
    const upstream = createServer(socket => {
      socket.once("data", data => socket.end(Buffer.concat([Buffer.from("ACK:"), data])));
    });
    openServers.push(upstream);
    const upstreamPort = await listen(upstream);
    const gateway = createFixedTlsGateway({
      target: { ...TWILIO_IE1_EGRESS_TARGET, host: "127.0.0.1", port: upstreamPort },
    });
    openServers.push(gateway);
    const gatewayPort = await gateway.listen(0, "127.0.0.1");
    const hello = clientHello(TWILIO_IE1_EGRESS_TARGET.serverName);
    expect(await roundTrip(gatewayPort, hello)).toEqual(Buffer.concat([Buffer.from("ACK:"), hello]));
  });

  it("accepts the real Node 24 ClientHello for the exact IE1 SNI", async () => {
    let receiveHello!: (value: Buffer) => void;
    const received = new Promise<Buffer>(resolve => { receiveHello = resolve; });
    const upstream = createServer(socket => {
      socket.once("data", data => {
        receiveHello(Buffer.from(data));
        socket.destroy();
      });
    });
    openServers.push(upstream);
    const upstreamPort = await listen(upstream);
    const gateway = createFixedTlsGateway({
      target: { ...TWILIO_IE1_EGRESS_TARGET, host: "127.0.0.1", port: upstreamPort },
    });
    openServers.push(gateway);
    const gatewayPort = await gateway.listen(0, "127.0.0.1");
    const client = connectTls({
      host: "127.0.0.1",
      port: gatewayPort,
      servername: TWILIO_IE1_EGRESS_TARGET.serverName,
      rejectUnauthorized: false,
    });
    client.on("error", () => undefined);
    const hello = await received;
    expect(inspectTlsClientHello(hello)).toEqual({
      state: "READY",
      serverName: TWILIO_IE1_EGRESS_TARGET.serverName,
    });
    client.destroy();
  });

  it("bounds concurrent streams and closes idle clients", async () => {
    const connectUpstream = vi.fn();
    const gateway = createFixedTlsGateway({
      target: TWILIO_IE1_EGRESS_TARGET,
      connectUpstream,
      maxConnections: 1,
      idleTimeoutMs: 40,
    });
    openServers.push(gateway);
    const port = await gateway.listen(0, "127.0.0.1");
    const first = connect({ host: "127.0.0.1", port });
    await once(first, "connect");
    const second = connect({ host: "127.0.0.1", port });
    await once(second, "close");
    await once(first, "close");
    expect(connectUpstream).not.toHaveBeenCalled();
  });
});
