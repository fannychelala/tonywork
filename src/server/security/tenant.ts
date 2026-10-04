import type { PrismaClient, Prisma } from "../../db/generated/client";
export type TenantAccess = { token: string; organizationId: string; adminGrant?: string };
export async function withTenant<T>(db: PrismaClient, access: TenantAccess, execute: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
 return db.$transaction(async tx => {
  await tx.$queryRaw`SELECT tony_security.open_context(${access.token}, ${access.organizationId}::uuid, ${access.adminGrant ?? null}::text)`;
  try { return await execute(tx); }
  finally { await tx.$queryRaw`SELECT tony_security.close_context()`; }
 });
}
