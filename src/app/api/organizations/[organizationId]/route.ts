import { sessionToken, unavailable } from "@/server/security/http";
import { readOrganization } from "@/modules/organizations/service";
import { organizationIdSchema } from "@/modules/organizations/validation";
export async function GET(request: Request, context: { params: Promise<{ organizationId: string }> }) {
 const token = await sessionToken(request);
 if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
 const id = organizationIdSchema.safeParse((await context.params).organizationId);
 if (!id.success) return unavailable();
 try { return Response.json(await readOrganization(token, id.data), { headers: { "Cache-Control": "no-store" } }); }
 catch { return unavailable(); }
}
