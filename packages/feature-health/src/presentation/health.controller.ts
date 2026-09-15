import { Controller, Get } from "@nestjs/common";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { HealthCheckService } from "@nestjs/terminus";
import { ApiDataResponse, EnvironmentService, Public } from "@repo/api-runtime";

import { HealthWarningsService } from "../application/health-warnings.service";
import {
  AppHealthIndicator,
  DatabaseHealthIndicator,
  RedisHealthIndicator,
} from "../application/health.indicators";
import { resolveRedisRequirement, shouldProbeRedis } from "../domain/redis-readiness.policy";

class HealthStatusDto {
  @ApiProperty({ enum: ["ok", "ready"] })
  status: "ok" | "ready";

  @ApiProperty({
    type: [String],
    required: false,
    description:
      "Operational warnings surfaced for monitoring (e.g. missing REDIS_URL in production).",
  })
  warnings: string[];
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly appHealthIndicator: AppHealthIndicator,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
    private readonly redisHealthIndicator: RedisHealthIndicator,
    private readonly healthWarningsService: HealthWarningsService,
    private readonly environmentService: EnvironmentService,
  ) {}

  @Get()
  @Public()
  @ApiDataResponse(HealthStatusDto)
  async getHealth() {
    // Keep the legacy /health contract stable while delegating the check to Terminus.
    await this.health.check([() => this.appHealthIndicator.isHealthy("app")]);
    return {
      data: {
        status: "ok" as const,
        warnings: this.healthWarningsService.collect(),
      },
    };
  }

  @Get("ready")
  @Public()
  @ApiDataResponse(HealthStatusDto)
  async getReady() {
    // Readiness requires the process, database, and Redis (when configured) to be available.
    const checks = [
      () => this.appHealthIndicator.isHealthy("app"),
      () => this.databaseHealthIndicator.isHealthy("database"),
    ];

    // The shared policy decides, not this controller: Redis is probed whenever
    // it is configured, and in production without REDIS_URL too — there the
    // probe fails with an explicit reason instead of letting a misconfigured
    // deployment report itself ready. Non-production without REDIS_URL is the
    // supported single-instance mode, so the check is skipped.
    if (shouldProbeRedis(resolveRedisRequirement(this.environmentService))) {
      checks.push(() => this.redisHealthIndicator.isHealthy("redis"));
    }

    await this.health.check(checks);
    return {
      data: {
        status: "ready" as const,
        warnings: this.healthWarningsService.collect(),
      },
    };
  }
}
