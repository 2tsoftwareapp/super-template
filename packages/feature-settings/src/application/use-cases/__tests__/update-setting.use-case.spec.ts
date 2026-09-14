import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { UpdateSettingUseCase } from "../update-setting.use-case";

const actor = {
  userId: "user-1",
  organizationId: "org-1",
  roles: ["SUPER_ADMIN"],
} as unknown as AuthenticatedRequestUser;

describe("UpdateSettingUseCase", () => {
  it("upserts with the actor id and audits the change", async () => {
    const updated = {
      key: "feature.flag",
      value: { enabled: true },
      updatedById: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };
    const settingsRepository = { upsert: vi.fn(async () => updated) };
    const auditService = { log: vi.fn(async () => undefined) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({})) };
    const settingsLookup = { invalidate: vi.fn() };
    const useCase = new UpdateSettingUseCase(
      settingsRepository as never,
      auditService as never,
      platformTransactionPort as never,
      settingsLookup as never,
    );

    const result = await useCase.execute(actor, "feature.flag", {
      value: { enabled: true },
    });

    expect(settingsRepository.upsert).toHaveBeenCalledWith(
      "feature.flag",
      { enabled: true },
      "user-1",
      expect.anything(),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "settings.updated",
        // The audit entity_id column is uuid-typed; settings are keyed by text.
        entityId: null,
        metadata: { key: "feature.flag" },
      }),
      expect.anything(),
    );
    // The updated key is invalidated so guards pick up the change immediately.
    expect(settingsLookup.invalidate).toHaveBeenCalledWith("feature.flag");
    expect(result).toMatchObject({ key: "feature.flag" });
  });

  it("invalidates the cached flag before the commit and again after it", async () => {
    // Ordered ledger of the effects; the fake cache records when it is cleared
    // relative to the commit.
    const events: string[] = [];
    const updated = {
      key: "maintenance_mode",
      value: { enabled: true },
      updatedById: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    };
    const settingsRepository = { upsert: vi.fn(async () => updated) };
    const auditService = { log: vi.fn(async () => undefined) };
    const platformTransactionPort = {
      run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        const result = await cb({});

        events.push("commit");
        return result;
      }),
    };
    const settingsLookup = {
      invalidate: vi.fn(async (key: string) => {
        events.push(`invalidate:${key}`);
      }),
    };
    const useCase = new UpdateSettingUseCase(
      settingsRepository as never,
      auditService as never,
      platformTransactionPort as never,
      settingsLookup as never,
    );

    await useCase.execute(actor, "maintenance_mode", { value: { enabled: true } });

    // One clear inside the transaction (so the pre-commit window is as short as
    // possible) and one after it (catching anything a concurrent reader cached
    // from the pre-commit row in between).
    expect(events).toEqual([
      "invalidate:maintenance_mode",
      "commit",
      "invalidate:maintenance_mode",
    ]);
  });

  it("clears the cache once and propagates when the transaction rolls back", async () => {
    // Invalidating only removes entries, so a rolled-back write leaves readers
    // on the unchanged row instead of on a value that was never committed.
    const settingsLookup = { invalidate: vi.fn(async () => undefined) };
    const rollback = new Error("connection lost");
    const platformTransactionPort = {
      run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
        await cb({});
        throw rollback;
      }),
    };
    const useCase = new UpdateSettingUseCase(
      {
        upsert: vi.fn(async () => ({ key: "feature.flag", value: {}, updatedById: null })),
      } as never,
      { log: vi.fn(async () => undefined) } as never,
      platformTransactionPort as never,
      settingsLookup as never,
    );

    await expect(useCase.execute(actor, "feature.flag", { value: { enabled: true } })).rejects.toBe(
      rollback,
    );
    expect(settingsLookup.invalidate).toHaveBeenCalledTimes(1);
  });

  it("throws SETTINGS_NOT_FOUND when the upsert returns nothing", async () => {
    const settingsRepository = { upsert: vi.fn(async () => null) };
    const auditService = { log: vi.fn() };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({})) };
    const settingsLookup = { invalidate: vi.fn() };
    const useCase = new UpdateSettingUseCase(
      settingsRepository as never,
      auditService as never,
      platformTransactionPort as never,
      settingsLookup as never,
    );

    await expect(
      useCase.execute(actor, "missing.key", { value: { x: "y" } }),
    ).rejects.toMatchObject({ code: SETTINGS_ERROR_CODES.SETTINGS_NOT_FOUND });
    expect(auditService.log).not.toHaveBeenCalled();
    expect(settingsLookup.invalidate).not.toHaveBeenCalled();
  });
});

import { SETTINGS_ERROR_CODES } from "@repo/feature-settings/contracts";
