// Prisma's PostgreSQL adapter nests the original SQLSTATE under driverAdapterError.cause.
// Inspect only error metadata; never serialize messages or constraint details to the client.
export function sqlState(error:unknown,depth=0):string|undefined {
 if(!error||typeof error!=="object"||depth>5)return undefined;
 const value=error as Record<string,unknown>;
 if(typeof value.originalCode==="string")return value.originalCode;
 for(const key of ["meta","driverAdapterError","cause"]){const nested=sqlState(value[key],depth+1);if(nested)return nested;}
 return typeof value.code==="string"?value.code:undefined;
}
