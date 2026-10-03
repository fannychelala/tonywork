import { describe, it, expect } from "vitest";
import { parseRuntimeEnvironment } from "../../src/server/config/env";
describe("server environment", () => {
 it("rejects missing and non-PostgreSQL URLs", () => {
  for (const value of [{}, { DATABASE_URL: "https://example.com" }, { DATABASE_URL: "invalid" }]) expect(() => parseRuntimeEnvironment(value)).toThrow("Invalid server configuration");
 });
 it("does not expose credentials in errors", () => {
  expect(() => parseRuntimeEnvironment({ DATABASE_URL: "https://secret:password@example.com" })).toThrow(/^Invalid server configuration: DATABASE_URL must be a PostgreSQL URL$/);
 });
 it("accepts PostgreSQL", () => expect(parseRuntimeEnvironment({ DATABASE_URL: "postgresql://user:pass@localhost:5432/tony" }).DATABASE_URL).toContain("postgresql://"));
});
