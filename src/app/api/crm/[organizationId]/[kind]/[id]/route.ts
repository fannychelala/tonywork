import {handle} from "@/modules/crm/http";
type Context={params:Promise<{organizationId:string;kind:string;id:string}>};
export async function GET(request:Request,context:Context){return handle(request,await context.params);}
export async function PATCH(request:Request,context:Context){return handle(request,await context.params);}
export async function DELETE(request:Request,context:Context){return handle(request,await context.params);}
