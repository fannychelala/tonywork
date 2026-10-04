// Public auth APIs must not expose bearer session tokens already held in HttpOnly cookies.
export async function protectSessionResponse(response: Response): Promise<Response> {
 if (!response.headers.get("content-type")?.includes("application/json")) return response;
 const data: unknown = await response.clone().json();
 function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object") {
   return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "token").map(([key, item]) => [key, strip(item)]));
  }
  return value;
 }
 const headers = new Headers(response.headers); headers.delete("content-length"); headers.set("Cache-Control", "no-store");
 return new Response(JSON.stringify(strip(data)), { status: response.status, headers });
}
