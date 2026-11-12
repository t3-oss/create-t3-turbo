import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:43161" },
  webServer: {
    command: "PORT=43161 pnpm with-env next dev",
    url: "http://localhost:43161",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
