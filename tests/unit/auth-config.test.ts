import { it, expect } from "vitest";
import { parseAuthEnvironment } from "../../src/modules/auth/environment";
import { organizationInputSchema } from "../../src/modules/organizations/validation";
const valid = { DATABASE_URL: "postgresql://app:test@localhost/tony", AUTH_DATABASE_URL: "postgresql://auth:test@localhost/tony", BETTER_AUTH_SECRET: "abcdefghijklmnopqrstuvwxyz0123456789", BETTER_AUTH_URL: "http://127.0.0.1:3000", AUTH_MAIL_MODE: "local" };
it("requires separated credentials and strong explicit auth configuration", () => {
 expect(parseAuthEnvironment({ ...valid, BETTER_AUTH_URL: valid.BETTER_AUTH_URL + "/" }).BETTER_AUTH_URL).toBe(valid.BETTER_AUTH_URL);
 expect(parseAuthEnvironment(valid).AUTH_MAIL_MODE).toBe("local");
 for (const override of [{ BETTER_AUTH_SECRET: "short" }, { BETTER_AUTH_SECRET: "x".repeat(32) }, { AUTH_DATABASE_URL: valid.DATABASE_URL }, { AUTH_DATABASE_URL: "postgresql://app:different@localhost/tony" }, { BETTER_AUTH_URL: "https://tonywork.com" }, { AUTH_MAIL_MODE: "production" }, { BETTER_AUTH_URL: "http://127.0.0.1:3000/path" }]) expect(() => parseAuthEnvironment({ ...valid, ...override })).toThrow();
});
it("rejects unexpected fields and invalid organization configuration", () => {
 const input = { name: "Synthetic", defaultLocale: "fr-FR", currency: "EUR", timeZone: "Europe/Paris" };
 expect(organizationInputSchema.parse(input)).toEqual(input);
 for (const override of [{ role: "OWNER" }, { name: " " }, { timeZone: "Invalid" }, { currency: "INVALID" }]) expect(() => organizationInputSchema.parse({ ...input, ...override })).toThrow();
});
