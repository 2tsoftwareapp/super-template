import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-runtime";

const MISSING_REDIS_URL_WARNING =
  "Production configuration requires REDIS_URL for shared throttling and the settings-flag cache (maintenance mode, registration enabled).";

/**
 * Collects operational warnings that should be surfaced to monitoring (health
 * endpoints) and operators (startup log). Kept as a single source of truth so
 * the message and the production gate live in one place.
 */
@Injectable()
export class HealthWarningsService {
  constructor(private readonly environmentService: EnvironmentService) {}

  collect(): string[] {
    const warnings: string[] = [];

    if (this.environmentService.isProduction && !this.environmentService.redisUrl) {
      warnings.push(MISSING_REDIS_URL_WARNING);
    }

    return warnings;
  }
}
