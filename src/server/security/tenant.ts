import type { PrismaClient, Prisma } from "../../db/generated/client";
export type TenantAccess = { token: string; organizationId: string; adminGrant?: string };
export async function withTenant<T>(db: PrismaClient, access: TenantAccess, execute: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
 return db.$transaction(async tx => {
  await tx.$executeRaw`SELECT tony_security.open_context(${access.token}, ${access.organizationId}::uuid, ${access.adminGrant ?? null}::text)`;
  // A failed SQL statement aborts PostgreSQL's transaction. Prisma rolls it back,
  // including open_context; issuing close_context then would mask the original error.
  const result = await execute(tx);
  await tx.$executeRaw`SELECT tony_security.close_context()`;
  return result;
 });
}
