import { type APIRequestContext, expect, type Page } from "@playwright/test";

export const SEED_USER = {
  email: process.env.E2E_USER_EMAIL ?? "user@example.local",
  password: process.env.E2E_USER_PASSWORD ?? "ChangeMe123!",
  displayName: "Seed User",
};

export const SEED_ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? "admin@example.local",
  password: process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123!",
  displayName: "Seed Admin",
};

const MAILPIT_HTTP_URL =
  process.env.MAILPIT_HTTP_URL ??
  `http://localhost:${process.env.MAILPIT_HTTP_PORT ?? "8025"}`;

export async function loginThroughUi(
  page: Page,
  credentials: { email: string; password: string },
  options: { fresh?: boolean } = {},
) {
  if (options.fresh ?? true) {
    await page.context().clearCookies();
  }

  const session = await page.request.get("/api/auth/session");
  if (session.ok()) {
    const body = (await session.json()) as {
      data?: { user?: { email?: string } };
    };
    if (body.data?.user?.email === credentials.email) {
      await page.goto("/dashboard");
      return;
    }
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText(/Welcome back/i)).toBeVisible({
    timeout: 15_000,
  });
}

export async function ensureAuthenticated(
  page: Page,
  credentials: { email: string; password: string },
) {
  await loginThroughUi(page, credentials, { fresh: false });
}

export async function logoutThroughUi(page: Page) {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@example.local`;
}

function extractTokenFromMailBody(body: string, param: "token"): string | null {
  const match = new RegExp(`[?&]${param}=([A-Za-z0-9._-]+)`, "i").exec(body);
  return match?.[1] ?? null;
}

async function listMailpitMessages(request: APIRequestContext) {
  const response = await request.get(`${MAILPIT_HTTP_URL}/api/v1/messages`);
  if (!response.ok()) {
    throw new Error(
      `Mailpit is unavailable at ${MAILPIT_HTTP_URL} (status ${response.status()})`,
    );
  }

  return (await response.json()) as {
    messages: { ID: string; To: { Address: string }[] }[];
  };
}

async function readMailpitMessage(
  request: APIRequestContext,
  messageId: string,
) {
  const response = await request.get(
    `${MAILPIT_HTTP_URL}/api/v1/message/${messageId}`,
  );
  expect(response.ok()).toBeTruthy();

  return (await response.json()) as { Text: string; HTML: string };
}

export async function waitForMailpitToken(
  request: APIRequestContext,
  recipient: string,
  options: { param?: "token"; timeoutMs?: number } = {},
) {
  const param = options.param ?? "token";
  const timeoutMs = options.timeoutMs ?? 15_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const listing = await listMailpitMessages(request);
    const message = listing.messages.find((entry) =>
      entry.To.some(
        (recipientEntry) =>
          recipientEntry.Address.toLowerCase() === recipient.toLowerCase(),
      ),
    );

    if (message) {
      const content = await readMailpitMessage(request, message.ID);
      const token =
        extractTokenFromMailBody(content.Text, param) ??
        extractTokenFromMailBody(content.HTML, param);

      if (token) {
        return token;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for Mailpit message to ${recipient}`);
}

export async function verifyEmailThroughUi(page: Page, token: string) {
  await page.goto(`/verify-email?token=${token}`);
  const verifyButton = page.getByRole("button", { name: "Verify email" });
  await expect(verifyButton).toBeEnabled({ timeout: 10_000 });
  await verifyButton.click();
  await expect(page.getByText("Email verified")).toBeVisible();
}

export async function changePasswordThroughUi(
  page: Page,
  currentPassword: string,
  newPassword: string,
) {
  await page.goto("/settings/security");
  await page.getByLabel("Current password").fill(currentPassword);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(page.getByText(/password.*updated|success/i)).toBeVisible({
    timeout: 10_000,
  });
}

export async function resetPasswordThroughUi(
  page: Page,
  request: APIRequestContext,
  email: string,
  newPassword: string,
) {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset email" }).click();

  await expect(
    page.getByText("If the account exists, a reset email was sent."),
  ).toBeVisible();

  const resetToken = await waitForMailpitToken(request, email, {
    param: "token",
    timeoutMs: 10_000,
  });

  await page.goto(`/reset-password?token=${resetToken}`);
  await page.getByLabel("New password").fill(newPassword);
  await page.getByRole("button", { name: "Reset password" }).click();

  await expect(page.getByText(/password.*reset|successfully/i)).toBeVisible({
    timeout: 10_000,
  });
}
