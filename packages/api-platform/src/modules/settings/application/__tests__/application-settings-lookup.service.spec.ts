import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApplicationSettingsLookupService } from '../application-settings-lookup.service';

describe('ApplicationSettingsLookupService', () => {
  it('defaults registration to enabled when the setting row is missing', async () => {
    const settingsRepository = {
      findByKey: vi.fn(async () => null),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(true);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });

  it('reads the enabled flag from stored values', async () => {
    const settingsRepository = {
      findByKey: vi
        .fn()
        .mockImplementation(async (key: string) => {
          if (key === 'registration_enabled') {
            return { key, value: { enabled: false } };
          }
          return { key, value: { enabled: true } };
        }),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(true);
  });

  it('treats malformed values as disabled', async () => {
    const settingsRepository = {
      findByKey: vi.fn(async (key: string) => ({
        key,
        value: { enabled: 'yes' },
      })),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });

  describe('flag caching', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('serves repeated reads from the cache within the TTL', async () => {
      const settingsRepository = {
        findByKey: vi.fn(async (key: string) => ({ key, value: { enabled: true } })),
      };
      const service = new ApplicationSettingsLookupService(
        settingsRepository as never,
      );

      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      expect(settingsRepository.findByKey).toHaveBeenCalledTimes(1);
    });

    it('refetches after the TTL expires', async () => {
      const settingsRepository = {
        findByKey: vi.fn(async (key: string) => ({ key, value: { enabled: false } })),
      };
      const service = new ApplicationSettingsLookupService(
        settingsRepository as never,
      );

      await service.isMaintenanceMode();
      vi.advanceTimersByTime(5_001);
      await service.isMaintenanceMode();

      expect(settingsRepository.findByKey).toHaveBeenCalledTimes(2);
    });

    it('refetches immediately after invalidate', async () => {
      const settingsRepository = {
        findByKey: vi
          .fn()
          .mockResolvedValueOnce({ key: 'maintenance_mode', value: { enabled: false } })
          .mockResolvedValueOnce({ key: 'maintenance_mode', value: { enabled: true } }),
      };
      const service = new ApplicationSettingsLookupService(
        settingsRepository as never,
      );

      await expect(service.isMaintenanceMode()).resolves.toBe(false);
      service.invalidate('maintenance_mode');
      await expect(service.isMaintenanceMode()).resolves.toBe(true);

      expect(settingsRepository.findByKey).toHaveBeenCalledTimes(2);
    });
  });
});
