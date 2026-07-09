import { expect, test } from "@playwright/test";

test.describe("SEO landing", () => {
  test("renders marketing page with admin CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Super Template/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /open admin/i }).first(),
    ).toBeVisible();
  });

  test("does not expose web auth routes", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(404);
  });
});
