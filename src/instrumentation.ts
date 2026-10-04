export async function register() {
 if (process.env.NEXT_RUNTIME === "nodejs") {
  const { parseAuthEnvironment } = await import("./modules/auth/environment");
  parseAuthEnvironment(process.env);
 }
}
