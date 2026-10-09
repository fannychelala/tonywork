import { assertLiveEffectsAuthorized } from "./live-config";
import { createFixedTlsGateway } from "./live-egress-gateway";
import { TWILIO_IE1_EGRESS_TARGET } from "./live-egress-policy";

// The final human authorization lock runs before DNS, listening or provider egress.
assertLiveEffectsAuthorized();
const gateway = createFixedTlsGateway({ target: TWILIO_IE1_EGRESS_TARGET });
void gateway.listen(8443, "0.0.0.0").catch(() => {
  process.exitCode = 1;
});
