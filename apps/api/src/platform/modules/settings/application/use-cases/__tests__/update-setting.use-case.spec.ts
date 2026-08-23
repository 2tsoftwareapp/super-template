import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequestUser } from "@repo/api-core";

import { ERROR_CODES } from "@repo/api-core";

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
    ).rejects.toMatchObject({ code: ERROR_CODES.SETTINGS_NOT_FOUND });
    expect(auditService.log).not.toHaveBeenCalled();
    expect(settingsLookup.invalidate).not.toHaveBeenCalled();
  });
});
