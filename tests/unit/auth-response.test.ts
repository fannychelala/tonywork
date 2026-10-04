import { it, expect } from "vitest";
import { protectSessionResponse } from "../../src/modules/auth/response";
it("removes bearer tokens from public JSON while preserving signed cookies", async () => {
 const response = Response.json({ token: "secret", session: { id: "id", token: "secret" }, items: [{ token: "secret" }] }, { headers: { "set-cookie": "session=signature; HttpOnly" } });
 const result = await protectSessionResponse(response);
 expect(await result.json()).toEqual({ session: { id: "id" }, items: [{}] });
 expect(result.headers.get("set-cookie")).toContain("HttpOnly"); expect(result.headers.get("cache-control")).toBe("no-store");
});
