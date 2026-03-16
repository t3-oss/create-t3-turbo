import { expect, test } from "@playwright/test";

test.describe("Marketing Pages", () => {
  test("pricing page should display all plan tiers", async ({ page }) => {
    await page.goto("/pricing");

    // Should show pricing heading
    await expect(
      page.getByRole("heading", { name: /pricing/i }),
    ).toBeVisible();

    // Should show all three plan tiers
    await expect(page.getByText("Starter")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();
  });

  test("pricing page should have CTA buttons", async ({ page }) => {
    await page.goto("/pricing");

    // Each plan should have a CTA button
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start free trial/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /contact sales/i }),
    ).toBeVisible();
  });

  test("marketing layout should have navigation", async ({ page }) => {
    await page.goto("/pricing");

    // Should have nav links
    await expect(page.getByRole("link", { name: /pricing/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});
