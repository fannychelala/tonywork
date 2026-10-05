import { describe, expect, it } from "vitest";
import { parseConfig, FAKE_ACCOUNT, FAKE_SECRET } from "../config";
import { verifyEnvelope } from "../webhook";
import { SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE } from "./fixtures";

describe("POC closed configuration and admission", () => {
  it("defaults only to isolated LOCAL_FAKE", () => expect(parseConfig({}).mode).toBe("LOCAL_FAKE"));
  it.each(["LIVE_POC", "PROVIDER_TEST", "latest"])("refuses mode %s", mode => expect(() => parseConfig({ mode })).toThrow());
  it.each([{ organizationId: "B" }, { token: "real" }, { databaseUrl: "postgresql://tony_app:x@postgres/tony" }])("refuses foreign configuration", input => expect(() => parseConfig(input)).toThrow());
  it("admits independent signed synthetic vector", () => expect(verifyEnvelope("call-status", SYNTHETIC_CALLBACK, SYNTHETIC_SIGNATURE)).toMatchObject({ account: FAKE_ACCOUNT, status: "completed" }));
  it.each(["", "incorrect"])("rejects signature %s", signature => expect(() => verifyEnvelope("call-status", SYNTHETIC_CALLBACK, signature)).toThrow());
  it("rejects altered payload before projection", () => expect(() => verifyEnvelope("call-status", SYNTHETIC_CALLBACK + "&organizationId=B", SYNTHETIC_SIGNATURE)).toThrow());
  it("never accepts cookie as signature", () => expect(() => verifyEnvelope("call-status", SYNTHETIC_CALLBACK, "session=A")).toThrow());
  it("uses synthetic secret exclusively", () => expect(FAKE_SECRET).toBe("synthetic-poc-signature-key-not-a-credential"));
});
