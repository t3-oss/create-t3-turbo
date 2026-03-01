import { test as setup, expect } from "@playwright/test";

/**
 * Auth setup — logs in as the seeded test user and saves browser state.
 *
 * This runs ONCE before authenticated test suites. The storage state
 * (cookies, localStorage) is saved and reused across tests.
 *
 * Seeded credentials (from packages/db/src/seed.ts):
 *   Email:    test@example.com
 *   Password: test123
 *
 * Usage in playwright.config.ts:
 *   projects: [
 *     { name: "setup", testMatch: /auth\.setup\.ts/ },
 *     { name: "authenticated", dependencies: ["setup"], use: { storageState: ".auth/user.json" } },
 *   ]
 */
const AUTH_FILE = ".auth/user.json";

setup("authenticate as test user", async ({ page }) => {
  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Fill in credentials
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("test123");

  // Submit
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to dashboard (or home)
  await expect(page).toHaveURL(/\/(dashboard)?$/);

  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
