import { Injectable, Logger } from "@nestjs/common";
import { z } from "zod";

import { EnvironmentService } from "../config/environment";
import { adaptRedisClient, createRedisClient } from "../redis/redis-client.adapter";

export interface AccessProfileSnapshot {
  permissions: string[];
  roles: string[];
}

const AccessProfileSnapshotSchema = z.object({
  permissions: z.array(z.string()),
  roles: z.array(z.string()),
});

interface RedisCacheClient {
  connect: () => Promise<void>;
  del: (key: string | string[]) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  on: (event: "error", listener: (error: Error) => void) => void;
  quit: () => Promise<void>;
  set: (key: string, value: string, options: { EX: number }) => Promise<"OK" | null>;
}

interface LocalCacheEntry {
  expiresAt: number;
  profile: AccessProfileSnapshot;
}

const CACHE_KEY_PREFIX = "access-profile:";
const DEFAULT_TTL_SECONDS = 60;

function cacheKey(userId: string): string {
  return `${CACHE_KEY_PREFIX}${userId}`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseAccessProfileSnapshot(cached: string): AccessProfileSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(cached);
    const result = AccessProfileSnapshotSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

@Injectable()
export class AccessProfileCache {
  private readonly logger = new Logger(AccessProfileCache.name);
  private readonly localEntries = new Map<string, LocalCacheEntry>();
  private redisClient: RedisCacheClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(private readonly environmentService: EnvironmentService) {}

  async get(userId: string): Promise<AccessProfileSnapshot | null> {
    const redis = await this.ensureRedis();

    if (redis) {
      try {
        const cached = await redis.get(cacheKey(userId));

        if (!cached) {
          return null;
        }

        const profile = parseAccessProfileSnapshot(cached);

        if (!profile) {
          await redis.del(cacheKey(userId));
          return null;
        }

        return profile;
      } catch (error) {
        // A transient Redis failure must not break authorization; treat it as a
        // cache miss so the caller recomputes the profile from the source of truth.
        this.logger.warn(
          `Redis get failed for access profile; treating as cache miss: ${errorMessage(error)}`,
        );
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
      try {
        await redis.set(cacheKey(userId), JSON.stringify(profile), {
          EX: ttlSeconds,
        });
      } catch (error) {
        this.logger.warn(`Redis set failed for access profile: ${errorMessage(error)}`);
      }
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
      try {
        await redis.del(cacheKey(userId));
      } catch (error) {
        this.logger.warn(`Redis invalidate failed for access profile: ${errorMessage(error)}`);
      }
      return;
    }

    this.localEntries.delete(userId);
  }

  async invalidateUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      return;
    }

    const redis = await this.ensureRedis();

    if (redis) {
      try {
        // Single round-trip instead of one DEL per user.
        await redis.del(userIds.map(cacheKey));
      } catch (error) {
        this.logger.warn(
          `Redis batch invalidate failed for access profiles: ${errorMessage(error)}`,
        );
      }
      return;
    }

    for (const userId of userIds) {
      this.localEntries.delete(userId);
    }
  }

  private resolveTtlSeconds(): number {
    const configured = this.environmentService.accessProfileCacheTtlSeconds;

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_TTL_SECONDS;
    }

    return configured;
  }

  private async ensureRedis(): Promise<RedisCacheClient | null> {
    if (this.environmentService.appEnv === "test") {
      return null;
    }

    if (this.redisReady) {
      await this.redisReady;
      return this.redisClient;
    }

    const redisUrl = this.environmentService.redisUrl;

    if (!redisUrl) {
      this.redisReady = Promise.resolve();
      return this.redisClient;
    }

    this.redisReady = (async () => {
      const client = adaptRedisClient<RedisCacheClient>(createRedisClient(redisUrl));

      client.on("error", (error) => {
        // node-redis reconnects internally, so log the blip rather than discarding
        // a self-healing client (which previously stranded the instance on the
        // local cache forever and silently broke cross-instance invalidation).
        this.logger.warn(`Redis client error for access-profile cache: ${error.message}`);
      });

      try {
        await client.connect();
        this.redisClient = client;
      } catch (error) {
        // Clear redisReady so the next access retries the connection instead of
        // being stuck on the in-process fallback until the process restarts.
        this.logger.warn(
          `Redis connect failed for access-profile cache; using in-process fallback: ${errorMessage(error)}`,
        );
        this.redisClient = null;
        this.redisReady = null;
      }
    })();

    await this.redisReady;
    return this.redisClient;
  }
}
