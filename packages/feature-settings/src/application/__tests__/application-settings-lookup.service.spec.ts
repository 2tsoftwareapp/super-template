import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { EnvironmentService } from "@repo/api-runtime";

import { ApplicationSettingsLookupService } from "../application-settings-lookup.service";

function makeService(
  settingsRepository: { findByKey: ReturnType<typeof vi.fn> },
  env: Partial<EnvironmentService> = {},
): ApplicationSettingsLookupService {
  const environmentService = {
    appEnv: "test",
    settingsLookupCacheTtlSeconds: 5,
    ...env,
  } as unknown as EnvironmentService;

  return new ApplicationSettingsLookupService(settingsRepository as never, environmentService);
}

describe("ApplicationSettingsLookupService", () => {
  it("defaults registration to enabled when the setting row is missing", async () => {
    const service = makeService({ findByKey: vi.fn(async () => null) });

    await expect(service.isRegistrationEnabled()).resolves.toBe(true);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });

  it("reads the enabled flag from stored values", async () => {
    const service = makeService({
      findByKey: vi.fn().mockImplementation(async (key: string) => {
        if (key === "registration_enabled") {
          return { key, value: { enabled: false } };
        }
        return { key, value: { enabled: true } };
      }),
    });

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(true);
  });

  it("treats malformed values as disabled", async () => {
    const service = makeService({
      findByKey: vi.fn(async (key: string) => ({
        key,
        value: { enabled: "yes" },
      })),
    });

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });

  describe("flag caching (local fallback)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("serves repeated reads from the cache within the TTL", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: true },
      }));
      const service = makeService({ findByKey });

      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      expect(findByKey).toHaveBeenCalledTimes(1);
    });

    it("refetches after the TTL expires", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: false },
      }));
      const service = makeService({ findByKey });

      await service.isMaintenanceMode();
      vi.advanceTimersByTime(5_001);
      await service.isMaintenanceMode();

      expect(findByKey).toHaveBeenCalledTimes(2);
    });

    it("refetches immediately after invalidate", async () => {
      const findByKey = vi
        .fn()
        .mockResolvedValueOnce({ key: "maintenance_mode", value: { enabled: false } })
        .mockResolvedValueOnce({ key: "maintenance_mode", value: { enabled: true } });
      const service = makeService({ findByKey });

      await expect(service.isMaintenanceMode()).resolves.toBe(false);
      await service.invalidate("maintenance_mode");
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      expect(findByKey).toHaveBeenCalledTimes(2);
    });

    it("uses the configured TTL when set", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: true },
      }));
      const service = makeService({ findByKey }, { settingsLookupCacheTtlSeconds: 30 });

      await service.isMaintenanceMode();
      vi.advanceTimersByTime(29_999);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      expect(findByKey).toHaveBeenCalledTimes(1);
    });
  });
});
