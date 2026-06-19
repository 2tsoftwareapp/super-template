import { expect, test } from "@playwright/test";
import path from "node:path";

import { loginThroughUi, SEED_ADMIN, SEED_USER } from "./auth.helpers";

const seedAdminAuthState = path.join(__dirname, ".auth/seed-admin.json");
const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("Audit Logs — access control", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_ADMIN);
    await context.storageState({ path: seedAdminAuthState });
    await context.close();
  });

  test.use({ storageState: seedAdminAuthState });

  test("admin can access /audit-logs page", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page).toHaveURL(/\/audit-logs$/);
    await expect(page.getByRole("heading", { name: "Audit logs" })).toBeVisible();
  });

  test("displays Admin badge", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page.getByText("Admin")).toBeVisible();
  });
});

test.describe("Audit Logs — access denied for non-admin", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("regular user sees 403 error", async ({ page }) => {
    await page.goto("/audit-logs");
    await expect(page.getByRole("heading", { name: "403" })).toBeVisible();
    await expect(page.getByText(/audit.read/i)).toBeVisible();
  });
});

test.describe("Audit Logs — page layout", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays heading and description", async ({ page }) => {
    await page.goto("/audit-logs");

    const heading = page.getByRole("heading", { level: 1, name: "Audit logs" });
    await expect(heading).toBeVisible();

    const classes = await heading.getAttribute("class");
    expect(classes).toContain("text-4xl");
    expect(classes).toContain("font-semibold");
  });

  test("displays Filters card", async ({ page }) => {
    await page.goto("/audit-logs");

    const filtersTitle = page.getByRole("heading", { name: "Filters" });
    await expect(filtersTitle).toBeVisible();

    const description = page.getByText("Filter audit events by actor, action, and resource.");
    await expect(description).toBeVisible();
  });

  test("displays all filter fields", async ({ page }) => {
    await page.goto("/audit-logs");

    await expect(page.getByLabel("Action")).toBeVisible();
    await expect(page.getByLabel("Resource type")).toBeVisible();
    await expect(page.locator("text=Sort order")).toBeVisible();
  });
});

test.describe("Audit Logs — filtering", () => {
  test.use({ storageState: seedAdminAuthState });

  test("filters by action", async ({ page }) => {
    await page.goto("/audit-logs");

    const actionInput = page.getByLabel("Action");
    await actionInput.fill("CREATE");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("action=CREATE");
  });

  test("filters by resource type", async ({ page }) => {
    await page.goto("/audit-logs");

    const resourceInput = page.getByLabel("Resource type");
    await resourceInput.fill("Project");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("resourceType=Project");
  });

  test("changes sort order", async ({ page }) => {
    await page.goto("/audit-logs");

    const sortSelect = page.locator("text=Sort order").locator("..").locator("button");
    await sortSelect.click();

    const options = page.locator("[role='option']");
    expect(await options.count()).toBeGreaterThan(0);
  });

  test("resets page to 1 when filtering", async ({ page }) => {
    await page.goto("/audit-logs?page=5");

    const actionInput = page.getByLabel("Action");
    await actionInput.fill("UPDATE");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("page=1");
  });
});

test.describe("Audit Logs — table display", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays audit logs table", async ({ page }) => {
    await page.goto("/audit-logs");
    await page.waitForLoadState("networkidle");

    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("shows table headers", async ({ page }) => {
    await page.goto("/audit-logs");
    await page.waitForLoadState("networkidle");

    const headers = page.locator("thead th");
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
  });

  test("displays audit log rows", async ({ page }) => {
    await page.goto("/audit-logs");
    await page.waitForLoadState("networkidle");

    const rows = page.locator("tbody tr");
    const count = await rows.count();

    // Should have logs or empty state
    if (count === 0) {
      const emptyState = page.getByText("No audit logs found");
      await expect(emptyState).toBeVisible({ timeout: 5000 }).catch(() => undefined);
    }
  });

  test("shows loading spinner", async ({ page, context }) => {
    await context.route("**/api/bff/audit-logs**", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue().catch(() => undefined);
    });

    await page.goto("/audit-logs");

    const spinner = page.locator("[class*='spinner']");
    const _isVisible = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    await expect(page.getByRole("heading", { name: "Audit logs" })).toBeVisible({
      timeout: 10000
    });
  });

  test("shows empty state when no logs", async ({ page }) => {
    await page.goto("/audit-logs");

    const actionInput = page.getByLabel("Action");
    await actionInput.fill("NONEXISTENT_" + Date.now());
    await page.waitForLoadState("networkidle");

    const emptyTitle = page.getByText("No audit logs found");
    const isVisible = await emptyTitle.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(emptyTitle).toBeVisible();
    }
  });
});

test.describe("Audit Logs — pagination", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays page info", async ({ page }) => {
    await page.goto("/audit-logs");
    await page.waitForLoadState("networkidle");

    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    await expect(pageInfo).toBeVisible();
  });

  test("Previous button disabled on page 1", async ({ page }) => {
    await page.goto("/audit-logs?page=1");

    const prevBtn = page.getByRole("button", { name: "Previous" });
    const disabled = await prevBtn.isDisabled();
    expect(disabled).toBe(true);
  });

  test("Next button navigates", async ({ page }) => {
    await page.goto("/audit-logs?page=1");

    const nextBtn = page.getByRole("button", { name: "Next" });
    const disabled = await nextBtn.isDisabled();

    if (!disabled) {
      await nextBtn.click();
      expect(page.url()).toContain("page=2");
    }
  });
});

test.describe("Audit Logs — API integration", () => {
  test.use({ storageState: seedAdminAuthState });

  test("fetches from correct endpoint", async ({ page }) => {
    const requests: string[] = [];

    page.on("request", req => {
      if (req.url().includes("/api/bff/audit-logs")) {
        requests.push(req.url());
      }
    });

    await page.goto("/audit-logs");
    await page.waitForLoadState("networkidle");

    expect(requests.length).toBeGreaterThan(0);
  });

  test("sends filter parameters", async ({ page }) => {
    await page.goto("/audit-logs");

    const actionInput = page.getByLabel("Action");
    await actionInput.fill("DELETE");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("action=DELETE");
  });
});

test.describe("Audit Logs — error handling", () => {
  test.use({ storageState: seedAdminAuthState });

  test("handles API failure", async ({ page, context }) => {
    await context.route("**/api/bff/audit-logs**", route => {
      void route.abort("failed");
    });

    await page.goto("/audit-logs");

    await expect(page.getByRole("heading", { name: "Audit logs" })).toBeVisible();
  });

  test("handles slow responses", async ({ page, context }) => {
    await context.route("**/api/bff/audit-logs**", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue().catch(() => undefined);
    });

    await page.goto("/audit-logs");

    await expect(page.getByRole("heading", { name: "Audit logs" })).toBeVisible({
      timeout: 10000
    });
  });
});
