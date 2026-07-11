import { expect, test } from "@playwright/test";

test.describe("SEO landing", () => {
  test("redirects / to the default locale and renders the marketing page", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/en$/);
    await expect(page).toHaveTitle(/Super Template/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText(/open admin/i).first(),
    ).toBeVisible();
  });

  test("serves the Vietnamese locale at /vi", async ({ page }) => {
    await page.goto("/vi");

    await expect(page).toHaveURL(/\/vi$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("does not expose web auth routes", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(404);
  });
});

test.describe("verify email", () => {
  test("shows the error state when the token is missing", async ({ page }) => {
    await page.goto("/en/verify-email");

    await expect(
      page.getByRole("heading", { name: /verification failed/i }),
    ).toBeVisible();
    await expect(page.getByText(/missing verification token/i)).toBeVisible();
  });
});
