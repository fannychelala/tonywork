import { writeFileSync } from "node:fs";
import { loadLivePrivateFromFiles } from "./live-private-loader";

// Synthetic preparation probe only: validates private mounts and stays on a
// deny-all Docker network. It never imports transport, provider or tunnel code.
loadLivePrivateFromFiles();
writeFileSync("/tmp/live-preflight-ok", "ok", { encoding: "utf8", mode: 0o600 });
setInterval(() => undefined, 60_000);
