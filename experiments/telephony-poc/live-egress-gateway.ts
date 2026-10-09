import { connect, createServer, type Socket } from "node:net";
import type { FixedEgressTarget } from "./live-egress-policy";

const MAX_CLIENT_HELLO_BYTES = 8192;

export type ClientHelloInspection =
  | Readonly<{ state: "INCOMPLETE" }>
  | Readonly<{ state: "INVALID" }>
  | Readonly<{ state: "READY"; serverName: string }>;

const incomplete = Object.freeze({ state: "INCOMPLETE" as const });
const invalid = Object.freeze({ state: "INVALID" as const });

function readU16(input: Buffer, offset: number): number | undefined {
  if (offset + 2 > input.length) return undefined;
  return input.readUInt16BE(offset);
}

function readU24(input: Buffer, offset: number): number | undefined {
  if (offset + 3 > input.length) return undefined;
  return input.readUIntBE(offset, 3);
}

export function inspectTlsClientHello(input: Uint8Array): ClientHelloInspection {
  const data = Buffer.from(input);
  if (data.length > MAX_CLIENT_HELLO_BYTES) return invalid;
  if (data.length < 5) return incomplete;
  if (data[0] !== 0x16 || data[1] !== 3 || data[2]! < 1 || data[2]! > 4) return invalid;

  const recordLength = readU16(data, 3)!;
  if (recordLength < 4 || recordLength + 5 > MAX_CLIENT_HELLO_BYTES) return invalid;
  if (data.length < recordLength + 5) return incomplete;
  if (data[5] !== 1) return invalid;

  const handshakeLength = readU24(data, 6)!;
  const handshakeEnd = 9 + handshakeLength;
  if (handshakeLength < 38 || handshakeEnd > recordLength + 5) return invalid;
  let cursor = 9;

  if (cursor + 34 > handshakeEnd) return invalid;
  cursor += 34;
  const sessionLength = data[cursor++]!;
  if (cursor + sessionLength > handshakeEnd) return invalid;
  cursor += sessionLength;

  const cipherLength = readU16(data, cursor);
  if (cipherLength === undefined || cipherLength < 2 || cipherLength % 2 !== 0) return invalid;
  cursor += 2;
  if (cursor + cipherLength > handshakeEnd) return invalid;
  cursor += cipherLength;

  if (cursor >= handshakeEnd) return invalid;
  const compressionLength = data[cursor++]!;
  if (compressionLength < 1 || cursor + compressionLength > handshakeEnd) return invalid;
  cursor += compressionLength;

  const extensionsLength = readU16(data, cursor);
  if (extensionsLength === undefined) return invalid;
  cursor += 2;
  const extensionsEnd = cursor + extensionsLength;
  if (extensionsEnd !== handshakeEnd) return invalid;

  let serverName: string | undefined;
  while (cursor < extensionsEnd) {
    const type = readU16(data, cursor);
    const length = readU16(data, cursor + 2);
    if (type === undefined || length === undefined) return invalid;
    cursor += 4;
    const extensionEnd = cursor + length;
    if (extensionEnd > extensionsEnd) return invalid;
    if (type !== 0) {
      cursor = extensionEnd;
      continue;
    }
    if (serverName !== undefined) return invalid;
    const listLength = readU16(data, cursor);
    if (listLength === undefined || cursor + 2 + listLength !== extensionEnd) return invalid;
    cursor += 2;
    if (cursor + 3 > extensionEnd || data[cursor] !== 0) return invalid;
    const nameLength = readU16(data, cursor + 1)!;
    cursor += 3;
    if (nameLength < 1 || cursor + nameLength !== extensionEnd) return invalid;
    const nameBytes = data.subarray(cursor, cursor + nameLength);
    if (nameBytes.some(byte => byte > 0x7f || byte === 0)) return invalid;
    const candidate = nameBytes.toString("ascii").toLowerCase();
    if (candidate.length > 253 || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])$/.test(candidate)) return invalid;
    serverName = candidate;
    cursor = extensionEnd;
  }
  return serverName ? Object.freeze({ state: "READY" as const, serverName }) : invalid;
}

type GatewayOptions = Readonly<{
  target: FixedEgressTarget;
  connectUpstream?: (target: FixedEgressTarget) => Socket;
  maxConnections?: number;
  idleTimeoutMs?: number;
}>;

export type FixedTlsGateway = Readonly<{
  listen(port: number, host: string): Promise<number>;
  close(): Promise<void>;
}>;

export function createFixedTlsGateway(options: GatewayOptions): FixedTlsGateway {
  const target = Object.freeze({ ...options.target });
  const connectUpstream = options.connectUpstream ?? (fixed => connect({ host: fixed.host, port: fixed.port }));
  const maxConnections = options.maxConnections ?? 4;
  const idleTimeoutMs = options.idleTimeoutMs ?? 6000;
  if (!Number.isInteger(maxConnections) || maxConnections < 1 || maxConnections > 16) throw new Error("INVALID_EGRESS_LIMIT");
  if (!Number.isInteger(idleTimeoutMs) || idleTimeoutMs < 25 || idleTimeoutMs > 15000) throw new Error("INVALID_EGRESS_TIMEOUT");

  const sockets = new Set<Socket>();
  let active = 0;
  const server = createServer({ allowHalfOpen: true }, client => {
    sockets.add(client);
    client.once("close", () => sockets.delete(client));
    if (active >= maxConnections) {
      client.destroy();
      return;
    }
    active += 1;
    let finished = false;
    let upstream: Socket | undefined;
    let buffered = Buffer.alloc(0);
    const finish = () => {
      if (!finished) {
        finished = true;
        active -= 1;
      }
    };
    const closeBoth = () => {
      client.destroy();
      upstream?.destroy();
    };
    client.setTimeout(idleTimeoutMs, closeBoth);
    client.once("error", closeBoth);
    client.once("close", finish);
    client.on("data", chunk => {
      if (upstream) return;
      buffered = Buffer.concat([buffered, Buffer.from(chunk)]);
      const inspection = inspectTlsClientHello(buffered);
      if (inspection.state === "INCOMPLETE") return;
      client.pause();
      if (inspection.state !== "READY" || inspection.serverName !== target.serverName) {
        closeBoth();
        return;
      }
      try {
        upstream = connectUpstream(target);
      } catch {
        closeBoth();
        return;
      }
      sockets.add(upstream);
      upstream.setTimeout(idleTimeoutMs, closeBoth);
      upstream.once("error", closeBoth);
      upstream.once("close", () => sockets.delete(upstream!));
      upstream.once("connect", () => {
        upstream!.write(buffered);
        buffered = Buffer.alloc(0);
        client.pipe(upstream!).pipe(client);
        client.resume();
      });
    });
  });

  return Object.freeze({
    listen: (port, host) => new Promise<number>((resolve, reject) => {
      const onError = (error: Error) => reject(error);
      server.once("error", onError);
      server.listen(port, host, () => {
        server.off("error", onError);
        const address = server.address();
        if (!address || typeof address === "string") return reject(new Error("INVALID_EGRESS_ADDRESS"));
        resolve(address.port);
      });
    }),
    close: () => new Promise<void>((resolve, reject) => {
      for (const socket of sockets) socket.destroy();
      if (!server.listening) return resolve();
      server.close(error => error ? reject(error) : resolve());
    }),
  });
}
