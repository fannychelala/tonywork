import { Pool } from "pg";
import { assertLiveEffectsAuthorized } from "./live-config";
import { createLiveNetworkTransport } from "./live-transport";
import { LiveTwilioProvider } from "./live-provider";
import { LivePocRepository } from "./live-repository";
import { createLivePocServer } from "./live-server";
export async function startPreparedLive(loadPrivate: () => unknown): Promise<void> {
  assertLiveEffectsAuthorized();
  const { binding, transport, probe } = createLiveNetworkTransport(loadPrivate);
  const provider = new LiveTwilioProvider(binding, transport, probe);
  await provider.verifyNumber();
  const pool = new Pool({ connectionString: binding.manifest.databaseUrl, max: 4 });
  const repository = new LivePocRepository(pool, binding);
  const server = createLivePocServer(binding, repository);
  try {
    await repository.bindNumber();
    try { await repository.cleanup(provider); }
    catch (error) {
      await repository.stop();
      if (!(error instanceof Error) || error.message !== "CLEANUP_PENDING_RECONCILIATION") throw error;
      // Closed admissions, but signed recording callbacks can resolve an ambiguous creation.
    }
    await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(4316, "127.0.0.1", resolve); });
  } catch { await pool.end(); throw new Error("LIVE_START_FAILED"); }
  server.requestTimeout = 5000;
  let cleaning = false;
  const watcher = setInterval(async () => {
    if (cleaning) return; cleaning = true;
    try { await repository.cleanup(provider); }
    catch (error) {
      try { await repository.stop(); }
      catch { clearInterval(watcher); server.close(() => { void pool.end(); }); process.exitCode = 1; return; }
      if (!(error instanceof Error) || error.message !== "CLEANUP_PENDING_RECONCILIATION") {
        clearInterval(watcher); try { await repository.emergencyStop(provider); } catch { process.exitCode = 1; }
        server.close(() => { void pool.end(); }); process.exitCode = 1;
      }
    }
    finally { cleaning = false; }
  }, 2000);
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => {
    clearInterval(watcher);
    void (async () => {
      try { await repository.emergencyStop(provider); } catch { process.exitCode = 1; }
      try { await repository.cleanup(provider, true); } catch { process.exitCode = 1; }
      server.close(() => { void pool.end(); });
    })();
  });
}
