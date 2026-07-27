import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '../../../config/environment.service';

// Controllable fake redis client shared with the mocked adapter module.
const { connectMock, getMock, setMock, delMock, onMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  getMock: vi.fn(),
  setMock: vi.fn(),
  delMock: vi.fn(),
  onMock: vi.fn(),
}));

vi.mock('../../redis/redis-client.adapter', () => ({
  createRedisClient: () => ({}),
  adaptRedisClient: () => ({
    connect: connectMock,
    get: getMock,
    set: setMock,
    del: delMock,
    on: onMock,
    quit: vi.fn(),
  }),
}));

import { AccessProfileCache } from '../access-profile.cache';

function redisEnv(): EnvironmentService {
  return {
    redisUrl: 'redis://localhost:6379',
    accessProfileCacheTtlSeconds: 60,
  } as unknown as EnvironmentService;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('AccessProfileCache (redis path resilience)', () => {
  it('falls back to a cache miss when the redis connection fails', async () => {
    connectMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get('user-1')).resolves.toBeNull();
  });

  it('retries the connection on a later call after an initial failure', async () => {
    connectMock
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(undefined);
    getMock.mockResolvedValue(null);
    const cache = new AccessProfileCache(redisEnv());

    await cache.get('user-1'); // first attempt fails → fallback
    await cache.get('user-1'); // second attempt reconnects

    expect(connectMock).toHaveBeenCalledTimes(2);
  });

  it('reads and parses a cached profile from redis', async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockResolvedValue(
      JSON.stringify({ roles: ['ADMIN'], permissions: ['users.read'] }),
    );
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get('user-1')).resolves.toEqual({
      roles: ['ADMIN'],
      permissions: ['users.read'],
    });
  });

  it('treats a transient redis get error as a cache miss instead of throwing', async () => {
    connectMock.mockResolvedValue(undefined);
    getMock.mockRejectedValue(new Error('connection lost'));
    const cache = new AccessProfileCache(redisEnv());

    await expect(cache.get('user-1')).resolves.toBeNull();
  });

  it('invalidates multiple users in a single redis call', async () => {
    connectMock.mockResolvedValue(undefined);
    delMock.mockResolvedValue(2);
    const cache = new AccessProfileCache(redisEnv());

    await cache.invalidateUsers(['user-1', 'user-2']);

    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock).toHaveBeenCalledWith([
      'access-profile:user-1',
      'access-profile:user-2',
    ]);
  });
});
