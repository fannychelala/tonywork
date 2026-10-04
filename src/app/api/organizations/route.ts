import { sessionToken, sameOrigin, unavailable } from "@/server/security/http";
import { createOrganization } from "@/modules/organizations/service";
export async function POST(request: Request) {
 if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
 const token = await sessionToken(request);
 if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
 try { const result = await createOrganization(token, await request.json()); return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } }); }
 catch { return unavailable(); }
}
