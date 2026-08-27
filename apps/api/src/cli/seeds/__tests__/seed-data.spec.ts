import { describe, expect, it, vi } from "vitest";

const runAccessControl = vi.fn();
const runSettings = vi.fn();
const runUsers = vi.fn();
const runNotifications = vi.fn();
const runAuth = vi.fn();

vi.mock("../../../composition/composed-schema", () => ({
  composedSeeders: [
    { id: "access-control", run: runAccessControl },
    { id: "settings", run: runSettings },
    { id: "users", run: runUsers },
    { id: "notifications", run: runNotifications },
    { id: "auth-session-cleanup", run: runAuth },
  ],
  composedAuthorization: { resources: {}, grantsByRole: {} },
}));

describe("seedDatabase", () => {
  it("runs composed seeders inside the worker tenant context and one transaction", async () => {
    const calls: string[] = [];
    const transaction = { id: "tx-1" };

    runAccessControl.mockImplementation(async () => {
      calls.push("access-control");
    });
    runSettings.mockImplementation(async () => {
      calls.push("settings");
    });
    runUsers.mockImplementation(async (ctx: { bag: Record<string, unknown> }) => {
      calls.push("users");
      ctx.bag.seededUsers = {
        adminUserId: "admin-user",
        regularUserId: "regular-user",
      };
    });
    runNotifications.mockImplementation(async () => {
      calls.push("notifications");
    });
    runAuth.mockImplementation(async () => {
      calls.push("auth-session-cleanup");
    });

    const database = {
      transaction: vi.fn((callback: (value: unknown) => Promise<unknown>) => callback(transaction)),
    };
    const tenantContextService = {
      runAsync: vi.fn((context: unknown, callback: () => Promise<unknown>) => callback()),
    };
    const environmentService = { id: "environment-service" };
    const app = {
      get: vi.fn((token: unknown) => {
        if (token === database || String(token).includes("DATABASE")) {
          // resolved below via explicit mock sequence
        }
        return undefined;
      }),
    };

    // Match seed-data resolution order: DATABASE, TenantContextService, EnvironmentService
    const { DATABASE } = await import("@repo/database-runtime");
    const { TenantContextService, EnvironmentService } = await import("@repo/api-runtime");

    (app as { get: (token: unknown) => unknown }).get = vi.fn((token: unknown): unknown => {
      if (token === DATABASE) {
        return database;
      }
      if (token === TenantContextService) {
        return tenantContextService;
      }
      if (token === EnvironmentService) {
        return environmentService;
      }
      throw new Error(`Unexpected token: ${String(token)}`);
    });

    const { seedDatabase } = await import("../seed-data.js");

    await seedDatabase(app as never);

    expect(tenantContextService.runAsync).toHaveBeenCalledTimes(1);
    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(runAccessControl).toHaveBeenCalledTimes(1);
    expect(runSettings).toHaveBeenCalledTimes(1);
    expect(runUsers).toHaveBeenCalledTimes(1);
    expect(runNotifications).toHaveBeenCalledTimes(1);
    expect(runAuth).toHaveBeenCalledTimes(1);

    const seedCtx = runAccessControl.mock.calls[0]?.[0];
    expect(seedCtx).toMatchObject({
      app,
      executor: transaction,
      bag: expect.any(Object),
    });
    expect(runUsers.mock.calls[0]?.[0]).toBe(seedCtx);
    expect(runNotifications.mock.calls[0]?.[0]).toBe(seedCtx);
    expect(runAuth.mock.calls[0]?.[0]).toBe(seedCtx);

    expect(calls).toEqual([
      "access-control",
      "settings",
      "users",
      "notifications",
      "auth-session-cleanup",
    ]);
  }, 30000);
});
