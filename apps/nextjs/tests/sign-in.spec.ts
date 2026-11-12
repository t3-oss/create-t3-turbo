import { expect, test } from "@playwright/test";

import { env } from "~/env";

const email = env.MOCK_EMAIL;
const password = env.MOCK_PASSWORD;

test("signs in with Discord through Mockatoo", async ({ page }) => {
  if (!email || !password) {
    throw new Error(
      "Set MOCK_EMAIL and MOCK_PASSWORD before running e2e tests.",
    );
  }

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in with Discord" }).click();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Log in with password" }).click();
  await page.getByRole("button", { name: "Authorize" }).click();
  await expect(page.getByText("Logged in as")).toBeVisible();
});
