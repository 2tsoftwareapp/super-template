import { Inject, Injectable, Optional } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { createRedisClient, EnvironmentService } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { sql } from "drizzle-orm";

import {
  MISSING_REDIS_URL_WARNING,
  REDIS_URL_NOT_CONFIGURED_REASON,
  resolveRedisRequirement,
} from "../domain/redis-readiness.policy";

interface RedisHealthClient {
  isOpen?: boolean;
  isReady?: boolean;
  connect?: () => Promise<unknown>;
  ping: () => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
}
@Injectable()
export class AppHealthIndicator {
  constructor(private readonly healthIndicatorService: HealthIndicatorService) {}

  isHealthy(key: string) {
    // Liveness is a process-level check: if the app can execute this code path, the process is up.
    return this.healthIndicatorService.check(key).up();
  }
}

@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Readiness uses a cheap database round-trip so orchestrators can keep traffic away until storage is reachable.
      await this.database.execute(sql`select 1`);
      return indicator.up();
    } catch {
      return indicator.down({ reason: "database query failed" });
    }
  }
}

@Injectable()
export class RedisHealthIndicator {
  private client: RedisHealthClient | null = null;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly healthIndicatorService: HealthIndicatorService,
    @Optional() client?: RedisHealthClient,
  ) {
    if (client) {
      this.client = client;
    }
  }

  private async getClient(): Promise<RedisHealthClient | null> {
    if (this.client) {
      if (this.client.isOpen === false && typeof this.client.connect === "function") {
        await this.client.connect();
      }
      return this.client;
    }

    const redisUrl = this.environmentService.redisUrl;
    if (!redisUrl) {
      return null;
    }

    const client = createRedisClient(redisUrl) as unknown as RedisHealthClient;
    if (typeof client.on === "function") {
      client.on("error", () => {
        // node-redis emits error events when disconnected; absorb so process does not crash
      });
    }
    this.client = client;

    if (this.client.isOpen === false && typeof this.client.connect === "function") {
      await this.client.connect();
    } else if (this.client.isOpen === undefined && typeof this.client.connect === "function") {
      await this.client.connect();
    }

    return this.client;
  }

  async isHealthy(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const client = await this.getClient();
      if (!client) {
        // No URL in a non-production environment is normally filtered out of the
        // readiness list; reaching here without a URL means the shared policy
        // required Redis (production misconfiguration), so say which case it is.
        const requirement = resolveRedisRequirement(this.environmentService);

        return indicator.down({
          reason:
            requirement === "required-missing"
              ? `${REDIS_URL_NOT_CONFIGURED_REASON} (required in production) — ${MISSING_REDIS_URL_WARNING}`
              : REDIS_URL_NOT_CONFIGURED_REASON,
        });
      }

      await client.ping();
      return indicator.up();
    } catch {
      this.client = null;
      return indicator.down({ reason: "redis ping failed" });
    }
  }
}
