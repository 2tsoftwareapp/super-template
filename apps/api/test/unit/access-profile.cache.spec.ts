import { AccessProfileCache } from '@repo/api-core';
import { describe, expect, it } from 'vitest';

describe('AccessProfileCache', () => {
  it('stores and reads access profiles from the in-memory fallback', async () => {
    const cache = new AccessProfileCache({
      values: {
        REDIS_URL: undefined,
        ACCESS_PROFILE_CACHE_TTL_SECONDS: 30,
      },
    } as never);

    const profile = {
      roles: ['ADMIN'],
      permissions: ['users.read'],
    };

    await cache.set('user-1', profile);
    await expect(cache.get('user-1')).resolves.toEqual(profile);
  });

  it('invalidates cached profiles for a user', async () => {
    const cache = new AccessProfileCache({
      values: {
        REDIS_URL: undefined,
        ACCESS_PROFILE_CACHE_TTL_SECONDS: 30,
      },
    } as never);

    await cache.set('user-1', {
      roles: ['USER'],
      permissions: ['users.read'],
    });

    await cache.invalidateUser('user-1');
    await expect(cache.get('user-1')).resolves.toBeNull();
  });
});
