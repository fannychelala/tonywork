import { createFixedTlsGateway } from "./live-egress-gateway";
import { TWILIO_IE1_EGRESS_TARGET } from "./live-egress-policy";

// This entry can reach only the synthetic upstream on an internal Docker network.
// The real target exists only in live-egress-entry.ts, behind the final lock.
const gateway = createFixedTlsGateway({
  target: Object.freeze({
    host: "poc-live-synthetic-upstream",
    port: 9443,
    serverName: TWILIO_IE1_EGRESS_TARGET.serverName,
  }),
});
void gateway.listen(8443, "0.0.0.0").catch(() => {
  process.exitCode = 1;
});
