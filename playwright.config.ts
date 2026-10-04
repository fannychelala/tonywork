import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
 // Shared local anti-abuse buckets require serial, isolated DB fixture scenarios.
 testDir: "./tests/e2e", workers: 1, fullyParallel: true, forbidOnly: Boolean(process.env.CI), retries: process.env.CI ? 1 : 0,
 use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
 projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }, { name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
 webServer: { command: "pnpm start", url: "http://127.0.0.1:3000/health", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
