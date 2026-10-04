import { getDatabase } from "@/server/repositories/database";
import { withTenant } from "@/server/security/tenant";
import { organizationInputSchema } from "./validation";
export async function createOrganization(token: string, input: unknown) {
 const v = organizationInputSchema.parse(input);
 const rows = await getDatabase().$queryRaw<Array<{ id: string }>>`SELECT tony_security.create_organization(${token}, ${v.name}, ${v.defaultLocale}, ${v.currency}, ${v.timeZone}) AS id`;
 return rows[0];
}
export async function readOrganization(token: string, organizationId: string, adminReason?: string) {
 const db = getDatabase();
 let adminGrant: string | undefined;
 if (adminReason) {
  const grants = await db.$queryRaw<Array<{ id: string }>>`SELECT tony_security.authorize_admin_access(${token}, ${organizationId}::uuid, ${adminReason}) AS id`;
  adminGrant = grants[0]?.id;
  if (!adminGrant) throw new Error("Not authorized");
 }
 return withTenant(db, { token, organizationId, ...(adminGrant ? { adminGrant } : {}) }, async tx => {
  const organization = await tx.organization.findUnique({ where: { id: organizationId } });
  const memberships = await tx.membership.findMany({ where: { organizationId }, select: { id: true, userId: true, role: true }, take: 100 });
  return { organization, memberships };
 });
}
