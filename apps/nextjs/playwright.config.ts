import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm with-env next dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
