import { describe, expect, it, vi } from 'vitest';

import type { EnvironmentService } from '@repo/api-core';

import { logStartupWarnings } from '../../src/shell/startup-warnings';

function makeEnv(
  overrides: Partial<EnvironmentService> = {},
): EnvironmentService {
  return {
    isProduction: false,
    redisUrl: undefined,
    ...overrides,
  } as unknown as EnvironmentService;
}

describe('logStartupWarnings', () => {
  it('does not warn outside production', () => {
    const warn = vi.fn();
    logStartupWarnings(
      makeEnv({ isProduction: false, redisUrl: undefined }),
      { warn },
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when production has no REDIS_URL', () => {
    const warn = vi.fn();
    logStartupWarnings(
      makeEnv({ isProduction: true, redisUrl: undefined }),
      { warn },
    );

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('REDIS_URL');
  });

  it('stays silent when production has REDIS_URL configured', () => {
    const warn = vi.fn();
    logStartupWarnings(
      makeEnv({ isProduction: true, redisUrl: 'redis://localhost:6379' }),
      { warn },
    );

    expect(warn).not.toHaveBeenCalled();
  });
});
