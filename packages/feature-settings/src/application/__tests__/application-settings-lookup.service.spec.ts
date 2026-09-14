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

  describe("maintenance mode (kill-switch)", () => {
    it("reads the store on every call so a toggle is never served from the cache", async () => {
      const findByKey = vi
        .fn()
        .mockResolvedValueOnce({ key: "maintenance_mode", value: { enabled: false } })
        .mockResolvedValueOnce({ key: "maintenance_mode", value: { enabled: true } });
      const service = makeService({ findByKey });

      await expect(service.isMaintenanceMode()).resolves.toBe(false);
      // No invalidate in between: an operator enabling maintenance must be
      // honoured on the very next request, not after the cache TTL.
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      expect(findByKey).toHaveBeenCalledTimes(2);
    });

    it("re-reads the flag even when a long cache TTL is configured", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: key === "maintenance_mode" },
      }));
      const service = makeService({ findByKey }, { settingsLookupCacheTtlSeconds: 300 });

      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      await expect(service.isRegistrationEnabled()).resolves.toBe(false);
      await expect(service.isRegistrationEnabled()).resolves.toBe(false);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      // Registration is served from the cache, maintenance is not.
      expect(findByKey).toHaveBeenCalledTimes(3);
    });
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

      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
      await expect(service.isRegistrationEnabled()).resolves.toBe(true);

      expect(findByKey).toHaveBeenCalledTimes(1);
    });

    it("refetches after the TTL expires", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: false },
      }));
      const service = makeService({ findByKey });

      await service.isRegistrationEnabled();
      vi.advanceTimersByTime(5_001);
      await service.isRegistrationEnabled();

      expect(findByKey).toHaveBeenCalledTimes(2);
    });

    it("refetches immediately after invalidate", async () => {
      const findByKey = vi
        .fn()
        .mockResolvedValueOnce({ key: "registration_enabled", value: { enabled: false } })
        .mockResolvedValueOnce({ key: "registration_enabled", value: { enabled: true } });
      const service = makeService({ findByKey });

      await expect(service.isRegistrationEnabled()).resolves.toBe(false);
      await service.invalidate("registration_enabled");
      await expect(service.isRegistrationEnabled()).resolves.toBe(true);

      expect(findByKey).toHaveBeenCalledTimes(2);
    });

    it("uses the configured TTL when set", async () => {
      const findByKey = vi.fn(async (key: string) => ({
        key,
        value: { enabled: true },
      }));
      const service = makeService({ findByKey }, { settingsLookupCacheTtlSeconds: 30 });

      await service.isRegistrationEnabled();
      vi.advanceTimersByTime(29_999);
      await expect(service.isRegistrationEnabled()).resolves.toBe(true);
      expect(findByKey).toHaveBeenCalledTimes(1);
    });
  });

  it("does not cache a value read while an invalidate was in flight", async () => {
    let resolveRead: ((value: unknown) => void) | undefined;
    const findByKey = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    );
    const service = makeService({ findByKey });

    const inFlight = service.isRegistrationEnabled();

    // Let the read reach the store before the writer clears the cache.
    await vi.waitFor(() => {
      expect(findByKey).toHaveBeenCalledTimes(1);
    });
    await service.invalidate("registration_enabled");
    resolveRead?.({ key: "registration_enabled", value: { enabled: true } });
    await expect(inFlight).resolves.toBe(true);

    // The overlapping read must not have cached the pre-invalidation value: the
    // next read goes back to the store instead of serving `true` for the TTL.
    findByKey.mockResolvedValue({ key: "registration_enabled", value: { enabled: false } });
    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    expect(findByKey).toHaveBeenCalledTimes(2);
  });

  it("caches the value again once no invalidation overlaps the read", async () => {
    const findByKey = vi.fn(async (key: string) => ({ key, value: { enabled: true } }));
    const service = makeService({ findByKey });

    await service.invalidate("registration_enabled");
    await service.isRegistrationEnabled();
    await service.isRegistrationEnabled();

    expect(findByKey).toHaveBeenCalledTimes(1);
  });
});
