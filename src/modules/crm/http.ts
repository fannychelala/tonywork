import {z} from "zod";
import {getAuth} from "@/modules/auth/server";
import {sameOrigin} from "@/server/security/http";
import {crm,today,CrmError} from "./service";
import {kindSchema} from "./validation";
const headers={"Cache-Control":"private, no-store",Vary:"Cookie"};
const errors:Record<number,string>={400:"Invalid request",401:"Unauthorized",403:"Forbidden",404:"Not found or not authorized",409:"Conflict",413:"Request too large",500:"Unavailable"};
function error(status:number){return Response.json({error:errors[status]}, {status,headers});}
async function body(request:Request) {
 if(request.headers.get("content-type")?.split(";")[0]!=="application/json")throw new CrmError(400);
 const reader=request.body?.getReader();if(!reader)throw new CrmError(400);const chunks:Uint8Array[]=[];let size=0;
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>16384){await reader.cancel();throw new CrmError(413);}chunks.push(value);}}
 finally {reader.releaseLock();}
 const all=new Uint8Array(size);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}try{return JSON.parse(new TextDecoder().decode(all)) as unknown;}catch{throw new CrmError(400);}
}
export async function handle(request:Request,params:{organizationId:string;kind:string;id?:string}) {
 try {
  const session=await getAuth().api.getSession({headers:request.headers});if(!session)return error(401);
  if(session.user.platformRole==="PLATFORM_ADMIN")return error(404);
  const org=z.uuid().safeParse(params.organizationId);if(!org.success)return error(404);
  const method=request.method as "GET"|"POST"|"PATCH"|"DELETE";if(method!=="GET"&&!sameOrigin(request))return error(403);
  if(params.id&&!z.uuid().safeParse(params.id).success)return error(404);
  if(params.kind==="today") {if(method!=="GET"||params.id)return error(400);return Response.json(await today(session.session.token,org.data),{headers});}
  const kind=kindSchema.safeParse(params.kind);if(!kind.success)return error(404);
  if((method==="POST"&&params.id)||(["PATCH","DELETE"].includes(method)&&!params.id))return error(400);
  const input=method==="GET"?Object.fromEntries(new URL(request.url).searchParams):await body(request);
  const result=await crm(session.session.token,org.data,kind.data,method,params.id,input);
  return Response.json(result,{status:method==="POST"?201:200,headers});
 }catch(e) {
  if(e instanceof CrmError)return error(e.status);if(e instanceof z.ZodError)return error(400);
  // Do not expose SQL text, constraint names or payloads. Only map known authorization/integrity classes.
  const c=e as {code?:string;meta?:{code?:string};cause?:{code?:string}};const code=c.meta?.code??c.cause?.code??c.code;
  if(code==="42501")return error(404);if(["23505","23503","23001","P2002","P2003"].includes(code??""))return error(409);if(code==="23514")return error(400);return error(500);
 }
}
