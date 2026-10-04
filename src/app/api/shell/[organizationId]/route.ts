import { getAuth } from "@/modules/auth/server";
import { readOrganizationIdentity } from "@/modules/organizations/service";
import { organizationIdSchema } from "@/modules/organizations/validation";
import { unavailable } from "@/server/security/http";
export async function GET(request: Request, context: { params: Promise<{ organizationId: string }> }) {
 const session = await getAuth().api.getSession({ headers: request.headers });
 if (!session) return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
 const id = organizationIdSchema.safeParse((await context.params).organizationId);
 if (!id.success || session.user.platformRole === "PLATFORM_ADMIN") return unavailable();
 try {
  const organization = await readOrganizationIdentity(session.session.token, id.data);
  if (!organization) return unavailable();
  return Response.json(organization, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
 } catch { return unavailable(); }
}
