import {handle} from "@/modules/crm/http";
type Context={params:Promise<{organizationId:string;kind:string}>};
export async function GET(request:Request,context:Context){return handle(request,await context.params);}
export async function POST(request:Request,context:Context){return handle(request,await context.params);}
