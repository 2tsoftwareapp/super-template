import { Inject, Injectable, Logger } from "@nestjs/common";
import { isJsonObject } from "@repo/api-kernel";
import { adaptRedisClient, createRedisClient, EnvironmentService } from "@repo/api-runtime";
import { type ApplicationSettingsLookup } from "@repo/feature-settings/contracts";

import { SETTINGS_REPOSITORY, type SettingsRepositoryPort } from "./ports/settings.repository.port";
import { SETTING_DEFINITIONS, type SettingDefinition } from "./setting-definitions";

const CACHE_KEY_PREFIX = "settings-flag:";
const DEFAULT_TTL_SECONDS = 5;

function cacheKey(key: string): string {
  return `${CACHE_KEY_PREFIX}${key}`;
}

interface RedisCacheClient {
  connect: () => Promise<void>;
  del: (key: string) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  on: (event: "error", listener: (error: Error) => void) => void;
  set: (key: string, value: string, options: { EX: number }) => Promise<"OK" | null>;
}

interface LocalCacheEntry {
  value: boolean;
  expiresAt: number;
}

/**
 * Adapter implementing the APPLICATION_SETTINGS_LOOKUP port for the platform
 * settings store. Consumers that only need to enforce toggles depend on the
 * api-kernel port instead of the settings repository directly.
 *
 * Maintenance mode is answered straight from the store: it is a kill-switch, so
 * a cached `false` would keep letting traffic through for the rest of the TTL
 * after an operator enabled it, and no cache-aside scheme can rule that out
 * without extra infrastructure (a reader that loaded the pre-commit row can
 * always write it back after the writer's delete, on any replica).
 *
 * The remaining flags are cached briefly (default 5s) so callers do not hit the
 * DB on every check. With Redis configured the cache is shared across
 * instances: reads hit Redis and UpdateSettingUseCase deletes the key around
 * the commit, so a toggle propagates to every replica. Without Redis it falls
 * back to in-process memory (single-instance / test). A read that overlapped an
 * invalidation is never written to the cache — see readFlag().
 */
@Injectable()
export class ApplicationSettingsLookupService implements ApplicationSettingsLookup {
  private readonly logger = new Logger(ApplicationSettingsLookupService.name);
  private readonly localEntries = new Map<string, LocalCacheEntry>();
  /**
   * Per-key counter bumped on every invalidation. A read captures it before
   * touching the store and only caches its result when the counter is unchanged,
   * so a value read before the write committed cannot be written back into the
   * cache afterwards.
   */
  private readonly invalidationEpochs = new Map<string, number>();
  private redisClient: RedisCacheClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  async isRegistrationEnabled(): Promise<boolean> {
    // Absent setting means the seed has not run: keep the default permissive.
    return this.readFlag(SETTING_DEFINITIONS.registration_enabled);
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.readStoreFlag(SETTING_DEFINITIONS.maintenance_mode);
  }

  /**
   * Drop the cached flag for a setting key so the next read hits the store.
   * With Redis, deleting the key also clears the entry on every other instance,
   * so toggles take effect across all replicas immediately.
   *
   * Never throws: a failing cache must not fail the write it is invalidating.
   */
  async invalidate(key: string): Promise<void> {
    this.invalidationEpochs.set(key, this.invalidationEpoch(key) + 1);

    const redis = await this.ensureRedis();

    if (redis) {
      try {
        await redis.del(cacheKey(key));
      } catch (error) {
        this.logger.warn(
          `Redis settings-flag invalidate failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return;
    }

    this.localEntries.delete(key);
  }

  private async readFlag(definition: SettingDefinition): Promise<boolean> {
    const cached = await this.readCache(definition.key);

    if (cached !== null) {
      return cached;
    }

    const epochBeforeRead = this.invalidationEpoch(definition.key);
    const value = await this.readStoreFlag(definition);

    // The read overlapped an invalidation: another writer committed a different
    // value while this one was in flight, so caching the value read here would
    // resurrect the state the write replaced.
    if (this.invalidationEpoch(definition.key) === epochBeforeRead) {
      await this.writeCache(definition.key, value);
    }

    return value;
  }

  private async readStoreFlag(definition: SettingDefinition): Promise<boolean> {
    const setting = await this.settingsRepository.findByKey(definition.key);

    // The registry owns both the fallback (its seeded default) and the read
    // interpretation, so lookups and the seeder share one definition per key.
    return definition.parse(
      setting ? (isJsonObject(setting.value) ? setting.value : undefined) : definition.defaultValue,
    );
  }

  private invalidationEpoch(key: string): number {
    return this.invalidationEpochs.get(key) ?? 0;
  }

  private async readCache(key: string): Promise<boolean | null> {
    const redis = await this.ensureRedis();

    if (redis) {
      try {
        const raw = await redis.get(cacheKey(key));

        if (raw === "true") {
          return true;
        }

        if (raw === "false") {
          return false;
        }

        return null;
      } catch (error) {
        // A transient Redis failure must not break request handling; treat it
        // as a cache miss so the flag is read from the source of truth.
        this.logger.warn(
          `Redis settings-flag get failed; treating as miss: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    }

    const entry = this.localEntries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.localEntries.delete(key);
      return null;
    }

    return entry.value;
  }

  private async writeCache(key: string, value: boolean): Promise<void> {
    const redis = await this.ensureRedis();

    if (redis) {
      try {
        await redis.set(cacheKey(key), String(value), {
          EX: this.resolveTtlSeconds(),
        });
      } catch (error) {
        this.logger.warn(
          `Redis settings-flag set failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      return;
    }

    this.localEntries.set(key, {
      value,
      expiresAt: Date.now() + this.resolveTtlSeconds() * 1000,
    });
  }

  private resolveTtlSeconds(): number {
    const configured = this.environmentService.settingsLookupCacheTtlSeconds;

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
        // node-redis reconnects internally, so log the blip rather than
        // discarding a self-healing client (which previously stranded the
        // instance on the in-process cache and silently broke cross-instance
        // invalidation).
        this.logger.warn(`Redis client error for settings-flag cache: ${error.message}`);
      });

      try {
        await client.connect();
        this.redisClient = client;
      } catch (error) {
        // Clear redisReady so the next access retries the connection instead of
        // being stuck on the in-process fallback until the process restarts.
        this.logger.warn(
          `Redis connect failed for settings-flag cache; using in-process fallback: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.redisClient = null;
        this.redisReady = null;
      }
    })();

    await this.redisReady;
    return this.redisClient;
  }
}
