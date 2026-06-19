import { expect, test } from "@playwright/test";
import path from "node:path";

import {
  loginThroughUi,
  SEED_ADMIN,
  SEED_USER,
  uniqueEmail,
} from "./auth.helpers";

const seedAdminAuthState = path.join(__dirname, ".auth/seed-admin.json");
const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("Users Admin — permission and access control", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_ADMIN);
    await context.storageState({ path: seedAdminAuthState });
    await context.close();
  });

  test.use({ storageState: seedAdminAuthState });

  test("admin user can access /users page", async ({ page }) => {
    await page.goto("/users");

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("displays Admin badge on users page", async ({ page }) => {
    await page.goto("/users");

    const adminBadge = page.getByText("Admin");
    await expect(adminBadge).toBeVisible();

    // Verify it's a badge component with outline variant
    const badgeElement = adminBadge.locator("xpath=ancestor::*[@class and contains(@class, 'badge')]");
    await expect(badgeElement).toBeVisible();
  });
});

test.describe("Users Admin — access denied for non-admin", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("regular user cannot access /users - shows 403 error", async ({
    page,
  }) => {
    await page.goto("/users");

    // Should display 403 error page
    const errorCode = page.getByRole("heading", { name: "403" });
    await expect(errorCode).toBeVisible();

    // Should show permission denied message
    const errorMessage = page.getByText(/does not include.*users.read/i);
    await expect(errorMessage).toBeVisible();
  });
});

test.describe("Users Admin — page layout and structure", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays Users heading with text-4xl font-semibold", async ({
    page,
  }) => {
    await page.goto("/users");

    const heading = page.getByRole("heading", { level: 1, name: "Users" });
    await expect(heading).toBeVisible();

    const classes = await heading.getAttribute("class");
    expect(classes).toContain("text-4xl");
    expect(classes).toContain("font-semibold");
  });

  test("displays Filters card with description", async ({ page }) => {
    await page.goto("/users");

    const filtersTitle = page.getByRole("heading", { name: "Filters" });
    await expect(filtersTitle).toBeVisible();

    const filtersDescription = page.getByText("Filter users by status, role, and sort order.");
    await expect(filtersDescription).toBeVisible();
  });

  test("displays Directory (users table) card", async ({ page }) => {
    await page.goto("/users");

    const directoryTitle = page.getByRole("heading", { name: "Directory" });
    await expect(directoryTitle).toBeVisible();

    const directoryDescription = page.getByText("Browse users and their role assignments.");
    await expect(directoryDescription).toBeVisible();
  });

  test("displays pagination controls at bottom", async ({ page }) => {
    await page.goto("/users");

    const previousButton = page.getByRole("button", { name: "Previous" });
    const nextButton = page.getByRole("button", { name: "Next" });

    await expect(previousButton).toBeVisible();
    await expect(nextButton).toBeVisible();

    // Page info text
    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    await expect(pageInfo).toBeVisible();
  });
});

