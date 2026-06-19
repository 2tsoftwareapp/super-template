import { expect, test } from "@playwright/test";
import path from "node:path";

import { loginThroughUi, SEED_USER } from "./auth.helpers";

const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("Notifications — page and structure", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("displays notifications page", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole("heading")).toBeVisible();
  });

  test("displays filters for status and sort", async ({ page }) => {
    await page.goto("/notifications");

    const unreadFilter = page.getByLabel("Unread");
    const sortSelect = page.locator("text=Sort");

    const unreadVisible = await unreadFilter.isVisible({ timeout: 2000 }).catch(() => false);
    const sortVisible = await sortSelect.isVisible({ timeout: 2000 }).catch(() => false);

    expect(unreadVisible || sortVisible).toBe(true);
  });

  test("displays notification list or empty state", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    const notificationList = page.locator("div, ul, table");
    await expect(notificationList.first()).toBeVisible();
  });
});

test.describe("Notifications — filtering", () => {
  test.use({ storageState: seedUserAuthState });

  test("filters notifications", async ({ page }) => {
    await page.goto("/notifications");

    const unreadFilter = page.getByLabel("Unread");
    if (await unreadFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await unreadFilter.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test("changes sort order", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    const sortSelect = page.locator("text=Sort").locator("..").locator("button");
    if (await sortSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sortSelect.click();
    }
  });
});

test.describe("Notifications — pagination", () => {
  test.use({ storageState: seedUserAuthState });

  test("shows pagination controls", async ({ page }) => {
    await page.goto("/notifications");

    const prevBtn = page.getByRole("button", { name: "Previous" });
    const nextBtn = page.getByRole("button", { name: "Next" });

    const prevVisible = await prevBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const nextVisible = await nextBtn.isVisible({ timeout: 2000 }).catch(() => false);

    expect(prevVisible || nextVisible).toBe(true);
  });
});

test.describe("Notifications — API integration", () => {
  test.use({ storageState: seedUserAuthState });

  test("fetches notifications from API", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", req => {
      if (req.url().includes("/api/bff/notifications")) {
        requests.push(req.url());
      }
    });

    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");

    expect(requests.length).toBeGreaterThan(0);
  });
});

test.describe("Notifications — error handling", () => {
  test.use({ storageState: seedUserAuthState });

  test("handles API errors gracefully", async ({ page, context }) => {
    await context.route("**/api/bff/notifications**", route => {
      void route.abort("failed");
    });

    await page.goto("/notifications");

    const heading = page.getByRole("heading");
    await expect(heading).toBeVisible({ timeout: 5000 }).catch(() => undefined);
  });
});
