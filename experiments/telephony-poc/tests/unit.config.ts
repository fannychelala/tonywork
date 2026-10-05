import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["experiments/telephony-poc/tests/security.test.ts", "experiments/telephony-poc/tests/behavior.test.ts"], environment: "node" } });
