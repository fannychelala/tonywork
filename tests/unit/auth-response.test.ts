import { it, expect } from "vitest";
import { protectSessionResponse } from "../../src/modules/auth/response";
it("removes bearer tokens from public JSON while preserving signed cookies", async () => {
 const response = Response.json({ token: "secret", session: { id: "id", token: "secret" }, items: [{ token: "secret" }] }, { headers: { "set-cookie": "session=signature; HttpOnly" } });
 const result = await protectSessionResponse(response);
 expect(await result.json()).toEqual({ session: { id: "id" }, items: [{}] });
 expect(result.headers.get("set-cookie")).toContain("HttpOnly"); expect(result.headers.get("cache-control")).toBe("no-store");
});

it("preserves empty JSON redirects used by email verification", async () => {
 const response = new Response(null, { status: 302, headers: { "content-type": "application/json", location: "/" } });
 const result = await protectSessionResponse(response);
 expect(result.status).toBe(302); expect(result.headers.get("location")).toBe("/"); expect(await result.text()).toBe("");
});
