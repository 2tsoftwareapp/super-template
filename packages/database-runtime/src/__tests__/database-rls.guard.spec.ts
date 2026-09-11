import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DatabaseRlsGuard } from "../database-rls.guard";

describe("DatabaseRlsGuard", () => {
  it("skips the capability query when the check is disabled", async () => {
    const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(vi.fn());
    const pool = { query: vi.fn() };
    const guard = new DatabaseRlsGuard(
      pool as never,
      undefined,
      { databaseSkipRlsCheck: true } as never,
      { readReplica: false },
    );

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
    const guard = new DatabaseRlsGuard(
      pool as never,
      undefined,
      { databaseSkipRlsCheck: false } as never,
      { readReplica: false },
    );

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
    const guard = new DatabaseRlsGuard(
      pool as never,
      undefined,
      { databaseSkipRlsCheck: false } as never,
      { readReplica: false },
    );

    await expect(guard.onModuleInit()).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith(
      'Database RLS guard passed for DATABASE_URL restricted role "fullstack_starter_app"',
    );
  });

  it("fails when the configured replica role bypasses RLS", async () => {
    const primaryPool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ currentUser: "fullstack_starter_app", isSuperuser: false, bypassesRls: false }],
      }),
    };
    const replicaPool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ currentUser: "replica_admin", isSuperuser: true, bypassesRls: false }],
      }),
    };
    const guard = new DatabaseRlsGuard(
      primaryPool as never,
      replicaPool as never,
      { databaseSkipRlsCheck: false } as never,
      { readReplica: true },
    );

    await expect(guard.onModuleInit()).rejects.toThrow(/DATABASE_URL_READ_REPLICA.*bypasses/);
    expect(primaryPool.query).toHaveBeenCalledTimes(1);
    expect(replicaPool.query).toHaveBeenCalledTimes(1);
  });

  it("fails when replica capability is selected without an injected replica pool", async () => {
    const primaryPool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ currentUser: "fullstack_starter_app", isSuperuser: false, bypassesRls: false }],
      }),
    };
    const guard = new DatabaseRlsGuard(
      primaryPool as never,
      undefined,
      { databaseSkipRlsCheck: false } as never,
      { readReplica: true },
    );

    await expect(guard.onModuleInit()).rejects.toThrow(/DATABASE_URL_READ_REPLICA is required/);
  });
});
