export async function register() {
 if (process.env.NEXT_RUNTIME === "nodejs") {
  const { parseRuntimeEnvironment } = await import("./server/config/env");
  parseRuntimeEnvironment(process.env);
 }
}
