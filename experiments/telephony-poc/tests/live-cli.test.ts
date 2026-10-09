import { describe, expect, it } from "vitest";
import { liveCommandSchema, runPreparedLiveCommand } from "../live-cli";
import { assertPocGraph } from "./boundary";
describe("closed local LIVE operator", () => {
  it.each([{}, { command: "provision" }, { command: "cleanup", organizationId: "forbidden" }, { command: "execute", kind: "CALL", slot: "T3", id: "invalid" }, { command: "execute", kind: "SMS", slot: "T1", id: "00000000-0000-4000-8000-000000000001", phone: "+33600000001" }])("rejects invalid or extra fields", value => expect(liveCommandSchema.safeParse(value).success).toBe(false));
  it("refuses execution before private loading or PostgreSQL", async () => {
    let reads = 0;
    await expect(runPreparedLiveCommand({ command: "cleanup" }, () => { reads++; return {}; })).rejects.toThrow("FINAL_LIVE_AUTHORIZATION_REQUIRED");
    expect(reads).toBe(0);
  });
  it("inspects the complete operator graph", () => expect(assertPocGraph("experiments/telephony-poc/live-cli.ts", "LIVE").size).toBeGreaterThan(5));
});
