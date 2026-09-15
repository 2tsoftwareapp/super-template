import { Injectable } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-runtime";

import {
  MISSING_REDIS_URL_WARNING,
  resolveRedisRequirement,
} from "../domain/redis-readiness.policy";

/**
 * Collects operational warnings that should be surfaced to monitoring (health
 * endpoints) and operators (startup log). The decision — and the message — come
 * from the shared Redis readiness policy, so warnings and /health/ready agree
 * on when production is misconfigured.
 */
@Injectable()
export class HealthWarningsService {
  constructor(private readonly environmentService: EnvironmentService) {}

  collect(): string[] {
    const warnings: string[] = [];

    if (resolveRedisRequirement(this.environmentService) === "required-missing") {
      warnings.push(MISSING_REDIS_URL_WARNING);
    }

    return warnings;
  }
}
