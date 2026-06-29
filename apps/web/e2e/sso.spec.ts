import { expect, test } from "@playwright/test";
import path from "node:path";

import { loginThroughUi, logoutThroughUi, SEED_USER, uniqueEmail } from "./auth.helpers";

const seedUserAuthState = path.join(__dirname, ".auth/seed-user.json");

test.describe("SSO — login page UI", () => {
  test("shows SSO provider buttons on login page", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Or continue with")).toBeVisible();
    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Apple/i })).toBeVisible();
  });
});

test.describe("SSO — fake provider flow", () => {
  test("completes SSO login via fake provider", async ({ page }) => {
    await page.context().clearCookies();

    const testEmail = uniqueEmail("sso-fake");

    const startResponse = await page.request.get(
      `/api/auth/sso/fake/start?redirectUri=${encodeURIComponent(
        page.url().replace(/\/$/, "") || "http://localhost:3000"
      )}/login/sso/callback?provider=fake&testEmail=${encodeURIComponent(testEmail)}`,
    );
    expect(startResponse.ok()).toBeTruthy();

    const startBody = (await startResponse.json()) as {
      data: { authorizationUrl: string };
    };
    expect(startBody.data.authorizationUrl).toBeTruthy();

    const authUrl = new URL(startBody.data.authorizationUrl);
    const code = authUrl.searchParams.get("code");
    const state = authUrl.searchParams.get("state");
    expect(code).toBeTruthy();
    expect(state).toBeTruthy();

    const callbackResponse = await page.request.get(
      `/api/auth/sso/fake/callback?code=${code}&state=${state}`,
    );
    expect(callbackResponse.ok()).toBeTruthy();

    const callbackBody = (await callbackResponse.json()) as {
      data?: { user?: { email?: string } };
    };
    expect(callbackBody.data).toBeTruthy();
  });

  test("SSO callback page handles missing exchange code", async ({ page }) => {
    await page.goto("/login/sso/callback");

    await expect(page.getByText(/missing|exchange|failed/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("SSO callback page handles error parameter", async ({ page }) => {
    await page.goto("/login/sso/callback?error=sso_failed");

    await expect(page.getByText(/sso.*failed|sign-in.*failed/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("SSO — API route validation", () => {
  test("start endpoint rejects missing redirectUri", async ({ page }) => {
    const response = await page.request.get("/api/auth/sso/fake/start");
    expect(response.status()).toBe(400);
  });

  test("establish-session rejects missing exchangeCode", async ({ page }) => {
    const response = await page.request.post(
      "/api/auth/sso/establish-session",
      {
        data: {},
        headers: { "content-type": "application/json" },
      },
    );
    expect(response.status()).toBe(400);

    const body = (await response.json()) as {
      error?: { code?: string };
    };
    expect(body.error?.code).toBe("VALIDATION_ERROR");
  });

  test("establish-session rejects invalid exchangeCode", async ({ page }) => {
    const response = await page.request.post(
      "/api/auth/sso/establish-session",
      {
        data: { exchangeCode: "invalid-code-12345" },
        headers: { "content-type": "application/json" },
      },
    );
    expect(response.ok()).toBeFalsy();
  });
});

test.describe("SSO — callback endpoint", () => {
  test("callback returns exchange code for valid auth flow", async ({
    page,
  }) => {
    const redirectUri = "http://localhost:3000/login/sso/callback?provider=fake";

    const startResponse = await page.request.get(
      `/api/auth/sso/fake/start?redirectUri=${encodeURIComponent(redirectUri)}`,
    );
    expect(startResponse.ok()).toBeTruthy();

    const { data } = (await startResponse.json()) as {
      data: { authorizationUrl: string };
    };
    const authUrl = new URL(data.authorizationUrl);
    const code = authUrl.searchParams.get("code")!;
    const state = authUrl.searchParams.get("state")!;

    const callbackResponse = await page.request.get(
      `/api/auth/sso/fake/callback?code=${code}&state=${state}`,
    );
    expect(callbackResponse.ok()).toBeTruthy();
  });
});

test.describe("SSO — authenticated user interaction", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginThroughUi(page, SEED_USER);
    await context.storageState({ path: seedUserAuthState });
    await context.close();
  });

  test.use({ storageState: seedUserAuthState });

  test("SSO buttons are visible even when logged out", async ({ page }) => {
    await logoutThroughUi(page);
    await page.goto("/login");

    await expect(page.getByRole("button", { name: /GitHub/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Apple/i })).toBeVisible();
  });
});

test.describe("SSO — error scenarios", () => {
  test("handles network failure on SSO start gracefully", async ({
    page,
    context,
  }) => {
    await context.route("**/api/auth/sso/*/start*", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/login");
    await page.getByRole("button", { name: /GitHub/i }).click();

    await expect(page.getByText(/failed|error|network/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
