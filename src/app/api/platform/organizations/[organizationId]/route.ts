import { z } from "zod";
import { sessionToken, sameOrigin, unavailable } from "@/server/security/http";
import { readOrganization } from "@/modules/organizations/service";
import { organizationIdSchema } from "@/modules/organizations/validation";
export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
 if (!sameOrigin(request)) return Response.json({ error: "Forbidden" }, { status: 403 });
 const token = await sessionToken(request);
 if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
 const id = organizationIdSchema.safeParse((await context.params).organizationId);
 if (!id.success) return unavailable();
 try { const body = z.object({ reason: z.string().trim().min(10).max(200) }).strict().parse(await request.json()); return Response.json(await readOrganization(token, id.data, body.reason), { headers: { "Cache-Control": "no-store" } }); }
 catch { return unavailable(); }
}
