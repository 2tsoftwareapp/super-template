import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-core";

const MISSING_REDIS_URL_WARNING =
  "REDIS_URL is not configured in production: shared throttling and the settings-flag cache (maintenance mode, registration enabled) fall back to in-process memory. Rate limits are per-instance and toggles do not propagate across API instances.";

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
