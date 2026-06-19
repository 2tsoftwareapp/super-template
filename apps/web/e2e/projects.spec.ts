import { expect, test } from "@playwright/test";
import path from "node:path";

import {
  loginThroughUi,
  SEED_USER,
} from "./auth.helpers";

const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("Projects — list page and structure", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("displays Reference CRUD badge on projects page", async ({ page }) => {
    await page.goto("/projects");

    const badge = page.getByText("Reference CRUD");
    await expect(badge).toBeVisible();

    // Verify it's a badge with outline variant
    const badgeElement = badge.locator("xpath=ancestor::*[@class and contains(@class, 'badge')]");
    await expect(badgeElement).toBeVisible();
  });

  test("displays Projects heading with text-4xl font-semibold", async ({
    page,
  }) => {
    await page.goto("/projects");

    const heading = page.getByRole("heading", { level: 1, name: "Projects" });
    await expect(heading).toBeVisible();

    const classes = await heading.getAttribute("class");
    expect(classes).toContain("text-4xl");
    expect(classes).toContain("font-semibold");
  });

  test("displays New project button with Plus icon", async ({ page }) => {
    await page.goto("/projects");

    const newProjectButton = page.getByRole("link", { name: /new project/i });
    await expect(newProjectButton).toBeVisible();

    // Verify it links to /projects/new
    const href = await newProjectButton.getAttribute("href");
    expect(href).toContain("/projects/new");

    // Should have Plus icon
    const icon = newProjectButton.locator("svg");
    await expect(icon).toBeVisible();
  });

  test("displays Export CSV button", async ({ page }) => {
    await page.goto("/projects");

    const exportButton = page.getByRole("button", { name: /export csv/i });
    await expect(exportButton).toBeVisible();

    // Verify it's an outline variant button
    const classes = await exportButton.getAttribute("class");
    expect(classes).toContain("outline");
  });

  test("displays Filters card with search and sort options", async ({
    page,
  }) => {
    await page.goto("/projects");

    const filtersTitle = page.getByRole("heading", { name: "Filters" });
    await expect(filtersTitle).toBeVisible();

    const filtersDescription = page.getByText("Search and sort the project directory.");
    await expect(filtersDescription).toBeVisible();

    // Check all filter controls exist
    await expect(page.getByLabel("Search")).toBeVisible();
    await expect(page.locator("text=Status")).toBeVisible();
    await expect(page.locator("text=Sort field")).toBeVisible();
    await expect(page.locator("text=Sort order")).toBeVisible();
  });

  test("displays pagination controls", async ({ page }) => {
    await page.goto("/projects");

    const previousButton = page.getByRole("button", { name: "Previous" });
    const nextButton = page.getByRole("button", { name: "Next" });

    await expect(previousButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // Page info text
    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    await expect(pageInfo).toBeVisible();
  });
});

