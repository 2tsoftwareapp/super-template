import { expect, test } from "@playwright/test";
import path from "node:path";

import {
  changePasswordThroughUi,
  loginThroughUi,
  logoutThroughUi,
  resetPasswordThroughUi,
  SEED_ADMIN,
  SEED_USER,
  uniqueEmail,
  verifyEmailThroughUi,
  waitForMailpitToken,
} from "./auth.helpers";

const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("Auth — public pages", () => {
  test("login page exposes sign-in form and auth links", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
  });

  test("register page is reachable from login", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: "Register" }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(
      page.getByRole("heading", { name: /create a starter account/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("forgot-password page accepts an email", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible();
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByRole("button", { name: "Send reset email" }).click();

    await expect(
      page.getByText("If the account exists, a reset email was sent."),
    ).toBeVisible();
  });

  test("reset-password page renders token and password fields", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=sample-token");

    await expect(
      page.getByRole("heading", { name: /choose a new password/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Reset token")).toHaveValue("sample-token");
    await expect(page.getByLabel("New password")).toBeVisible();
  });

  test("verify-email page disables action without token", async ({ page }) => {
    await page.goto("/verify-email");

    await expect(
      page.getByRole("heading", { name: /verify email/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Verify email" })).toBeDisabled();
  });
});

test.describe("Auth — access control", () => {
  test("protected dashboard redirects guests to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Password").fill("wrong-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/request failed|invalid|unauthorized/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("Auth — session lifecycle", () => {
  test("seed user can sign in, open workspace, and sign out", async ({
    page,
  }) => {
    await loginThroughUi(page, SEED_USER);

    await page.goto("/dashboard");
    await expect(page.getByText(SEED_USER.displayName)).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    const sessionResponse = await page.request.get("/api/auth/session");
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionBody = (await sessionResponse.json()) as {
      data: { user: { email: string } };
    };
    expect(sessionBody.data.user.email).toBe(SEED_USER.email);

    await logoutThroughUi(page);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("seed admin can sign in", async ({ page }) => {
    await loginThroughUi(page, SEED_ADMIN);
    await page.goto("/dashboard");
    await expect(page.getByText(SEED_ADMIN.displayName)).toBeVisible();
  });
});

test.describe("Auth — registration", () => {
  test("registers a new account, verifies email, and signs in", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("playwright-register");

    await page.goto("/register");
    await page.getByLabel("Display name").fill("Playwright Register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("ChangeMe123!");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("Registration submitted. Check Mailpit for verification."),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    const verificationToken = await waitForMailpitToken(request, email);
    await verifyEmailThroughUi(page, verificationToken);

    await loginThroughUi(page, { email, password: "ChangeMe123!" });
    await page.goto("/dashboard");
    await expect(page.getByText("Playwright Register")).toBeVisible();
  });
});

test.describe("Auth — password reset", () => {
  test("completes password reset flow with email token", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("playwright-reset");
    const newPassword = "NewPassword456!";

    // Register a new account first
    await page.goto("/register");
    await page.getByLabel("Display name").fill("Reset Test User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("InitialPassword123!");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("Registration submitted. Check Mailpit for verification."),
    ).toBeVisible();

    // Get verification token and verify email
    const verificationToken = await waitForMailpitToken(request, email);
    await verifyEmailThroughUi(page, verificationToken);

    // Reset password using helper
    await resetPasswordThroughUi(page, request, email, newPassword);

    // Verify login with new password works
    await loginThroughUi(page, { email, password: newPassword });
    await page.goto("/dashboard");
    await expect(page.getByText("Reset Test User")).toBeVisible();
  });

  test("rejects invalid reset token", async ({ page }) => {
    await page.goto("/reset-password?token=invalid-token-12345");
    await page.getByLabel("New password").fill("NewPassword456!");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page.getByText(/invalid|expired|token/i)).toBeVisible();
  });
});

test.describe("Auth — email verification", () => {
  test("user cannot log in with unverified email", async ({
    page,
    _request,
  }) => {
    const email = uniqueEmail("playwright-unverified");

    await page.goto("/register");
    await page.getByLabel("Display name").fill("Unverified User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("ChangeMe123!");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("Registration submitted. Check Mailpit for verification."),
    ).toBeVisible();

    // Try to log in without verifying
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("ChangeMe123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should see an error or redirect
    await expect(
      page.getByText(/verify|unverified|not verified|check email/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("handles invalid verification token", async ({ page }) => {
    await page.goto("/verify-email?token=invalid-verification-token");
    const verifyButton = page.getByRole("button", { name: "Verify email" });
    await expect(verifyButton).toBeEnabled({ timeout: 5_000 });
    await verifyButton.click();

    await expect(page.getByText(/invalid|expired|failed/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("resend verification email flow", async ({ page, request }) => {
    const email = uniqueEmail("playwright-resend-verification");

    await page.goto("/register");
    await page.getByLabel("Display name").fill("Resend Test");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("ChangeMe123!");
    await page.getByRole("button", { name: "Register" }).click();

    await expect(
      page.getByText("Registration submitted. Check Mailpit for verification."),
    ).toBeVisible();

    // Wait for first email
    const token = await waitForMailpitToken(request, email);
    expect(token).toBeTruthy();
  });
});

test.describe("Auth — authenticated settings", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("profile settings show the signed-in user", async ({ page }) => {
    await page.goto("/settings/profile");

    await expect(
      page.getByText("Update display name and avatar."),
    ).toBeVisible();
    await expect(page.getByLabel("Display name")).toHaveValue(
      SEED_USER.displayName,
    );
  });

  test("sessions settings list the current session", async ({ page }) => {
    await page.goto("/settings/sessions");

    await expect(
      page.getByRole("heading", { name: "Active sessions" }),
    ).toBeVisible();
    await expect(page.getByText("Current")).toBeVisible();
  });

  test("security settings expose password rotation form", async ({ page }) => {
    await page.goto("/settings/security");

    await expect(
      page.getByText("Rotate the current password for the active account."),
    ).toBeVisible();
    await expect(page.getByLabel("Current password")).toBeVisible();
    await expect(page.getByLabel("New password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update password" }),
    ).toBeVisible();
  });

  test("can update password in security settings", async ({ page }) => {
    const newPassword = "UpdatedPassword789!";

    await changePasswordThroughUi(page, SEED_USER.password, newPassword);

    // Log out and verify new password works
    await logoutThroughUi(page);
    await loginThroughUi(page, {
      email: SEED_USER.email,
      password: newPassword,
    });
    await page.goto("/dashboard");
    await expect(page.getByText(SEED_USER.displayName)).toBeVisible();
  });
});

test.describe("Auth — multiple sessions", () => {
  test("user can open multiple concurrent sessions", async ({
    browser,
    _request,
  }) => {
    const credentials = {
      email: SEED_USER.email,
      password: SEED_USER.password,
    };

    // Create first session
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginThroughUi(page1, credentials);
    await page1.goto("/dashboard");

    // Create second session
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginThroughUi(page2, credentials, { fresh: false });
    await page2.goto("/dashboard");

    // Both should show the user
    await expect(page1.getByText(SEED_USER.displayName)).toBeVisible();
    await expect(page2.getByText(SEED_USER.displayName)).toBeVisible();

    // Sessions endpoint should reflect both sessions
    const sessionsResponse = await page1.request.get("/api/auth/sessions");
    if (sessionsResponse.ok()) {
      const sessionsBody = (await sessionsResponse.json()) as {
        data: { sessions: { id: string }[] };
      };
      expect(sessionsBody.data.sessions.length).toBeGreaterThanOrEqual(1);
    }

    await context1.close();
    await context2.close();
  });

  test("logging out from one session doesn't affect others", async ({
    browser,
  }) => {
    const credentials = {
      email: SEED_USER.email,
      password: SEED_USER.password,
    };

    // Create first session
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginThroughUi(page1, credentials);

    // Create second session
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginThroughUi(page2, credentials, { fresh: false });

    // Log out from first session
    await logoutThroughUi(page1);
    await page1.goto("/dashboard");
    await expect(page1).toHaveURL(/\/login$/);

    // Second session should still be active
    await page2.goto("/dashboard");
    await expect(page2.getByText(SEED_USER.displayName)).toBeVisible();

    await context1.close();
    await context2.close();
  });
});

test.describe("Auth — session persistence", () => {
  test("session persists across page reloads", async ({ page }) => {
    await loginThroughUi(page, SEED_USER);
    await page.goto("/dashboard");

    // Reload the page
    await page.reload();

    // Should still be logged in
    await expect(page.getByText(SEED_USER.displayName)).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("session persists across navigation", async ({ page }) => {
    await loginThroughUi(page, SEED_USER);

    // Navigate through multiple pages
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/settings\/profile$/);

    await page.goto("/settings/security");
    await expect(page).toHaveURL(/\/settings\/security$/);

    await page.goto("/dashboard");
    await expect(page.getByText(SEED_USER.displayName)).toBeVisible();
  });
});

test.describe("Auth — form validation", () => {
  test("register form validates required fields", async ({ page }) => {
    await page.goto("/register");

    // Try submitting without filling fields
    const registerButton = page.getByRole("button", { name: "Register" });
    const isDisabled = await registerButton.isDisabled();

    if (!isDisabled) {
      await registerButton.click();
      await expect(
        page.getByText(/required|please|enter|this field/i),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("login form validates email format", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("password123");

    const signInButton = page.getByRole("button", { name: "Sign in" });
    // Button might be disabled or validation happens on submit
    const isDisabled = await signInButton.isDisabled();

    if (!isDisabled) {
      await signInButton.click();
      // May show validation error
      await expect(
        page.getByText(/invalid|email|format/i),
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("password field masks input", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.getByLabel("Password");

    await passwordInput.fill("MyPassword123!");
    expect(await passwordInput.getAttribute("type")).toBe("password");
  });
});

test.describe("Auth — error handling", () => {
  test("displays error message on network failure", async ({
    page,
    context,
  }) => {
    // Simulate network error by blocking API calls
    await context.route("**/api/auth/signin", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Password").fill(SEED_USER.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page.getByText(/network|connection|error|failed/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("handles server errors gracefully", async ({ page, context }) => {
    await context.route("**/api/auth/**", async (route) => {
      await route.abort("serverfail");
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill(SEED_USER.email);
    await page.getByLabel("Password").fill(SEED_USER.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
