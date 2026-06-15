import { expect, test } from "@playwright/test";

const SESSION_MOCK = {
  data: {
    user: {
      id: "user-1",
      email: "test@example.com",
      displayName: "Test User",
      status: "ACTIVE",
      roles: [],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    permissions: ["projects.read", "projects.write"],
    sessionId: "session-1",
  },
  meta: { requestId: "req-1" },
};

const PROJECTS_MOCK = {
  data: [
    {
      id: "proj-abc",
      name: "Alpha",
      description: "First project",
      status: "ACTIVE",
    },
    {
      id: "proj-def",
      name: "Beta",
      description: null,
      status: "DRAFT",
    },
  ],
  meta: { page: 2, limit: 20, total: 25, totalPages: 2 },
};

test.beforeEach(async ({ page }) => {
  await page.route("/api/auth/session", (route) =>
    route.fulfill({ json: SESSION_MOCK }),
  );
  await page.route("/api/bff/projects**", (route) =>
    route.fulfill({ json: PROJECTS_MOCK }),
  );
  await page.route("/api/bff/projects/*", (route) =>
    route.fulfill({
      json: { data: PROJECTS_MOCK.data[0] },
    }),
  );
});

test("project card links encode current filters in returnTo", async ({
  page,
}) => {
  await page.goto("/projects?status=ACTIVE&page=2");

  const cardLink = page.locator("a").filter({ hasText: "Alpha" }).first();
  const href = await cardLink.getAttribute("href");

  expect(href).toMatch(/\/projects\/proj-abc\?returnTo=/);
  expect(href).toContain(encodeURIComponent("/projects"));
  expect(href).toContain(encodeURIComponent("status=ACTIVE"));
  expect(href).toContain(encodeURIComponent("page=2"));
});

test("New project button encodes current filters in returnTo", async ({
  page,
}) => {
  await page.goto("/projects?status=ACTIVE&search=alpha");

  const newProjectLink = page.locator("a", { hasText: "New project" });
  const href = await newProjectLink.getAttribute("href");

  expect(href).toMatch(/\/projects\/new\?returnTo=/);
  expect(href).toContain(encodeURIComponent("status=ACTIVE"));
  expect(href).toContain(encodeURIComponent("search=alpha"));
});

test("detail page Back link restores list filters from returnTo", async ({
  page,
}) => {
  const returnTo = encodeURIComponent("/projects?status=ACTIVE&page=2");
  await page.goto(`/projects/proj-abc?returnTo=${returnTo}`);

  const backLink = page.locator("a", { hasText: "Back to projects" });
  const href = await backLink.getAttribute("href");

  expect(href).toBe("/projects?status=ACTIVE&page=2");
});

test("detail page rejects unsafe returnTo and falls back to /projects", async ({
  page,
}) => {
  const unsafe = encodeURIComponent("https://evil.example/steal");
  await page.goto(`/projects/proj-abc?returnTo=${unsafe}`);

  const backLink = page.locator("a", { hasText: "Back to projects" });
  const href = await backLink.getAttribute("href");

  expect(href).toBe("/projects");
});

test("create page Back link restores list filters from returnTo", async ({
  page,
}) => {
  const returnTo = encodeURIComponent("/projects?search=nuqs&page=3");
  await page.goto(`/projects/new?returnTo=${returnTo}`);

  const backLink = page.locator("a", { hasText: "Back to projects" });
  const href = await backLink.getAttribute("href");

  expect(href).toBe("/projects?search=nuqs&page=3");
});
