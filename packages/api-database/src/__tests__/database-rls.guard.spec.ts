import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DatabaseRlsGuard } from "../database-rls.guard";

describe("DatabaseRlsGuard", () => {
  it("skips the capability query when the check is disabled", async () => {
    const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(vi.fn());
    const pool = { query: vi.fn() };
    const guard = new DatabaseRlsGuard(pool as never, { databaseSkipRlsCheck: true } as never);

    await expect(guard.onModuleInit()).resolves.toBeUndefined();
    expect(pool.query).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });

  it("fails when the current role bypasses RLS", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            currentUser: "postgres",
            isSuperuser: false,
            bypassesRls: true,
          },
        ],
      }),
    };
    const guard = new DatabaseRlsGuard(pool as never, { databaseSkipRlsCheck: false } as never);

    await expect(guard.onModuleInit()).rejects.toThrow("bypasses row-level security");
  });

  it("passes for a restricted role", async () => {
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(vi.fn());
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            currentUser: "fullstack_starter_app",
            isSuperuser: false,
            bypassesRls: false,
          },
        ],
      }),
    };
    const guard = new DatabaseRlsGuard(pool as never, { databaseSkipRlsCheck: false } as never);

    await expect(guard.onModuleInit()).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      'Database RLS guard passed for restricted role "fullstack_starter_app"',
    );
  });
});
