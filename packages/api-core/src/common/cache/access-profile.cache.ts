import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

import { EnvironmentService } from '../../config/environment.service';

export interface AccessProfileSnapshot {
  permissions: string[];
  roles: string[];
}

interface RedisCacheClient {
  connect: () => Promise<void>;
  del: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  on: (event: 'error', listener: (error: Error) => void) => void;
  quit: () => Promise<void>;
  set: (
    key: string,
    value: string,
    options: { EX: number },
  ) => Promise<'OK' | null>;
}

interface LocalCacheEntry {
  expiresAt: number;
  profile: AccessProfileSnapshot;
}

const CACHE_KEY_PREFIX = 'access-profile:';
const DEFAULT_TTL_SECONDS = 60;

function cacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

@Injectable()
export class AccessProfileCache {
  private readonly localEntries = new Map<string, LocalCacheEntry>();
  private redisClient: RedisCacheClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(private readonly environmentService: EnvironmentService) {}

  async get(userId: string): Promise<AccessProfileSnapshot | null> {
    const redis = await this.ensureRedis();

    if (redis) {
      const cached = await redis.get(cacheKey(userId));

      if (!cached) {
        return null;
      }

      try {
        return JSON.parse(cached) as AccessProfileSnapshot;
      } catch {
        await redis.del(cacheKey(userId));
        return null;
      }
    }

    const entry = this.localEntries.get(userId);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.localEntries.delete(userId);
      return null;
    }

    return entry.profile;
  }

  async set(userId: string, profile: AccessProfileSnapshot): Promise<void> {
    const redis = await this.ensureRedis();
    const ttlSeconds = this.resolveTtlSeconds();

    if (redis) {
      await redis.set(cacheKey(userId), JSON.stringify(profile), {
        EX: ttlSeconds,
      });
      return;
    }

    this.localEntries.set(userId, {
      profile,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async invalidateUser(userId: string): Promise<void> {
    const redis = await this.ensureRedis();

    if (redis) {
      await redis.del(cacheKey(userId));
      return;
    }

    this.localEntries.delete(userId);
  }

  async invalidateUsers(userIds: string[]): Promise<void> {
    await Promise.all(userIds.map((userId) => this.invalidateUser(userId)));
  }

  private resolveTtlSeconds(): number {
    const configured = this.environmentService.values.ACCESS_PROFILE_CACHE_TTL_SECONDS;

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_TTL_SECONDS;
    }

    return configured;
  }

  private async ensureRedis(): Promise<RedisCacheClient | null> {
    if (this.redisReady) {
      await this.redisReady;
      return this.redisClient;
    }

    const redisUrl = this.environmentService.values.REDIS_URL;

    if (!redisUrl) {
      this.redisReady = Promise.resolve();
      return this.redisClient;
    }

    this.redisReady = (async () => {
      const client = createClient({ url: redisUrl }) as unknown as RedisCacheClient;

      client.on('error', () => {
        this.redisClient = null;
      });

      try {
        await client.connect();
        this.redisClient = client;
      } catch {
        this.redisClient = null;
      }
    })();

    await this.redisReady;
    return this.redisClient;
  }
}
