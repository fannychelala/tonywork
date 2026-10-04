import "server-only";
import { getAuth } from "@/modules/auth/server";
import { parseAuthEnvironment } from "@/modules/auth/environment";
export async function sessionToken(request: Request): Promise<string | null> {
 const session = await getAuth().api.getSession({ headers: request.headers });
 return session?.session.token ?? null;
}
export function sameOrigin(request: Request): boolean {
 return request.headers.get("origin") === parseAuthEnvironment(process.env).BETTER_AUTH_URL;
}
export function unavailable() { return Response.json({ error: "Not found or not authorized" }, { status: 404, headers: { "Cache-Control": "no-store" } }); }
