import "server-only";
import { createAuth } from "./auth";
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() { instance ??= createAuth(process.env); return instance.auth; }
