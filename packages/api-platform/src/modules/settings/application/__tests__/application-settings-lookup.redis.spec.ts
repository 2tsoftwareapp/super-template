import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '@repo/api-core';

// Controllable fake redis client shared with the mocked adapter module.
const { connectMock, getMock, setMock, delMock, onMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
  onMock: vi.fn(),
}));

vi.mock('@repo/api-core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@repo/api-core')>();
  return {
    ...actual,
    createRedisClient: () => ({}),
    adaptRedisClient: () => ({
      connect: connectMock,
      get: getMock,
      set: setMock,
      del: delMock,
      on: onMock,
    }),
  };
});

import { ApplicationSettingsLookupService } from '../application-settings-lookup.service';

function redisEnv(): EnvironmentService {
  return {
    appEnv: 'development',
    redisUrl: 'redis://localhost:6379',
    settingsLookupCacheTtlSeconds: 5,
  } as unknown as EnvironmentService;
}

function makeService(): ApplicationSettingsLookupService {
  const settingsRepository = {
    findByKey: vi.fn(async (key: string) => ({ key, value: { enabled: true } })),
  };

  return new ApplicationSettingsLookupService(
    settingsRepository as never,
    redisEnv(),
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ApplicationSettingsLookupService (redis path)', () => {
  it('serves a flag from the shared redis cache', async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue('true');
    const service = makeService();

    await expect(service.isMaintenanceMode()).resolves.toBe(true);

    expect(getMock).toHaveBeenCalledWith('settings-flag:maintenance_mode');
  });

  it('writes the fetched flag to redis with the TTL on a miss', async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(null);
    const service = makeService();

    await expect(service.isMaintenanceMode()).resolves.toBe(true);

    expect(setMock).toHaveBeenCalledWith('settings-flag:maintenance_mode', 'true', {
      EX: 5,
    });
  });

  it('invalidates the key in redis so other instances refetch', async () => {
    connectMock.mockResolvedValue(undefined);
    delMock.mockResolvedValue(1);
    const service = makeService();

    await service.invalidate('maintenance_mode');

    expect(delMock).toHaveBeenCalledWith('settings-flag:maintenance_mode');
  });

  it('treats a transient redis get error as a cache miss instead of throwing', async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockRejectedValue(new Error('connection lost'));
    const service = makeService();

    await expect(service.isMaintenanceMode()).resolves.toBe(true);
  });

  it('falls back to the in-process cache when the redis connection fails', async () => {
    connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const service = makeService();

    // First read: connect fails → local fallback, value cached locally.
    await expect(service.isMaintenanceMode()).resolves.toBe(true);
    // Second read: connect is retried, succeeds this time.
    connectMock.mockResolvedValueOnce(undefined);
    getMock.mockResolvedValue('false');

    await expect(service.isMaintenanceMode()).resolves.toBe(false);

    expect(connectMock).toHaveBeenCalledTimes(2);
  });
});
