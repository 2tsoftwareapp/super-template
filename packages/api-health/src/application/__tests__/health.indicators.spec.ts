import { describe, expect, it, vi } from 'vitest';

import {
  AppHealthIndicator,
  DatabaseHealthIndicator,
} from '../health.indicators';

function createIndicator() {
  return {
    down: vi.fn((details?: unknown) => ({ status: 'down', details })),
    up: vi.fn(() => ({ status: 'up' })),
  };
}

describe('health indicators', () => {
  it('marks app liveness as up', () => {
    const indicator = createIndicator();
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = new AppHealthIndicator(healthIndicatorService as never).isHealthy(
      'app',
    );

    expect(healthIndicatorService.check).toHaveBeenCalledWith('app');
    expect(result).toEqual({ status: 'up' });
  });

  it('marks database readiness as up after a successful query', async () => {
    const indicator = createIndicator();
    const database = { execute: vi.fn().mockResolvedValue(undefined) };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = await new DatabaseHealthIndicator(
      database as never,
      healthIndicatorService as never,
    ).isHealthy('database');

    expect(database.execute).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'up' });
  });

  it('marks database readiness as down when the query fails', async () => {
    const indicator = createIndicator();
    const database = { execute: vi.fn().mockRejectedValue(new Error('offline')) };
    const healthIndicatorService = {
      check: vi.fn(() => indicator),
    };

    const result = await new DatabaseHealthIndicator(
      database as never,
      healthIndicatorService as never,
    ).isHealthy('database');

    expect(result).toEqual({
      status: 'down',
      details: { reason: 'database query failed' },
    });
  });
});