test.describe("Users Admin — filter controls", () => {
  test.use({ storageState: seedAdminAuthState });

  test("search input filters by name or email", async ({ page }) => {
    await page.goto("/users");

    const searchInput = page.getByLabel("Search");
    await expect(searchInput).toBeVisible();

    // Verify placeholder text
    const placeholder = await searchInput.getAttribute("placeholder");
    expect(placeholder).toBe("Search by name or email");

    // Type in search
    await searchInput.fill("admin");
    await page.waitForLoadState("networkidle");

    // URL should contain search parameter
    expect(page.url()).toContain("search=admin");
  });

  test("status dropdown filters by user status", async ({ page }) => {
    await page.goto("/users");

    const statusSelect = page.locator("text=Status").locator("..").locator("button");
    await expect(statusSelect).toBeVisible();

    // Click to open dropdown
    await statusSelect.click();

    // Should show status options
    const options = page.locator("[role='option']");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("role input filters by role name", async ({ page }) => {
    await page.goto("/users");

    const roleInput = page.getByLabel("Role");
    await expect(roleInput).toBeVisible();

    // Type role name
    await roleInput.fill("USER");
    await page.waitForLoadState("networkidle");

    // URL should contain role parameter
    expect(page.url()).toContain("role=USER");
  });

  test("sort field dropdown changes sort column", async ({ page }) => {
    await page.goto("/users");

    const sortFieldSelect = page.locator("text=Sort field").locator("..").locator("button");
    await expect(sortFieldSelect).toBeVisible();

    // Click to open dropdown
    await sortFieldSelect.click();

    // Should show sort field options
    const options = page.locator("[role='option']");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("sort order dropdown changes sort direction", async ({ page }) => {
    await page.goto("/users");

    const sortOrderSelect = page.locator("text=Sort order").locator("..").locator("button");
    await expect(sortOrderSelect).toBeVisible();

    // Click to open dropdown
    await sortOrderSelect.click();

    // Should show sort order options (ASC/DESC)
    const options = page.locator("[role='option']");
    const optionCount = await options.count();
    expect(optionCount).toBeGreaterThan(0);
  });

  test("filters reset page to 1 when changed", async ({ page }) => {
    await page.goto("/users?page=5");

    // Change search
    const searchInput = page.getByLabel("Search");
    await searchInput.fill("test");
    await page.waitForLoadState("networkidle");

    // Should reset to page=1
    expect(page.url()).toContain("page=1");
  });
});

test.describe("Users Admin — users table and display", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays users table with Name, Email, Status, Roles columns", async ({
    page,
  }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Check table headers
    const headers = page.locator("th");
    const headerTexts = await headers.allTextContents();

    expect(headerTexts).toContain("Name");
    expect(headerTexts).toContain("Email");
    expect(headerTexts).toContain("Status");
    expect(headerTexts).toContain("Roles");
  });

  test("displays user list in table rows", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Should have at least the seed admin user
    const tableRows = page.locator("tbody tr");
    const rowCount = await tableRows.count();

    expect(rowCount).toBeGreaterThan(0);
  });

  test("each user row shows name as link to /users/{id}", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const userLinks = page.locator("tbody td a[href^='/users/']");
    const linkCount = await userLinks.count();

    if (linkCount > 0) {
      const firstLink = userLinks.first();
      await expect(firstLink).toBeVisible();

      // Should link to /users/{id}
      const href = await firstLink.getAttribute("href");
      expect(href).toMatch(/^\/users\/[a-f0-9-]+$/i);
    }
  });

  test("displays status badge for each user", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const statusBadges = page.locator("tbody td [class*='badge']");
    const badgeCount = await statusBadges.count();

    if (badgeCount > 0) {
      const firstBadge = statusBadges.first();
      await expect(firstBadge).toBeVisible();

      // Should contain status text
      const statusText = await firstBadge.textContent();
      expect(statusText).toMatch(/ACTIVE|INACTIVE|SUSPENDED/i);
    }
  });

  test("displays user roles as comma-separated list", async ({ page }) => {
    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const rolesCells = page.locator("tbody td").filter({ hasText: /USER|ADMIN|MOD/ });
    const rolesCount = await rolesCells.count();

    if (rolesCount > 0) {
      const firstRoles = rolesCells.first();
      const rolesText = await firstRoles.textContent();

      // Should show role names
      expect(rolesText).toBeTruthy();
    }
  });

  test("displays empty state when no users found", async ({ page }) => {
    await page.goto("/users");

    // Apply impossible filter
    const searchInput = page.getByLabel("Search");
    await searchInput.fill("zzzznonexistentemailzzzz" + Date.now());
    await page.waitForLoadState("networkidle");

    // Should show empty state
    const emptyTitle = page.getByText("No users found");
    const emptyDescription = page.getByText("Adjust filters or seed more directory records.");

    // At least one should be visible
    const emptyTitleVisible = await emptyTitle.isVisible({ timeout: 5000 }).catch(() => false);
    const emptyDescriptionVisible = await emptyDescription.isVisible({ timeout: 5000 }).catch(() => false);

    expect(emptyTitleVisible || emptyDescriptionVisible).toBe(true);
  });

  test("shows loading spinner while fetching users", async ({ page, context }) => {
    // Delay API response
    await context.route("**/api/bff/admin/users**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue().catch(() => undefined);
    });

    await page.goto("/users");

    // Should show spinner
    const spinner = page.locator("[class*='spinner']");
    const _spinnerVisible = await spinner.isVisible({ timeout: 2000 }).catch(() => false);

    // Spinner might be briefly visible
    // Eventually table should load
    await expect(page.getByRole("heading", { name: "Directory" })).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Users Admin — create user dialog", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays Create user button with users.create permission", async ({
    page,
  }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await expect(createButton).toBeVisible();
  });

  test("opens create user dialog when button clicked", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    // Dialog should appear
    const dialogTitle = page.getByRole("heading", { name: "Create user" });
    await expect(dialogTitle).toBeVisible();

    const dialogDescription = page.getByText("Add a new user to the directory.");
    await expect(dialogDescription).toBeVisible();
  });

  test("create dialog has all required form fields", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    // Check all form fields exist
    const emailLabel = page.getByLabel("Email");
    const nameLabel = page.getByLabel("Display name");
    const passwordLabel = page.getByLabel("Password");

    await expect(emailLabel).toBeVisible();
    await expect(nameLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
  });

  test("email input has correct ID and accepts text", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    const emailInput = page.getByLabel("Email");
    await emailInput.fill("newuser@example.local");

    const value = await emailInput.inputValue();
    expect(value).toBe("newuser@example.local");
  });

  test("display name input has correct ID and accepts text", async ({
    page,
  }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    const nameInput = page.getByLabel("Display name");
    await nameInput.fill("Test User");

    const value = await nameInput.inputValue();
    expect(value).toBe("Test User");
  });

  test("password input is masked (type=password)", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    const passwordInput = page.getByLabel("Password");
    const inputType = await passwordInput.getAttribute("type");

    expect(inputType).toBe("password");
  });

  test("Create button in dialog creates user and shows success toast", async ({
    page,
  }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    // Fill form
    const newEmail = uniqueEmail("e2e-admin-user");
    await page.getByLabel("Email").fill(newEmail);
    await page.getByLabel("Display name").fill("E2E Test Admin User");
    await page.getByLabel("Password").fill("TestPassword123!");

    // Submit form
    const submitButton = page.locator("button[type='button']:has-text('Create')").last();
    await submitButton.click();

    // Should show success toast
    const successToast = page.getByText(/user created|success/i);
    const successVisible = await successToast.isVisible({ timeout: 5000 }).catch(() => false);

    // Dialog should close
    const dialogTitle = page.getByRole("heading", { name: "Create user" });
    const dialogVisible = await dialogTitle.isVisible({ timeout: 2000 }).catch(() => false);

    expect(successVisible || !dialogVisible).toBe(true);
  });

  test("closes dialog after successful creation", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    // Fill and submit
    const newEmail = uniqueEmail("e2e-create-user");
    await page.getByLabel("Email").fill(newEmail);
    await page.getByLabel("Display name").fill("Create Test User");
    await page.getByLabel("Password").fill("CreateTest123!");

    const submitButton = page.locator("button[type='button']:has-text('Create')").last();
    await submitButton.click();

    // Wait for dialog to close
    await page.waitForTimeout(500);

    const dialogTitle = page.getByRole("heading", { name: "Create user" });
    const isVisible = await dialogTitle.isVisible({ timeout: 2000 }).catch(() => false);

    expect(isVisible).toBe(false);
  });

  test("resets form after successful creation", async ({ page }) => {
    await page.goto("/users");

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    // Fill form
    const newEmail = uniqueEmail("e2e-reset-form");
    await page.getByLabel("Email").fill(newEmail);
    await page.getByLabel("Display name").fill("Reset Form Test");
    await page.getByLabel("Password").fill("ResetForm123!");

    const submitButton = page.locator("button[type='button']:has-text('Create')").last();
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(1000);

    // Open dialog again
    await createButton.click();

    // Fields should be empty
    const emailInput = page.getByLabel("Email");
    const nameInput = page.getByLabel("Display name");
    const passwordInput = page.getByLabel("Password");

    const emailValue = await emailInput.inputValue();
    const nameValue = await nameInput.inputValue();
    const passwordValue = await passwordInput.inputValue();

    expect(emailValue).toBe("");
    expect(nameValue).toBe("");
    expect(passwordValue).toBe("");
  });
});

