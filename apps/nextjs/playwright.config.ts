import { defineConfig } from "@playwright/test";

// eslint-disable-next-line no-restricted-properties
const port = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `PORT=${port} pnpm with-env next dev`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
