import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = "/tmp/tony-poc-live-synthetic-fixture";
rmSync(root, { recursive: true, force: true });
mkdirSync(join(root, "private"), { recursive: true, mode: 0o700 });
mkdirSync(join(root, "secrets"), { recursive: true, mode: 0o700 });

const manifest = {
  mode: "LIVE_POC", region: "ie1", edge: "dublin", country: "FR", numberCategory: "TECHNICAL_PLATFORM",
  voice: true, sms: true, accountSid: `AC${"1".repeat(32)}`, numberSid: `PN${"2".repeat(32)}`,
  publicOrigin: "https://synthetic-poc.trycloudflare.com", maximumBudgetCents: 5000, currency: "EUR",
  startsAt: "2026-10-12T12:00:00.000Z", endsAt: "2026-10-12T14:00:00.000Z", testers: 2,
  inboundLimit: 10, outboundSegmentLimit: 5, smsSegmentLimit: 5, recordingLimit: 2, recordingSeconds: 10, callSeconds: 60,
};
const binding = {
  manifest, number: "+33939200000",
  testers: [
    { slot: "T1", phone: "+33600000001", callSmsConsent: true, audioConsent: true },
    { slot: "T2", phone: "+33600000002", callSmsConsent: true, audioConsent: true },
  ],
  fixedCostCents: 1000, callReserveCents: 100, smsReserveCents: 100, recordingReserveCents: 100,
};
const files = new Map([
  ["private/binding.json", JSON.stringify(binding)],
  ["secrets/database-url", "postgresql://tony_poc_runtime:synthetic_poc_runtime_only@poc-live-postgres:5432/tony_poc"],
  ["secrets/api-key", `SK${"3".repeat(32)}`],
  ["secrets/api-secret", "4".repeat(32)],
  ["secrets/auth-token", "5".repeat(32)],
]);
for (const [path, contents] of files) writeFileSync(join(root, path), contents, { mode: 0o600 });
