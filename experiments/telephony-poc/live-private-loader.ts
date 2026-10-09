import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseLiveBinding, type LiveBinding } from "./live-binding";

const livePrivateRoot = "/run/tony-poc";
const bindingPath = "private/binding.json";
const secretPaths = Object.freeze({
  databaseUrl: "secrets/database-url",
  apiKey: "secrets/api-key",
  apiSecret: "secrets/api-secret",
  authToken: "secrets/auth-token",
});

function secureRead(root: string, relativePath: string, maximumBytes: number): string {
  const path = join(root, relativePath);
  const before = lstatSync(path);
  const mode = before.mode & 0o777;
  const expectedUid = process.getuid?.();
  if (!before.isFile() || before.isSymbolicLink() || ![0o400, 0o600].includes(mode)
    || expectedUid === undefined || before.uid !== expectedUid || before.size < 1 || before.size > maximumBytes) throw new Error();
  const descriptor = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const after = fstatSync(descriptor);
    if (!after.isFile() || after.dev !== before.dev || after.ino !== before.ino || after.uid !== expectedUid
      || (after.mode & 0o777) !== mode || after.size !== before.size) throw new Error();
    return readFileSync(descriptor, { encoding: "utf8" });
  } finally {
    closeSync(descriptor);
  }
}

function exactSecret(root: string, path: string, maximumBytes: number): string {
  const value = secureRead(root, path, maximumBytes);
  if (value.trim() !== value || /[\r\n\0]/.test(value)) throw new Error();
  return value;
}

export function loadLivePrivateFromDirectory(root: string): LiveBinding {
  try {
    const raw: unknown = JSON.parse(secureRead(root, bindingPath, 32768));
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || "secrets" in raw) throw new Error();
    const input = raw as Record<string, unknown>;
    const rawManifest = input.manifest;
    if (!rawManifest || typeof rawManifest !== "object" || Array.isArray(rawManifest) || "databaseUrl" in rawManifest) throw new Error();
    const manifest = rawManifest as Record<string, unknown>;
    const databaseUrl = exactSecret(root, secretPaths.databaseUrl, 2048);
    const accountSid = manifest.accountSid;
    return parseLiveBinding({
      ...input,
      manifest: { ...manifest, databaseUrl },
      secrets: {
        region: "ie1",
        accountSid,
        keyType: "Restricted",
        apiKey: exactSecret(root, secretPaths.apiKey, 128),
        apiSecret: exactSecret(root, secretPaths.apiSecret, 256),
        authToken: exactSecret(root, secretPaths.authToken, 128),
      },
    });
  } catch {
    throw new Error("INVALID_PRIVATE_FILE_SET");
  }
}

export function loadLivePrivateFromFiles(): LiveBinding {
  return loadLivePrivateFromDirectory(livePrivateRoot);
}
