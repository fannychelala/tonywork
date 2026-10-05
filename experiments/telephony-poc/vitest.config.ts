import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["experiments/telephony-poc/tests/**/*.test.ts"], environment: "node", testTimeout: 10000 } });
