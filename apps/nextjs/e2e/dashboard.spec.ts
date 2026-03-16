import { expect, test } from "@playwright/test";

/**
 * Dashboard tests — these would use the authenticated state from auth.setup.ts.
 *
 * To enable authenticated tests:
 * 1. Run auth.setup.ts first (adds "setup" project to playwright.config.ts)
 * 2. Use storageState: ".auth/user.json" in the project config
 *
 * For now, these tests verify the public redirect behavior.
 * When auth is wired, uncomment the `use` config in playwright.config.ts
 * and these tests will run as an authenticated user.
 */

test.describe("Dashboard (unauthenticated)", () => {
  test("should redirect to home when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");

    // Dashboard requires auth, should redirect
    await expect(page).toHaveURL("/");
  });

  test("should redirect settings to home when not authenticated", async ({
    page,
  }) => {
    await page.goto("/settings");

    await expect(page).toHaveURL("/");
  });
});

test.describe("Auth Pages", () => {
  test("sign-in page should render", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("sign-up page should render", async ({ page }) => {
    await page.goto("/sign-up");

    await expect(
      page.getByRole("heading", { name: /create an account/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("forgot password page should render", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: /forgot password/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("sign-in should link to sign-up and forgot password", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await expect(page.getByRole("link", { name: /sign up/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /forgot password/i }),
    ).toBeVisible();
  });
});
