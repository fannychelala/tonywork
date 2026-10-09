import { afterEach, describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { livePrivateFixture } from "./live-fixtures";
import { loadLivePrivateFromDirectory } from "../live-private-loader";

const roots: string[] = [];

function preparePrivateFiles(): { root: string; fixture: ReturnType<typeof livePrivateFixture> } {
  const fixture = livePrivateFixture();
  const root = mkdtempSync(join(tmpdir(), "tony-live-private-test-"));
  roots.push(root);
  mkdirSync(join(root, "private"), { mode: 0o700 });
  mkdirSync(join(root, "secrets"), { mode: 0o700 });
  const { databaseUrl, ...manifest } = fixture.manifest;
  const { secrets, ...binding } = fixture;
  const files = new Map([
    ["private/binding.json", JSON.stringify({ ...binding, manifest })],
    ["secrets/database-url", databaseUrl],
    ["secrets/api-key", secrets.apiKey],
    ["secrets/api-secret", secrets.apiSecret],
    ["secrets/auth-token", secrets.authToken],
  ]);
  for (const [path, value] of files) writeFileSync(join(root, path), value, { mode: 0o600 });
  return { root, fixture };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("LIVE private file loader", () => {
  it("loads the exact private file set without mutating or exposing it", () => {
    const { root, fixture } = preparePrivateFiles();
    const loaded = loadLivePrivateFromDirectory(root);
    expect(loaded).toEqual(fixture);
    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded.secrets)).toBe(true);
  });

  it.each([
    "private/binding.json",
    "secrets/database-url",
    "secrets/api-key",
    "secrets/api-secret",
    "secrets/auth-token",
  ])("requires %s", path => {
    const { root } = preparePrivateFiles();
    rmSync(join(root, path));
    expect(() => loadLivePrivateFromDirectory(root)).toThrow("INVALID_PRIVATE_FILE_SET");
  });

  it("rejects files readable by a group or other users", () => {
    const { root } = preparePrivateFiles();
    chmodSync(join(root, "secrets/api-secret"), 0o640);
    expect(() => loadLivePrivateFromDirectory(root)).toThrow("INVALID_PRIVATE_FILE_SET");
  });

  it("rejects symbolic links even when their target is owner-only", () => {
    const { root } = preparePrivateFiles();
    const target = join(root, "secrets/api-secret");
    const replacement = join(root, "secrets/api-secret-link");
    symlinkSync(target, replacement);
    rmSync(target);
    symlinkSync(replacement, target);
    expect(() => loadLivePrivateFromDirectory(root)).toThrow("INVALID_PRIVATE_FILE_SET");
  });

  it("rejects oversized files and whitespace-normalized secrets", () => {
    const first = preparePrivateFiles();
    writeFileSync(join(first.root, "private/binding.json"), "x".repeat(32769), { mode: 0o600 });
    expect(() => loadLivePrivateFromDirectory(first.root)).toThrow("INVALID_PRIVATE_FILE_SET");
    const second = preparePrivateFiles();
    writeFileSync(join(second.root, "secrets/api-secret"), second.fixture.secrets.apiSecret + "\n", { mode: 0o600 });
    expect(() => loadLivePrivateFromDirectory(second.root)).toThrow("INVALID_PRIVATE_FILE_SET");
  });

  it("returns a generic error without file contents or paths", () => {
    const { root } = preparePrivateFiles();
    const marker = "private-secret-marker";
    writeFileSync(join(root, "secrets/api-secret"), marker, { mode: 0o600 });
    let caught: unknown;
    try { loadLivePrivateFromDirectory(root); } catch (error) { caught = error; }
    expect(String(caught)).toBe("Error: INVALID_PRIVATE_FILE_SET");
    expect(JSON.stringify(caught)).not.toContain(marker);
    expect(JSON.stringify(caught)).not.toContain(root);
  });
});
