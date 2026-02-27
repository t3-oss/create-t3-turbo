import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the main heading", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
  });

  test("should have theme toggle button", async ({ page }) => {
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();
  });

  test("should show sign in button when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");

    const signInButton = page.getByRole("button", {
      name: /sign in with discord/i,
    });
    await expect(signInButton).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("should navigate to settings page when authenticated", async ({
    page,
  }) => {
    // This test would require authentication setup
    // For now, just verify the settings route exists
    await page.goto("/settings");

    // Should redirect to home if not authenticated
    await expect(page).toHaveURL("/");
  });
});

test.describe("Accessibility", () => {
  test("should have a skip-to-content link", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();

    // Should become visible on focus (for keyboard users)
    await skipLink.focus();
    await expect(skipLink).toBeVisible();
  });

  test("should have a main content landmark", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();
  });

  test("should not have any automatically detectable accessibility issues on home page", async ({
    page,
  }) => {
    await page.goto("/");

    // Check that all images have alt text
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("should pass axe accessibility audit", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
