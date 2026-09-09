import { type BrowserContext, expect, type Page, test } from "@playwright/test";

const ADMIN_URL = process.env.PLAYWRIGHT_ADMIN_URL ?? "http://localhost:3002";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

const resourceRoutes = [
  { path: "/", heading: "Dashboard" },
  { path: "/organizations", heading: "Organizations" },
  { path: "/users", heading: "Users" },
  { path: "/roles", heading: "Roles" },
  { path: "/audit-logs", heading: "Audit logs" },
  { path: "/notifications", heading: "Notifications" },
  { path: "/jobs", heading: "Jobs" },
  { path: "/mail", heading: "Mail" },
  { path: "/files", heading: "Files" },
  { path: "/imports", heading: "Imports" },
  { path: "/settings", heading: "Settings" },
  { path: "/settings/security", heading: "Settings" },
  { path: "/settings/organization", heading: "Settings" },
] as const;

let adminContext: BrowserContext;
let adminPage: Page;

async function signIn(page: Page) {
  await page.goto(`${ADMIN_URL}/en/login`);
  await expect(page.getByRole("heading", { name: /sign in to the admin app/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page
    .getByLabel(/password/i)
    .first()
    .fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(new RegExp(`${ADMIN_URL}/en$`), { timeout: 15_000 });
}

test.describe("admin resource navigation", () => {
  // The seeded account has a shared session lifecycle; keep one authenticated
  // context and serialize these read-only journeys to avoid login races.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    adminContext = await browser.newContext();
    adminPage = await adminContext.newPage();
    await signIn(adminPage);
  });

  test.afterAll(async () => {
    await adminContext.close();
  });

  for (const route of resourceRoutes) {
    test(`${route.path} renders the ${route.heading} resource`, async () => {
      await adminPage.goto(`${ADMIN_URL}/en${route.path}`);

      const expectedUrl = route.path === "/" ? /\/en$/ : new RegExp(`/en${route.path}$`);
      await expect(adminPage).toHaveURL(expectedUrl);
      await expect(
        adminPage.getByRole("heading", { name: route.heading, exact: true }).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  }
});
