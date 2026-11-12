import { expect, test } from "@playwright/test";

// The test:e2e script loads .env through the app's with-env wrapper.
// eslint-disable-next-line no-restricted-properties
const email = process.env.MOCK_EMAIL;
// eslint-disable-next-line no-restricted-properties
const password = process.env.MOCK_PASSWORD;
// eslint-disable-next-line no-restricted-properties
const isCI = Boolean(process.env.CI);

test("starts Discord sign-in with Mockatoo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with Discord" }).click();
  await expect(page).toHaveURL(
    /^https:\/\/app\.mockatoo\.globalunderdog\.com\//,
  );
  await expect(page.locator("#email")).toBeVisible();
});

test("signs in with Discord through Mockatoo", async ({ page }) => {
  if (!email || !password) {
    if (isCI) {
      throw new Error("CI requires MOCK_EMAIL and MOCK_PASSWORD.");
    }
    test.skip(true, "MOCK_EMAIL and MOCK_PASSWORD are not available.");
  }

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with Discord" }).click();
  await page.locator("#email").fill(email ?? "");
  await page.locator("#password").fill(password ?? "");
  await page.getByRole("button", { name: "Log in with password" }).click();
  await page.getByRole("button", { name: "Authorize" }).click();
  await expect(page.getByText("Logged in as")).toBeVisible();
});
