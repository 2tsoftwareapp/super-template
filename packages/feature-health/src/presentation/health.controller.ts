import { Controller, Get } from "@nestjs/common";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import { HealthCheckService } from "@nestjs/terminus";
import { ApiDataResponse, Public } from "@repo/api-runtime";

import { HealthWarningsService } from "../application/health-warnings.service";
import { AppHealthIndicator, DatabaseHealthIndicator } from "../application/health.indicators";

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
    private readonly healthWarningsService: HealthWarningsService,
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
    // Readiness requires both the process and the database to be available.
    await this.health.check([
      () => this.appHealthIndicator.isHealthy("app"),
      () => this.databaseHealthIndicator.isHealthy("database"),
    ]);
    return {
      data: {
        status: "ready" as const,
        warnings: this.healthWarningsService.collect(),
      },
    };
  }
}
