import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["experiments/telephony-poc/tests/security.test.ts", "experiments/telephony-poc/tests/behavior.test.ts", "experiments/telephony-poc/tests/http.test.ts", "experiments/telephony-poc/tests/live-preparation.test.ts"], environment: "node" } });