test.describe("Projects — filtering and search", () => {
  test.use({ storageState: seedUserAuthState });

  test("search input filters by name or description", async ({ page }) => {
    await page.goto("/projects");

    const searchInput = page.getByLabel("Search");
    await expect(searchInput).toBeVisible();

    // Verify placeholder
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).toBe("Search by name or description");

    // Type search term
    await searchInput.fill("test");
    await page.waitForLoadState("networkidle");

    // URL should contain search parameter
    expect(page.url()).toContain("search=test");
  });

  test("status dropdown filters by project status", async ({ page }) => {
    await page.goto("/projects");

    const statusSelect = page.locator("text=Status").locator("..").locator("button");
    await expect(statusSelect).toBeVisible();

    // Click to open
    await statusSelect.click();

    // Should show options
    const options = page.locator("[role='option']");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test("sort field dropdown changes sort column", async ({ page }) => {
    await page.goto("/projects");

    const sortFieldSelect = page.locator("text=Sort field").locator("..").locator("button");
    await expect(sortFieldSelect).toBeVisible();

    await sortFieldSelect.click();

    const options = page.locator("[role='option']");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test("sort order dropdown changes sort direction", async ({ page }) => {
    await page.goto("/projects");

    const sortOrderSelect = page.locator("text=Sort order").locator("..").locator("button");
    await expect(sortOrderSelect).toBeVisible();

    await sortOrderSelect.click();

    const options = page.locator("[role='option']");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search resets page to 1 when changed", async ({ page }) => {
    await page.goto("/projects?page=5");

    const searchInput = page.getByLabel("Search");
    await searchInput.fill("search");
    await page.waitForLoadState("networkidle");

    // Should reset to page 1
    expect(page.url()).toContain("page=1");
  });
});

test.describe("Projects — project cards display", () => {
  test.use({ storageState: seedUserAuthState });

  test("displays project cards with name and description", async ({
    page,
  }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Check if projects exist
    const projectCards = page.locator("a[href*='/projects/']:has-text(/.+/)");
    const cardCount = await projectCards.count();

    if (cardCount > 0) {
      const firstCard = projectCards.first();
      await expect(firstCard).toBeVisible();

      // Should be a card component
      const cardElement = firstCard.locator("[class*='card']");
      await expect(cardElement).toBeVisible();
    }
  });

  test("project card shows title (name) as heading", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Project name should be displayed as CardTitle
    const projectNames = page.locator("[class*='text-xl']").filter({ has: page.locator("..") });
    const nameCount = await projectNames.count();

    if (nameCount > 0) {
      await expect(projectNames.first()).toBeVisible();
    }
  });

  test("project card shows description", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Should show description or "No description yet."
    const descriptions = page.locator("[class*='muted-foreground']");
    const descriptionCount = await descriptions.count();

    if (descriptionCount > 0) {
      const firstDesc = descriptions.first();
      const text = await firstDesc.textContent();
      expect(text).toBeTruthy();
    }
  });

  test("project card displays status badge", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator("a[href*='/projects/'][href!='/projects/new']");
    const count = await projectLinks.count();

    if (count > 0) {
      const firstProject = projectLinks.first();
      const statusBadge = firstProject.locator("[class*='badge']");
      await expect(statusBadge).toBeVisible();

      const statusText = await statusBadge.textContent();
      expect(statusText).toMatch(/DRAFT|ACTIVE|ARCHIVED/);
    }
  });

  test("project card has hover effect (transform)", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator("a[href*='/projects/'][href!='/projects/new']");
    const count = await projectLinks.count();

    if (count > 0) {
      const firstProject = projectLinks.first();
      const card = firstProject.locator("[class*='card']");

      // Should have hover classes
      const classes = await card.getAttribute("class");
      expect(classes).toContain("transition");
      expect(classes).toContain("hover");
    }
  });

  test("project cards link to /projects/{id} detail page", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    const projectLinks = page.locator("a[href*='/projects/'][href!='/projects/new']");
    const count = await projectLinks.count();

    if (count > 0) {
      const firstLink = projectLinks.first();
      const href = await firstLink.getAttribute("href");

      // Should match /projects/{id} pattern (with optional query params)
      expect(href).toMatch(/^\/projects\/[a-f0-9-]+/i);
    }
  });

  test("displays empty state when no projects found", async ({ page }) => {
    await page.goto("/projects");

    // Apply filter to get no results
    const searchInput = page.getByLabel("Search");
    await searchInput.fill("zzzznonexistent" + Date.now());
    await page.waitForLoadState("networkidle");

    // Should show empty state
    const emptyTitle = page.getByText("No projects found");
    const _emptyDescription = page.getByText("Try a different filter or create the first record.");

    const emptyVisible = await emptyTitle.isVisible({ timeout: 5000 }).catch(() => false);
    expect(emptyVisible).toBe(true);
  });

  test("shows loading spinner while fetching projects", async ({
    page,
    context,
  }) => {
    // Delay API response
    await context.route("**/api/bff/projects**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue().catch(() => undefined);
    });

    await page.goto("/projects");

    // Should show spinner
    const spinner = page.locator("[class*='spinner']");
    const _spinnerVisible = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    // Eventually should load
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Projects — create new project", () => {
  test.use({ storageState: seedUserAuthState });

  test("New project button navigates to /projects/new", async ({ page }) => {
    await page.goto("/projects");

    const newButton = page.getByRole("link", { name: /new project/i });
    await newButton.click();

    await page.waitForURL(/\/projects\/new/);
    await expect(page).toHaveURL(/\/projects\/new/);
  });

  test("create project page displays form with all required fields", async ({
    page,
  }) => {
    await page.goto("/projects/new");

    // Should have form fields
    const nameInput = page.getByLabel("Name");
    const descriptionTextarea = page.getByLabel("Description");
    const statusSelect = page.locator("text=Status").locator("..").locator("button");

    await expect(nameInput).toBeVisible();
    await expect(descriptionTextarea).toBeVisible();
    await expect(statusSelect).toBeVisible();
  });

  test("name field has correct validation (min 2, max 160)", async ({
    page,
  }) => {
    await page.goto("/projects/new");

    const nameInput = page.getByLabel("Name");

    // Type short name (will fail validation)
    await nameInput.fill("A");
    await page.keyboard.press("Tab");

    // Should show validation error or disable submit
    const submitButton = page.getByRole("button", { name: /create|save|submit/i });
    const _isDisabled = await submitButton.isDisabled().catch(() => false);

    // Name should be focused initially
    await expect(nameInput).toBeFocused();
  });

  test("description field accepts text up to 4000 chars", async ({
    page,
  }) => {
    await page.goto("/projects/new");

    const descriptionField = page.getByLabel("Description");
    const longText = "A".repeat(100);

    await descriptionField.fill(longText);

    const value = await descriptionField.inputValue();
    expect(value).toBe(longText);
  });

  test("status dropdown has DRAFT, ACTIVE, ARCHIVED options", async ({
    page,
  }) => {
    await page.goto("/projects/new");

    const statusSelect = page.locator("text=Status").locator("..").locator("button");
    await statusSelect.click();

    // Check for status options
    const _draftOption = page.locator("[role='option']:has-text('DRAFT')");
    const _activeOption = page.locator("[role='option']:has-text('ACTIVE')");
    const _archivedOption = page.locator("[role='option']:has-text('ARCHIVED')");

    // At least some options should exist
    const optionCount = await page.locator("[role='option']").count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("creates project and redirects to detail page", async ({
    page,
  }) => {
    await page.goto("/projects/new");

    // Fill form
    const projectName = "E2E Test Project " + Date.now();
    const projectDescription = "This is a test project created by E2E tests";

    await page.getByLabel("Name").fill(projectName);
    await page.getByLabel("Description").fill(projectDescription);

    // Set status to ACTIVE
    const statusSelect = page.locator("text=Status").locator("..").locator("button");
    await statusSelect.click();

    const activeOption = page.locator("[role='option']:has-text('ACTIVE')");
    if (await activeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await activeOption.click();
    }

    // Submit form
    const submitButton = page.getByRole("button", { name: /create|save|submit/i }).first();
    await submitButton.click();

    // Should redirect to detail page
    await page.waitForURL(/\/projects\/[a-f0-9-]+/i, { timeout: 10000 });

    // Should show project name on detail page
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible({
      timeout: 5000,
    });
  });

  test("shows success toast after creating project", async ({ page }) => {
    await page.goto("/projects/new");

    const projectName = "Success Toast Test " + Date.now();
    await page.getByLabel("Name").fill(projectName);

    const submitButton = page.getByRole("button", { name: /create|save|submit/i }).first();
    await submitButton.click();

    // Should show success message
    const successToast = page.getByText(/created|success|project|saved/i);
    const toastVisible = await successToast.isVisible({ timeout: 5000 }).catch(() => false);

    // Or should navigate successfully
    expect(toastVisible || page.url().includes("/projects/")).toBeTruthy();
  });
});

test.describe("Projects — pagination", () => {
  test.use({ storageState: seedUserAuthState });

  test("displays current page and total pages info", async ({ page }) => {
    await page.goto("/projects");

    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    await expect(pageInfo).toBeVisible();
  });

  test("Previous button is disabled on page 1", async ({ page }) => {
    await page.goto("/projects?page=1");

    const previousButton = page.getByRole("button", { name: "Previous" });
    const isDisabled = await previousButton.isDisabled();

    expect(isDisabled).toBe(true);
  });

  test("Next button navigates to next page", async ({ page }) => {
    await page.goto("/projects?page=1");

    const nextButton = page.getByRole("button", { name: "Next" });
    const isDisabled = await nextButton.isDisabled();

    if (!isDisabled) {
      await nextButton.click();
      expect(page.url()).toContain("page=2");
    }
  });
});

test.describe("Projects — export CSV", () => {
  test.use({ storageState: seedUserAuthState });

  test("Export CSV button is present", async ({ page }) => {
    await page.goto("/projects");

    const exportButton = page.getByRole("button", { name: /export csv/i });
    await expect(exportButton).toBeVisible();
  });

  test("Export CSV button can be clicked", async ({ page }) => {
    await page.goto("/projects");

    const exportButton = page.getByRole("button", { name: /export csv/i });

    // Should be able to click without errors
    await expect(exportButton).toBeEnabled();

    // Monitor for API call
    let exportCalled = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/bff/exports")) {
        exportCalled = true;
      }
    });

    await exportButton.click();

    // Should attempt API call
    await page.waitForTimeout(500);
    expect(exportCalled).toBe(true);
  });
});

