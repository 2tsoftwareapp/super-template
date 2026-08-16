import { describe, expect, it } from 'vitest';

import type { EnvironmentService } from '@repo/api-core';

import { HealthWarningsService } from '../health-warnings.service';

function makeEnv(
  overrides: Partial<EnvironmentService> = {},
): EnvironmentService {
  return {
    isProduction: false,
    redisUrl: undefined,
    ...overrides,
  } as unknown as EnvironmentService;
}

describe('HealthWarningsService', () => {
  it('returns no warnings outside production', () => {
    const service = new HealthWarningsService(
      makeEnv({ isProduction: false, redisUrl: undefined }),
    );

    expect(service.collect()).toEqual([]);
  });

  it('flags missing REDIS_URL in production', () => {
    const service = new HealthWarningsService(
      makeEnv({ isProduction: true, redisUrl: undefined }),
    );

    const warnings = service.collect();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('REDIS_URL');
  });

  it('stays silent when production has REDIS_URL configured', () => {
    const service = new HealthWarningsService(
      makeEnv({ isProduction: true, redisUrl: 'redis://localhost:6379' }),
    );

    expect(service.collect()).toEqual([]);
  });
});
