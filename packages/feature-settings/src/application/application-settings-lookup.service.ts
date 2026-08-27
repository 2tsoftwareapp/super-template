import { Inject, Injectable, Logger } from "@nestjs/common";
import { adaptRedisClient, createRedisClient, EnvironmentService, isJsonObject, type JsonObject } from "@repo/api-runtime";
import { type ApplicationSettingsLookup } from "@repo/feature-settings/contracts";

import { SETTINGS_REPOSITORY, type SettingsRepositoryPort } from "./ports/settings.repository.port";

const REGISTRATION_ENABLED_KEY = "registration_enabled";
const MAINTENANCE_MODE_KEY = "maintenance_mode";

const CACHE_KEY_PREFIX = "settings-flag:";
const DEFAULT_TTL_SECONDS = 5;

function cacheKey(key: string): string {
  return `${CACHE_KEY_PREFIX}${key}`;
}

function readEnabledFlag(value: JsonObject | undefined): boolean {
  const enabled = value?.enabled;

  return typeof enabled === "boolean" ? enabled : false;
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
 * api-core port instead of the settings repository directly.
 *
 * Flag values are cached briefly (default 5s) so the global MaintenanceModeGuard
 * does not hit the DB on every request. With Redis configured the cache is
 * shared across instances: reads hit Redis and UpdateSettingUseCase deletes the
 * key on write, so an admin toggle propagates to every replica immediately.
 * Without Redis it falls back to in-process memory (single-instance / test).
 */
@Injectable()
export class ApplicationSettingsLookupService implements ApplicationSettingsLookup {
  private readonly logger = new Logger(ApplicationSettingsLookupService.name);
  private readonly localEntries = new Map<string, LocalCacheEntry>();
  private redisClient: RedisCacheClient | null = null;
  private redisReady: Promise<void> | null = null;

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepositoryPort,
    private readonly environmentService: EnvironmentService,
  ) {}

  async isRegistrationEnabled(): Promise<boolean> {
    // Absent setting means the seed has not run: keep the default permissive.
    return this.readFlag(REGISTRATION_ENABLED_KEY, true);
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.readFlag(MAINTENANCE_MODE_KEY, false);
  }

  /**
   * Drop the cached flag for a setting key so the next read hits the store.
   * With Redis, deleting the key also clears the entry on every other instance,
   * so toggles take effect across all replicas immediately.
   */
  async invalidate(key: string): Promise<void> {
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

  private async readFlag(key: string, defaultValue: boolean): Promise<boolean> {
    const cached = await this.readCache(key);

    if (cached !== null) {
      return cached;
    }

    const setting = await this.settingsRepository.findByKey(key);
    const value = setting
      ? readEnabledFlag(isJsonObject(setting.value) ? setting.value : undefined)
      : defaultValue;

    await this.writeCache(key, value);
    return value;
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
