import { checkReadiness } from "@/server/services/readiness";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
 const ready = await checkReadiness();
 return Response.json({ status: ready ? "ready" : "not_ready" }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
