import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '../../../config/environment.service';

import { RedisThrottlerStorage } from '../redis-throttler.storage';

function createStorage(redisUrl: string | null = null) {
  const environmentService = {
    redisUrl,
  } as unknown as EnvironmentService;

  return new RedisThrottlerStorage(environmentService);
}

describe('RedisThrottlerStorage (local fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-12T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts hits within the window', async () => {
    const storage = createStorage();

    const first = await storage.increment('ip-1', 1_000, 3, 5_000, 'login');
    const second = await storage.increment('ip-1', 1_000, 3, 5_000, 'login');

    expect(first.totalHits).toBe(1);
    expect(first.isBlocked).toBe(false);
    expect(second.totalHits).toBe(2);
  });

  it('blocks once the limit is exceeded and honors the block duration', async () => {
    const storage = createStorage();

    await storage.increment('ip-1', 1_000, 2, 5_000, 'login');
    await storage.increment('ip-1', 1_000, 2, 5_000, 'login');
    const third = await storage.increment('ip-1', 1_000, 2, 5_000, 'login');

    expect(third.isBlocked).toBe(true);
    expect(third.timeToBlockExpire).toBe(5_000);

    // Still blocked mid-window.
    vi.advanceTimersByTime(2_000);
    const whileBlocked = await storage.increment(
      'ip-1',
      1_000,
      2,
      5_000,
      'login',
    );
    expect(whileBlocked.isBlocked).toBe(true);

    // Block expired — counting starts fresh.
    vi.advanceTimersByTime(4_000);
    const afterBlock = await storage.increment(
      'ip-1',
      1_000,
      2,
      5_000,
      'login',
    );
    expect(afterBlock.isBlocked).toBe(false);
    expect(afterBlock.totalHits).toBe(1);
  });

  it('resets the count when the window expires', async () => {
    const storage = createStorage();

    await storage.increment('ip-1', 1_000, 3, 5_000, 'login');
    vi.advanceTimersByTime(1_500);
    const afterWindow = await storage.increment(
      'ip-1',
      1_000,
      3,
      5_000,
      'login',
    );

    expect(afterWindow.totalHits).toBe(1);
  });

  it('isolates buckets by throttler name and key', async () => {
    const storage = createStorage();

    await storage.increment('ip-1', 1_000, 3, 5_000, 'login');
    const otherKey = await storage.increment('ip-2', 1_000, 3, 5_000, 'login');
    const otherThrottler = await storage.increment(
      'ip-1',
      1_000,
      3,
      5_000,
      'signup',
    );

    expect(otherKey.totalHits).toBe(1);
    expect(otherThrottler.totalHits).toBe(1);
  });

  it('evicts expired buckets so the fallback map does not grow forever', async () => {
    const storage = createStorage();
    const buckets = (
      storage as unknown as { localBuckets: Map<string, unknown> }
    ).localBuckets;

    for (let i = 0; i < 50; i++) {
      await storage.increment(`ip-${i}`, 1_000, 3, 1_000, 'login');
    }
    expect(buckets.size).toBe(50);

    // All windows and blocks expired; the next increment past the sweep
    // interval should purge them.
    vi.advanceTimersByTime(31_000);
    await storage.increment('fresh-ip', 1_000, 3, 1_000, 'login');

    expect(buckets.size).toBe(1);
  });
});

describe('RedisThrottlerStorage (redis path)', () => {
  it('uses redis increments and blocks above the limit', async () => {
    const values = new Map<string, { value: number; ttl: number }>();
    const fakeRedis = {
      connect: vi.fn(async () => undefined),
      incr: vi.fn(async (key: string) => {
        const entry = values.get(key) ?? { value: 0, ttl: -1 };
        entry.value += 1;
        values.set(key, entry);
        return entry.value;
      }),
      pExpire: vi.fn(async (key: string, ttl: number) => {
        const entry = values.get(key);
        if (entry) entry.ttl = ttl;
        return true;
      }),
      pTTL: vi.fn(async (key: string) => values.get(key)?.ttl ?? -2),
      set: vi.fn(async (key: string, _v: string, opts: { PX: number }) => {
        values.set(key, { value: 1, ttl: opts.PX });
        return 'OK' as const;
      }),
      del: vi.fn(async (key: string) => (values.delete(key) ? 1 : 0)),
      get: vi.fn(async () => null),
      duplicate: vi.fn(),
      on: vi.fn(),
    };

    const storage = createStorage('redis://localhost:6379');
    // Bypass the real client factory: inject the fake as the ready client.
    (
      storage as unknown as {
        redisClient: unknown;
        redisReady: Promise<void>;
      }
    ).redisClient = fakeRedis;
    (
      storage as unknown as { redisReady: Promise<void> }
    ).redisReady = Promise.resolve();

    const first = await storage.increment('ip-9', 1_000, 2, 5_000, 'login');
    await storage.increment('ip-9', 1_000, 2, 5_000, 'login');
    const third = await storage.increment('ip-9', 1_000, 2, 5_000, 'login');

    expect(first.totalHits).toBe(1);
    expect(fakeRedis.pExpire).toHaveBeenCalledTimes(1);
    expect(third.isBlocked).toBe(true);
    // Block marker written and the counting bucket dropped.
    expect(fakeRedis.set).toHaveBeenCalledWith(
      expect.stringContaining(':block'),
      '1',
      { PX: 5_000 },
    );
    expect(fakeRedis.del).toHaveBeenCalled();

    // Subsequent hit while blocked short-circuits on the block TTL.
    const blocked = await storage.increment('ip-9', 1_000, 2, 5_000, 'login');
    expect(blocked.isBlocked).toBe(true);
  });
});