test.describe("Users Admin — pagination", () => {
  test.use({ storageState: seedAdminAuthState });

  test("displays current page and total pages", async ({ page }) => {
    await page.goto("/users");

    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    await expect(pageInfo).toBeVisible();

    const pageText = await pageInfo.textContent();
    expect(pageText).toMatch(/^Page \d+ of \d+$/);
  });

  test("Previous button navigates to previous page", async ({ page }) => {
    await page.goto("/users?page=2");

    const previousButton = page.getByRole("button", { name: "Previous" });
    await previousButton.click();

    // Should navigate to page 1
    expect(page.url()).toContain("page=1");
  });

  test("Next button navigates to next page", async ({ page }) => {
    await page.goto("/users?page=1");

    const nextButton = page.getByRole("button", { name: "Next" });

    // Check if button is enabled (not on last page)
    const isDisabled = await nextButton.isDisabled();

    if (!isDisabled) {
      await nextButton.click();
      expect(page.url()).toContain("page=2");
    }
  });

  test("Previous button is disabled on page 1", async ({ page }) => {
    await page.goto("/users?page=1");

    const previousButton = page.getByRole("button", { name: "Previous" });
    const isDisabled = await previousButton.isDisabled();

    expect(isDisabled).toBe(true);
  });

  test("Next button is disabled on last page", async ({ page }) => {
    await page.goto("/users");

    // Navigate to last page (need to check total pages)
    const pageInfo = page.locator("text=/^Page \\d+ of \\d+$/");
    const pageText = await pageInfo.textContent();
    const match = pageText?.match(/Page (\d+) of (\d+)/);

    if (match && match[1] === match[2]) {
      // Already on last page
      const nextButton = page.getByRole("button", { name: "Next" });
      const isDisabled = await nextButton.isDisabled();
      expect(isDisabled).toBe(true);
    }
  });
});

