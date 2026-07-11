import { expect, test } from "@playwright/test";

const ADMIN_URL = process.env.PLAYWRIGHT_ADMIN_URL ?? "http://localhost:3002";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

// Golden-path smoke for the admin console (server started by playwright
// webServer config, seeded credentials from the dev seed).
test.describe.configure({ mode: "serial" });

test.describe("admin console smoke", () => {
  test("anonymous requests are redirected to the locale login", async ({
    page,
  }) => {
    await page.goto(`${ADMIN_URL}/users`);

    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(
      page.getByText(/admin login/i).first(),
    ).toBeVisible();
  });

  test("seeded admin can sign in and reach the dashboard", async ({ page }) => {
    await page.goto(`${ADMIN_URL}/en/login`);

    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).first().fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(new RegExp(`${ADMIN_URL}/en$`), {
      timeout: 15_000,
    });
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    // Users list loads (RBAC + BFF + API round trip)
    await page.goto(`${ADMIN_URL}/en/users`);
    await expect(page.getByRole("heading", { name: /users/i }).first()).toBeVisible();

    // Locale switch: same route under /vi renders the translated shell
    await page.goto(`${ADMIN_URL}/vi`);
    await expect(page.getByText("Bảng điều khiển").first()).toBeVisible();
  });
});
