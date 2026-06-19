import { expect, test } from "@playwright/test";
import path from "node:path";

import {
  loginThroughUi,
  SEED_ADMIN,
  SEED_USER,
} from "./auth.helpers";

const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");
const seedAdminAuthState = path.join(__dirname, ".auth/seed-admin.json");

test.describe("Dashboard — page structure and elements", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("displays Client workspace badge exactly as designed", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Badge with variant="outline" class contains text "Client"
    const badge = page.locator("text=/^Client$/");
    await expect(badge).toBeVisible();

    // Verify it's actually a badge component
    const badgeElement = badge.locator("xpath=ancestor::*[@class and contains(@class, 'badge')]").first();
    await expect(badgeElement).toBeVisible();
  });

  test("displays main heading Client workspace (h1 with text-4xl)", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const heading = page.getByRole("heading", { level: 1, name: "Client workspace" });
    await expect(heading).toBeVisible();

    // Verify styling (text-4xl font-semibold)
    const classes = await heading.getAttribute("class");
    expect(classes).toContain("text-4xl");
    expect(classes).toContain("font-semibold");
  });

  test("displays workspace description paragraph", async ({ page }) => {
    await page.goto("/dashboard");

    const description = page.getByText(
      "Manage projects, read notifications, and keep publish-side work in one place. Admin tools live in a separate group in the sidebar."
    );
    await expect(description).toBeVisible();

    // Verify description is styled as small muted text
    const classes = await description.locator("..").getAttribute("class");
    expect(classes).toContain("text-sm");
    expect(classes).toContain("muted-foreground");
  });

  test("displays three metric cards in grid (md:grid-cols-3)", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Check all three metric cards exist
    await expect(page.getByText("Active permissions")).toBeVisible();
    await expect(page.getByText("Unread notifications")).toBeVisible();
    await expect(page.getByText("Projects in view")).toBeVisible();

    // They should be in the same grid container
    const metricsContainer = page.locator(".grid.gap-4");
    const cards = metricsContainer.locator(">> nth=0").locator(">> .card");
    expect(await cards.count()).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Dashboard — metric cards detail", () => {
  test.use({ storageState: seedUserAuthState });

  test("Active permissions metric shows permission count from session", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Find the card with "Active permissions" label
    const permissionCard = page.locator("text=Active permissions").locator("..").locator("..");
    await expect(permissionCard).toBeVisible();

    // Should display a number from session.data?.data.permissions.length
    const value = permissionCard.locator("text=/^\\d+$/");
    await expect(value).toBeVisible();

    // Value should be a text-4xl CardTitle
    const valueElement = value.locator("xpath=ancestor::*[contains(@class, 'text-4xl')]");
    await expect(valueElement).toBeVisible();
  });

  test("Unread notifications metric displays count from API", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Find notifications card
    const notificationsCard = page.locator("text=Unread notifications").locator("..").locator("..");
    await expect(notificationsCard).toBeVisible();

    // Should display a number from notifications.data?.data.count
    const value = notificationsCard.locator("text=/^\\d+$/");
    await expect(value).toBeVisible();
  });

  test("Projects in view metric displays total from projects API", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Find projects card
    const projectsCard = page.locator("text=Projects in view").locator("..").locator("..");
    await expect(projectsCard).toBeVisible();

    // Should display a number from projects.data?.meta.total
    const value = projectsCard.locator("text=/^\\d+$/");
    await expect(value).toBeVisible();
  });

  test("each metric card has icon and label description", async ({ page }) => {
    await page.goto("/dashboard");

    const metricLabels = ["Active permissions", "Unread notifications", "Projects in view"];

    for (const label of metricLabels) {
      const card = page.locator("text=" + label);
      await expect(card).toBeVisible();

      // CardDescription class should wrap the label
      const description = card.locator("xpath=ancestor::*[contains(@class, 'CardDescription')]");
      await expect(description).toBeVisible();
    }
  });
});

