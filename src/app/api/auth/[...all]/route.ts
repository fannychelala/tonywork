import { protectSessionResponse } from "@/modules/auth/response";
import { getAuth } from "@/modules/auth/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return protectSessionResponse(await getAuth().handler(request)); }
export async function POST(request: Request) { return protectSessionResponse(await getAuth().handler(request)); }
