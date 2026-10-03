import { describe, it, expect } from "vitest";
import { formatMoney, formatDate } from "../../src/shared/i18n/format";
describe("international formats", () => {
 it("uses currency precision, including zero and three decimal currencies", () => {
  expect(formatMoney(120000, "EUR", "en-GB")).toBe("€1,200.00");
  expect(formatMoney(1200, "JPY", "en-US")).toBe("¥1,200");
  expect(formatMoney(1234, "KWD", "en-US")).toBe("KWD 1.234");
 });
 it("rejects non-integer or unsafe amounts", () => { for (const value of [1.1, NaN, Number.MAX_SAFE_INTEGER + 1]) expect(() => formatMoney(value, "EUR", "fr-FR")).toThrow(); });
 it("uses explicit timezone across daylight saving", () => {
  expect(formatDate(new Date("2026-03-29T00:30:00Z"), "en-GB", "Europe/Paris")).toContain("01:30");
  expect(formatDate(new Date("2026-03-29T01:30:00Z"), "en-GB", "Europe/Paris")).toContain("03:30");
  expect(formatDate(new Date("2026-03-29T01:30:00Z"), "en-GB", "UTC")).toContain("01:30");
 });
});
