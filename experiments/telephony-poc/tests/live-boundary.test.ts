import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { assertPocGraph } from "./boundary";
describe("mode-specific import boundaries", () => {
  it("inspects the complete LOCAL_FAKE entry graph", () => expect(assertPocGraph("experiments/telephony-poc/main.ts", "LOCAL_FAKE").size).toBeGreaterThan(4));
  it.each([
    'import renamed from "twilio"; renamed("x", "y");',
    'import { Twilio as Renamed } from "twilio"; new Renamed("x", "y");',
    'import * as sdk from "twilio"; new sdk.Twilio("x", "y");',
    'import sdk from "twilio"; const alias = sdk; alias("x", "y");',
    'import sdk from "twilio"; const { Twilio: Alias } = sdk; new Alias("x", "y");',
    'import { request } from "node:https"; request("https://example.test");',
    'import("./hidden");', 'fetch("https://example.test");', 'const x = PrismaClient;',
  ])("detects forbidden capabilities including aliases", source => {
    const entry = resolve("experiments/telephony-poc/mutant.ts");
    expect(() => assertPocGraph(entry, "LOCAL_FAKE", { [entry]: source })).toThrow();
  });
  it("cannot hide a network constructor in a nested dependency", () => {
    const entry = resolve("experiments/telephony-poc/mutant.ts"), child = resolve("experiments/telephony-poc/nested/hidden.ts");
    expect(() => assertPocGraph(entry, "LOCAL_FAKE", { [entry]: 'export * from "./nested/hidden";', [child]: 'import renamed from "twilio"; renamed("x", "y");' })).toThrow("SDK_NETWORK_CONSTRUCTOR");
  });
  it("rejects product imports in either mode", () => {
    const entry = resolve("experiments/telephony-poc/mutant.ts");
    for (const mode of ["LOCAL_FAKE", "LIVE"] as const) expect(() => assertPocGraph(entry, mode, { [entry]: 'import x from "../../src/modules/auth/auth";' })).toThrow("PRODUCT_IMPORT");
  });
  it("forbids an edge from fake to live even before a client is constructed", () => {
    const entry = resolve("experiments/telephony-poc/mutant.ts");
    expect(() => assertPocGraph(entry, "LOCAL_FAKE", { [entry]: 'export * from "./live-config";' })).toThrow("LIVE_IMPORT_IN_FAKE");
  });
});
