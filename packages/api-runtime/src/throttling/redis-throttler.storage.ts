import type { ThrottlerStorage } from "@nestjs/throttler";

import type { EnvironmentService } from "../config/environment";

import { adaptRedisClient, createRedisClient } from "../redis/redis-client.adapter";

interface RedisStorageClient {
  connect: () => Promise<void>;
  incr: (key: string) => Promise<number>;
  pExpire: (key: string, ttl: number) => Promise<boolean>;
  pTTL: (key: string) => Promise<number>;
  set: (key: string, value: string, options: { PX: number }) => Promise<"OK" | null>;
  del: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  duplicate: () => RedisStorageClient;
  on: (event: "error", listener: (error: Error) => void) => void;
}

interface LocalBucketState {
  count: number;
  expiresAt: number;
  blockedUntil: number | null;
}

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

function isPositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly localBuckets = new Map<string, LocalBucketState>();
  private redisClient: RedisStorageClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(private readonly environmentService: EnvironmentService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const redis = await this.ensureRedis();

    if (!redis) {
      return this.incrementLocal(key, ttl, limit, blockDuration, throttlerName);
    }

    const bucketKey = this.buildBucketKey(throttlerName, key);
    const blockKey = `${bucketKey}:block`;
    const blockedUntil = await redis.pTTL(blockKey);

    if (isPositiveNumber(blockedUntil)) {
      const hits = await this.readCurrentHits(redis, bucketKey);
      return {
        totalHits: hits,
        timeToExpire: Math.max(0, ttl),
        isBlocked: true,
        timeToBlockExpire: blockedUntil,
      };
    }

    const totalHits = await redis.incr(bucketKey);

    if (totalHits === 1) {
      await redis.pExpire(bucketKey, ttl);
    }

    const timeToExpire = await redis.pTTL(bucketKey);
    const isBlocked = totalHits > limit;

    if (isBlocked) {
      await redis.set(blockKey, "1", { PX: blockDuration });
      await redis.del(bucketKey);
    }

    return {
      totalHits,
      timeToExpire: Math.max(0, timeToExpire),
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }

  private incrementLocal(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ThrottlerStorageRecord {
    const bucketKey = this.buildBucketKey(throttlerName, key);
    const now = Date.now();
    this.evictExpiredLocalBuckets(now);
    const existing = this.localBuckets.get(bucketKey);

    if (existing?.blockedUntil && existing.blockedUntil > now) {
      return {
        totalHits: existing.count,
        timeToExpire: Math.max(0, existing.expiresAt - now),
        isBlocked: true,
        timeToBlockExpire: existing.blockedUntil - now,
      };
    }

    const resetExpired = !existing || existing.expiresAt <= now;
    const count = resetExpired ? 1 : existing.count + 1;
    const expiresAt = resetExpired ? now + ttl : existing.expiresAt;
    const isBlocked = count > limit;
    const blockedUntil = isBlocked ? now + blockDuration : null;

    this.localBuckets.set(bucketKey, {
      count: isBlocked ? 0 : count,
      expiresAt,
      blockedUntil,
    });

    return {
      totalHits: count,
      timeToExpire: Math.max(0, expiresAt - now),
      isBlocked,
      timeToBlockExpire: isBlocked ? blockDuration : 0,
    };
  }

  // Without eviction the fallback Map grows one entry per unique caller key
  // forever (a slow leak when Redis is absent). Sweep opportunistically on
  // increments; buckets are tiny so a full pass stays cheap.
  private lastEvictionAt = 0;

  private evictExpiredLocalBuckets(now: number): void {
    if (now - this.lastEvictionAt < 30_000) {
      return;
    }
    this.lastEvictionAt = now;

    for (const [key, bucket] of this.localBuckets) {
      const blockExpired = !bucket.blockedUntil || bucket.blockedUntil <= now;
      if (bucket.expiresAt <= now && blockExpired) {
        this.localBuckets.delete(key);
      }
    }
  }

  private async ensureRedis() {
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
      const client = adaptRedisClient<RedisStorageClient>(createRedisClient(redisUrl));
      client.on("error", () => void 0);

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

  private async readCurrentHits(client: RedisStorageClient, bucketKey: string): Promise<number> {
    const current = await client.get(bucketKey);

    if (!current) {
      return 0;
    }

    const parsed = Number(current);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private buildBucketKey(throttlerName: string, key: string) {
    return `throttle:${throttlerName}:${key}`;
  }
}
