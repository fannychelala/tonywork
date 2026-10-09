export type FixedEgressTarget = Readonly<{ host: string; port: number; serverName: string }>;

export const TWILIO_IE1_EGRESS_TARGET: FixedEgressTarget = Object.freeze({
  host: "api.dublin.ie1.twilio.com",
  port: 443,
  serverName: "api.dublin.ie1.twilio.com",
});

export const LIVE_EGRESS_GATEWAY = Object.freeze({ host: "poc-live-egress", port: 8443 });
