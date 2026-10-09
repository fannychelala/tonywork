import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertPocGraph } from "./boundary";

describe("LIVE container preparation remains closed", () => {
  it("keeps the prepared entry behind the final authorization lock", () => {
    const visited = assertPocGraph("experiments/telephony-poc/live-entry.ts", "LIVE");
    expect(visited.has(resolve("experiments/telephony-poc/live-private-loader.ts"))).toBe(true);
    expect(visited.has(resolve("experiments/telephony-poc/live-config.ts"))).toBe(true);
  });

  it("keeps the real egress gateway entry behind the same final authorization lock", () => {
    const visited = assertPocGraph("experiments/telephony-poc/live-egress-entry.ts", "LIVE");
    expect(visited.has(resolve("experiments/telephony-poc/live-config.ts"))).toBe(true);
    expect(visited.has(resolve("experiments/telephony-poc/live-egress-gateway.ts"))).toBe(true);
  });

  it("keeps the container preflight unable to construct a provider or open a listener", () => {
    const visited = assertPocGraph("experiments/telephony-poc/live-preflight.ts", "LIVE");
    expect(visited.has(resolve("experiments/telephony-poc/live-private-loader.ts"))).toBe(true);
    for (const forbidden of [
      "live-provider.ts",
      "live-transport.ts",
      "live-server.ts",
      "live-tunnel.ts",
      "http-server.ts",
    ]) expect(visited.has(resolve("experiments/telephony-poc", forbidden))).toBe(false);
  });

  it("defines a distinct synthetic egress rehearsal with private read-only mounts", () => {
    const source = readFileSync("experiments/telephony-poc/compose.live-preparation.yml", "utf8");
    expect(source).toContain("name: tony-poc-live-preparation");
    expect(source).toMatch(/live-private:\s*\n\s*internal: true/);
    expect(source).toMatch(/synthetic-uplink:\s*\n\s*internal: true/);
    expect(source).toContain("poc-live-egress:");
    expect(source).toContain("poc-live-synthetic-upstream:");
    expect(source).toContain("live-egress-rehearsal.ts");
    expect(source).not.toContain("live-egress-entry.ts");
    expect(source).not.toMatch(/^\s*ports:/m);
    expect(source).not.toMatch(/TWILIO_|DATABASE_URL|AUTH_DATABASE_URL|BETTER_AUTH|MIGRATION_DATABASE_URL/);
    expect(source).toContain("read_only: true");
    expect(source).toContain("no-new-privileges:true");
    expect(source).toContain("cap_drop: [ALL]");
    for (const target of [
      "/run/tony-poc/private/binding.json",
      "/run/tony-poc/secrets/database-url",
      "/run/tony-poc/secrets/api-key",
      "/run/tony-poc/secrets/api-secret",
      "/run/tony-poc/secrets/auth-token",
    ]) expect(source).toContain(`target: ${target}`);
  });
});
