import "server-only";
import { getDatabase } from "@/server/repositories/database";
export async function checkReadiness(): Promise<boolean> {
 try {
  const probe = await getDatabase().systemProbe.findUnique({ where: { id: "foundation" }, select: { id: true } });
  return probe !== null;
 } catch { return false; }
}
