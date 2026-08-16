import type { EnvironmentService } from '@repo/api-core';

import { Logger } from '@nestjs/common';

const WARN_LOGGER = new Logger('Bootstrap');

/**
 * Log one-time startup diagnostics for deployed environments. Redis backs the
 * shared throttling buckets and the settings-flag cache (maintenance mode,
 * registration enabled); without REDIS_URL each instance silently falls back
 * to in-process memory, so rate limits are per-instance and admin toggles do
 * not propagate across replicas.
 */
export const logStartupWarnings = (
  environmentService: EnvironmentService,
  logger: Pick<Logger, 'warn'> = WARN_LOGGER,
): void => {
  if (!environmentService.isProduction) {
    return;
  }

  if (!environmentService.redisUrl) {
    logger.warn(
      'REDIS_URL is not configured in production: shared throttling and the settings-flag cache (maintenance mode, registration enabled) fall back to in-process memory. Rate limits are per-instance and toggles do not propagate across API instances; set REDIS_URL to enable cross-instance behavior.',
    );
  }
};