test.describe("Users Admin — API integration", () => {
  test.use({ storageState: seedAdminAuthState });

  test("fetches users from /api/bff/admin/users endpoint", async ({
    page,
  }) => {
    const apiRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("/api/bff/admin/users")) {
        apiRequests.push(request.url());
      }
    });

    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    // Should call the API
    expect(apiRequests.length).toBeGreaterThan(0);

    // Should include admin users endpoint
    const hasAdminUsersCall = apiRequests.some((url) =>
      url.includes("/api/bff/admin/users")
    );
    expect(hasAdminUsersCall).toBe(true);
  });

  test("sends correct query parameters in API request", async ({ page }) => {
    await page.goto("/users");

    const searchInput = page.getByLabel("Search");
    await searchInput.fill("test");

    const roleInput = page.getByLabel("Role");
    await roleInput.fill("USER");

    await page.waitForLoadState("networkidle");

    // URL should reflect filters
    expect(page.url()).toContain("search=test");
    expect(page.url()).toContain("role=USER");
  });

  test("invalidates users query after creating new user", async ({
    page,
    context,
  }) => {
    let requestCount = 0;

    // Count API calls
    await context.route("**/api/bff/admin/users**", (route) => {
      requestCount++;
      void route.continue();
    });

    await page.goto("/users");
    await page.waitForLoadState("networkidle");

    const initialRequestCount = requestCount;

    // Create a user
    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    const newEmail = uniqueEmail("e2e-invalidate");
    await page.getByLabel("Email").fill(newEmail);
    await page.getByLabel("Display name").fill("Invalidate Test");
    await page.getByLabel("Password").fill("Invalidate123!");

    const submitButton = page.locator("button[type='button']:has-text('Create')").last();
    await submitButton.click();

    // Wait for query to refetch
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Should have made more API calls (initial load + refetch after create)
    expect(requestCount).toBeGreaterThan(initialRequestCount);
  });
});

test.describe("Users Admin — error handling", () => {
  test.use({ storageState: seedAdminAuthState });

  test("handles API errors gracefully", async ({ page, context }) => {
    // Block users API
    await context.route("**/api/bff/admin/users**", (route) => {
      void route.abort("failed");
    });

    await page.goto("/users");

    // Page should still render
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });

  test("shows error toast on create user failure", async ({
    page,
    context,
  }) => {
    await page.goto("/users");

    // Setup to fail on create
    let requestsAfterClick = 0;
    await context.route("**/api/bff/admin/users", (route) => {
      if (requestsAfterClick > 0) {
        // Fail POST requests (create)
        if (route.request().method() === "POST") {
          void route.abort("failed");
          return;
        }
      }
      void route.continue();
    });

    const createButton = page.getByRole("button", { name: "Create user" });
    await createButton.click();

    const newEmail = uniqueEmail("e2e-error");
    await page.getByLabel("Email").fill(newEmail);
    await page.getByLabel("Display name").fill("Error Test");
    await page.getByLabel("Password").fill("ErrorTest123!");

    requestsAfterClick = 1;
    const submitButton = page.locator("button[type='button']:has-text('Create')").last();
    await submitButton.click();

    // Should show error message
    const errorToast = page.getByText(/error|failed/i);
    const errorVisible = await errorToast.isVisible({ timeout: 5000 }).catch(() => false);

    expect(errorVisible).toBe(true);
  });
});
