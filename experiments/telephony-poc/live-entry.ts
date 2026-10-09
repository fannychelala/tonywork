import { startPreparedLive } from "./live-main";
import { loadLivePrivateFromFiles } from "./live-private-loader";

// The final authorization lock in startPreparedLive runs before this loader.
// Preparation builds may include this entry, but cannot start LIVE effects.
void startPreparedLive(loadLivePrivateFromFiles).catch(() => {
  process.exitCode = 1;
});