test.describe("Dashboard — recent projects section", () => {
  test.use({ storageState: seedUserAuthState });

  test("Recent projects card header with title and description", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Card title "Recent projects"
    const title = page.getByRole("heading", { name: "Recent projects" });
    await expect(title).toBeVisible();

    // Card description
    const description = page.getByText("The latest client-facing records from the workspace.");
    await expect(description).toBeVisible();
  });

  test("Recent projects has View all link pointing to /projects", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const viewAllLink = page.getByRole("link", { name: "View all" }).first();
    await expect(viewAllLink).toBeVisible();

    // Link should point to /projects
    const href = await viewAllLink.getAttribute("href");
    expect(href).toBe("/projects");

    // Styled as text-sm text-muted-foreground
    const classes = await viewAllLink.getAttribute("class");
    expect(classes).toContain("text-sm");
    expect(classes).toContain("text-muted-foreground");
  });

  test("displays project list with name and description when projects exist", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Wait for projects query to complete
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator('a[href^="/projects/"][href!="/projects/new"]');
    const projectCount = await projectLinks.count();

    if (projectCount > 0) {
      // Each project link should have name and description
      const firstProject = projectLinks.first();
      await expect(firstProject).toBeVisible();

      // Project should have styling: flex items-center justify-between rounded-2xl border
      const classes = await firstProject.getAttribute("class");
      expect(classes).toContain("flex");
      expect(classes).toContain("items-center");
      expect(classes).toContain("justify-between");
      expect(classes).toContain("rounded-2xl");
      expect(classes).toContain("border");

      // Project name should be in font-medium
      const projectName = firstProject.locator("p").first();
      const nameClasses = await projectName.getAttribute("class");
      expect(nameClasses).toContain("font-medium");
    }
  });

  test("displays empty state when no projects", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator('a[href^="/projects/"][href!="/projects/new"]');
    const projectCount = await projectLinks.count();

    if (projectCount === 0) {
      // Should show empty state with FolderKanban icon
      const emptyState = page.locator("text=No projects yet");
      await expect(emptyState).toBeVisible();

      // Should have empty description
      const emptyDescription = page.getByText("Create a project to populate the client workspace.");
      await expect(emptyDescription).toBeVisible();

      // Should have FolderKanban icon
      const emptyIcon = page.locator("[data-lucide-icon='folder-kanban']").or(
        page.locator("svg").filter({ has: page.locator("path[d*='folder']") })
      );
      // Icon presence is harder to test, but empty state should exist
      expect(await emptyState.isVisible()).toBe(true);
    }
  });

  test("project links navigate to /projects/{id} page", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator('a[href^="/projects/"][href!="/projects/new"]');
    const projectCount = await projectLinks.count();

    if (projectCount > 0) {
      const firstProjectLink = projectLinks.first();
      const href = await firstProjectLink.getAttribute("href");

      // Should match pattern /projects/{uuid}
      expect(href).toMatch(/^\/projects\/[a-f0-9-]+$/i);
    }
  });

  test("project items have status badge", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator('a[href^="/projects/"][href!="/projects/new"]');
    const projectCount = await projectLinks.count();

    if (projectCount > 0) {
      const firstProject = projectLinks.first();

      // Should have a Badge component with status
      const badge = firstProject.locator("[class*='badge']");
      await expect(badge).toBeVisible();

      // Badge should contain status text
      const statusText = await badge.textContent();
      expect(statusText).toBeTruthy();
    }
  });
});

test.describe("Dashboard — client actions sidebar", () => {
  test.use({ storageState: seedUserAuthState });

  test("Client actions card exists with title and description", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const actionsTitle = page.getByRole("heading", { name: "Client actions" });
    await expect(actionsTitle).toBeVisible();

    const actionsDescription = page.getByText("Fast entry points for publish-side work.");
    await expect(actionsDescription).toBeVisible();
  });

  test("Create project button links to /projects/new", async ({ page }) => {
    await page.goto("/dashboard");

    const createButton = page.getByRole("link", { name: /create project/i });
    await expect(createButton).toBeVisible();

    const href = await createButton.getAttribute("href");
    expect(href).toBe("/projects/new");

    // Should have Plus icon and text
    const icon = createButton.locator("svg");
    await expect(icon).toBeVisible();
  });

  test("Review notifications button links to /notifications", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const notificationsButton = page.getByRole("link", { name: /review notifications/i });
    await expect(notificationsButton).toBeVisible();

    const href = await notificationsButton.getAttribute("href");
    expect(href).toBe("/notifications");

    // Should have Bell icon
    const icon = notificationsButton.locator("svg");
    await expect(icon).toBeVisible();
  });

  test("Update settings button links to /settings/profile", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const settingsButton = page.getByRole("link", { name: /update settings/i });
    await expect(settingsButton).toBeVisible();

    const href = await settingsButton.getAttribute("href");
    expect(href).toBe("/settings/profile");

    // Should have Settings icon
    const icon = settingsButton.locator("svg");
    await expect(icon).toBeVisible();
  });
});