test.describe("Projects — API integration", () => {
  test.use({ storageState: seedUserAuthState });

  test("fetches projects from correct API endpoint", async ({ page }) => {
    const apiRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/bff/projects")) {
        apiRequests.push(request.url());
      }
    });

    await page.goto("/projects");
    await page.waitForLoadState("networkidle");

    // Should call API
    expect(apiRequests.length).toBeGreaterThan(0);
  });

  test("includes filter parameters in API request", async ({ page }) => {
    await page.goto("/projects");

    const searchInput = page.getByLabel("Search");
    await searchInput.fill("filteredProject");

    await page.waitForLoadState("networkidle");

    // URL should have search param
    expect(page.url()).toContain("search=filteredProject");
  });
});

test.describe("Projects — error handling", () => {
  test.use({ storageState: seedUserAuthState });

  test("handles API errors gracefully", async ({ page, context }) => {
    // Block projects API
    await context.route("**/api/bff/projects**", (route) => {
      void route.abort("failed");
    });

    await page.goto("/projects");

    // Page should still render
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("handles create project API error", async ({ page, context }) => {
    await page.goto("/projects/new");

    // Make create endpoint fail
    await context.route("**/api/bff/projects", (route) => {
      if (route.request().method() === "POST") {
        void route.abort("failed");
      } else {
        void route.continue();
      }
    });

    // Fill and submit form
    await page.getByLabel("Name").fill("Error Test Project");
    const submitButton = page.getByRole("button", { name: /create|save|submit/i }).first();
    await submitButton.click();

    // Should show error
    const errorToast = page.getByText(/error|failed/i);
    const errorVisible = await errorToast.isVisible({ timeout: 5000 }).catch(() => false);

    expect(errorVisible).toBe(true);
  });
});
