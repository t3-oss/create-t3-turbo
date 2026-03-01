import { expect, test } from "@playwright/test";

test.describe("404 Not Found", () => {
  test("should show custom 404 page for unknown routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");

    // Should show 404 heading
    await expect(page.getByText("Page not found")).toBeVisible();

    // Should show "Go home" link
    const homeLink = page.getByRole("link", { name: /go home/i });
    await expect(homeLink).toBeVisible();
  });

  test("should navigate home from 404 page", async ({ page }) => {
    await page.goto("/some/random/path");

    await page.getByRole("link", { name: /go home/i }).click();

    await expect(page).toHaveURL("/");
  });
});
