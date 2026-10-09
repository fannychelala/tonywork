import { parseLivePreparation } from "../live-config";
export const liveManifest = () => parseLivePreparation({
  mode: "LIVE_POC", region: "ie1", edge: "dublin", country: "FR", numberCategory: "TECHNICAL_PLATFORM",
  voice: true, sms: true, accountSid: "AC" + "1".repeat(32), numberSid: "PN" + "2".repeat(32),
  publicOrigin: "https://synthetic-poc.trycloudflare.com", maximumBudgetCents: 5000, currency: "EUR",
  startsAt: "2026-10-12T12:00:00.000Z", endsAt: "2026-10-12T14:00:00.000Z", testers: 2,
  inboundLimit: 10, outboundSegmentLimit: 5, smsSegmentLimit: 5, recordingLimit: 2, recordingSeconds: 10, callSeconds: 60,
  databaseUrl: "postgresql://tony_poc_runtime:synthetic_poc_runtime_only@127.0.0.1:5556/tony_poc",
});
// Invented values, never allocated/looked up or used in a network request.
export const livePrivateFixture = () => ({
  manifest: liveManifest(), number: "+33939200000",
  testers: [
    { slot: "T1", phone: "+33600000001", callSmsConsent: true, audioConsent: true },
    { slot: "T2", phone: "+33600000002", callSmsConsent: true, audioConsent: true },
  ],
  secrets: { region: "ie1", accountSid: "AC" + "1".repeat(32), keyType: "Restricted", apiKey: "SK" + "3".repeat(32), apiSecret: "4".repeat(32), authToken: "5".repeat(32) },
  fixedCostCents: 1000, callReserveCents: 100, smsReserveCents: 100, recordingReserveCents: 100,
});
