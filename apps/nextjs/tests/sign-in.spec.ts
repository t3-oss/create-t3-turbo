import { expect, test } from "@playwright/test";

// The test:e2e script loads .env through the app's with-env wrapper.
// eslint-disable-next-line no-restricted-properties
const email = process.env.MOCK_EMAIL;
// eslint-disable-next-line no-restricted-properties
const password = process.env.MOCK_PASSWORD;

test("starts Discord sign-in with Mockatoo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with Discord" }).click();
  await expect(page).toHaveURL(
    /^https:\/\/app\.mockatoo\.globalunderdog\.com\//,
  );
  await expect(page.locator("#email")).toBeVisible();
});

test("signs in with Discord through Mockatoo", async ({ page }) => {
  // Needs a Mockatoo test account. CI on pull requests from forks has no
  // secrets, so this skips there and the test above still runs.
  test.skip(
    !email || !password,
    "Set MOCK_EMAIL and MOCK_PASSWORD to run the full sign-in.",
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with Discord" }).click();
  await page.locator("#email").fill(email ?? "");
  await page.locator("#password").fill(password ?? "");
  await page.getByRole("button", { name: "Log in with password" }).click();
  await page.getByRole("button", { name: "Authorize" }).click();
  await expect(page.getByText("Logged in as")).toBeVisible();
});