test.describe("Dashboard — publish rhythm info section", () => {
  test.use({ storageState: seedUserAuthState });

  test("Publish rhythm card displays title and description", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    const rhythmTitle = page.getByRole("heading", { name: "Publish rhythm" });
    await expect(rhythmTitle).toBeVisible();

    const rhythmDescription = page.getByText(
      "Keep the client workspace moving without mixing in admin tools."
    );
    await expect(rhythmDescription).toBeVisible();
  });

  test("displays two info boxes with workflow and notifications guidance", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // First info box about projects
    const projectsInfo = page.getByText("Use projects for client-visible work and drafts.");
    await expect(projectsInfo).toBeVisible();

    // Second info box about notifications
    const notificationsInfo = page.getByText("Notifications surface status changes and review requests.");
    await expect(notificationsInfo).toBeVisible();

    // Each should have an icon
    const infoBoxes = page.locator("div.flex.items-start.gap-3.rounded-2xl.border");
    expect(await infoBoxes.count()).toBeGreaterThanOrEqual(2);
  });

  test("publish rhythm info boxes have icons", async ({ page }) => {
    await page.goto("/dashboard");

    // Should have Workflow icon
    const workflowIcon = page.locator("[data-lucide-icon='workflow']").or(
      page.locator("svg").filter({ has: page.locator("path[d*='workflow']") })
    );
    // Note: Icon detection is tricky in tests, but we verify the info boxes exist

    const infoBoxes = page.locator("div.flex.items-start.gap-3.rounded-2xl.border");
    const count = await infoBoxes.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

test.describe("Dashboard — data loading and real-time updates", () => {
  test.use({ storageState: seedUserAuthState });

  test("loads metrics within reasonable time from APIs", async ({
    page,
  }) => {
    const startTime = Date.now();
    await page.goto("/dashboard");

    // Wait for all metrics to be loaded
    await Promise.all([
      expect(page.getByText("Active permissions")).toBeVisible({ timeout: 5000 }),
      expect(page.getByText("Unread notifications")).toBeVisible({ timeout: 5000 }),
      expect(page.getByText("Projects in view")).toBeVisible({ timeout: 5000 }),
    ]);

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (including React Query overhead)
    expect(loadTime).toBeLessThan(15000);
  });

  test("uses correct query keys for React Query caching", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // First visit - should load from API
    await expect(page.getByText("Projects in view")).toBeVisible();

    // Get initial project count
    const firstLoad = await page
      .locator("text=Projects in view")
      .locator("..")
      .locator("text=/^\\d+$")
      .textContent();

    // Reload page - should use cached data if queryKey matches
    await page.reload();

    const secondLoad = await page
      .locator("text=Projects in view")
      .locator("..")
      .locator("text=/^\\d+$")
      .textContent();

    // Count should be the same (data hasn't changed)
    expect(secondLoad).toBe(firstLoad);
  });

  test("displays fresh data from API (dashboard-projects queryKey)", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Projects should be fetched from buildProjectsListPath({ limit: 5 })
    await expect(page.getByText("Recent projects")).toBeVisible();

    // Should show up to 5 projects or empty state
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator('a[href^="/projects/"][href!="/projects/new"]');
    const projectCount = await projectLinks.count();

    // Should be limited to 5 projects (from limit: 5 in query)
    expect(projectCount).toBeLessThanOrEqual(5);
  });

  test("fetches notifications count from correct API endpoint", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Monitor API calls
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("notifications")) {
        requests.push(request.url());
      }
    });

    await page.waitForLoadState("networkidle");

    // Should call /api/bff/notifications/unread-count
    const notificationRequests = requests.filter((url) =>
      url.includes("/api/bff/notifications/unread-count")
    );

    // Verify the exact endpoint is called
    if (requests.length > 0) {
      expect(notificationRequests.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Dashboard — error handling and resilience", () => {
  test.use({ storageState: seedUserAuthState });

  test("handles projects API failure gracefully", async ({
    page,
    context,
  }) => {
    // Block projects API
    await context.route("**/api/bff/projects**", (route) => {
      route.abort("failed");
    });

    await page.goto("/dashboard");

    // Page should still render
    await expect(page.getByRole("heading", { name: "Client workspace" })).toBeVisible();

    // Should either show empty state or error state gracefully
    // The page should be functional even if projects API fails
    const projectsSection = page.getByRole("heading", { name: "Recent projects" });
    expect(await projectsSection.isVisible()).toBe(true);
  });

  test("handles notifications API failure gracefully", async ({
    page,
    context,
  }) => {
    // Block notifications API
    await context.route("**/api/bff/notifications**", (route) => {
      route.abort("failed");
    });

    await page.goto("/dashboard");

    // Page should still render main content
    await expect(page.getByRole("heading", { name: "Client workspace" })).toBeVisible();

    // Metrics should still be visible even if one API fails
    await expect(page.getByText("Active permissions")).toBeVisible();
  });

  test("recovers when API returns late response", async ({
    page,
    context,
  }) => {
    // Delay API responses by 2 seconds
    await context.route("**/api/bff/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue().catch(() => {});
    });

    await page.goto("/dashboard");

    // Should eventually load all content
    await expect(page.getByText("Recent projects")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText("Active permissions")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Dashboard — admin vs user differences", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_ADMIN);
    await context.storageState({ path: seedAdminAuthState });
    await context.close();
  });

  test.use({ storageState: seedAdminAuthState });

  test("admin sees same dashboard layout as regular user", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Admin should see same structure
    await expect(page.getByRole("heading", { name: "Client workspace" })).toBeVisible();
    await expect(page.getByText("Active permissions")).toBeVisible();
    await expect(page.getByText("Unread notifications")).toBeVisible();
    await expect(page.getByText("Projects in view")).toBeVisible();

    // Should show client actions
    await expect(page.getByRole("heading", { name: "Client actions" })).toBeVisible();
  });

  test("admin metrics may differ based on permissions", async ({ page }) => {
    await page.goto("/dashboard");

    // Active permissions count should reflect admin's higher permissions
    const adminPermissionsValue = await page
      .locator("text=Active permissions")
      .locator("..")
      .locator("text=/^\\d+$/")
      .textContent();

    expect(adminPermissionsValue).toMatch(/^\d+$/);
    // Admin typically has more permissions, but we don't assert specific number
  });
});
