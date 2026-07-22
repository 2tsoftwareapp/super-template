import { describe, expect, it } from 'vitest';

import {
  REFRESH_ROTATION_GRACE_MS,
  resolveRefreshAttempt,
} from '../refresh-rotation.policy';

const now = new Date('2026-07-12T00:00:00Z');

describe('resolveRefreshAttempt', () => {
  it('rotates normally when the token matches the current hash', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: true,
        matchesPrevious: false,
        previousRotatedAt: null,
        now,
      }),
    ).toEqual({ action: 'rotate' });
  });

  it('grace-rotates when the token is the previous one within the window', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() - 5_000),
        now,
      }),
    ).toEqual({ action: 'grace-rotate' });
  });

  it('accepts the previous token exactly at the grace boundary', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() - REFRESH_ROTATION_GRACE_MS),
        now,
      }),
    ).toEqual({ action: 'grace-rotate' });
  });

  it('flags reuse when the previous token is past the grace window', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(
          now.getTime() - REFRESH_ROTATION_GRACE_MS - 1,
        ),
        now,
      }),
    ).toEqual({ action: 'reuse' });
  });

  it('flags reuse when the previous token matches but rotation time is unknown', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: null,
        now,
      }),
    ).toEqual({ action: 'reuse' });
  });

  it('flags reuse when the token matches nothing', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: false,
        previousRotatedAt: new Date(now.getTime() - 1_000),
        now,
      }),
    ).toEqual({ action: 'reuse' });
  });

  it('flags reuse for a previousRotatedAt in the future (clock skew safety)', () => {
    expect(
      resolveRefreshAttempt({
        matchesCurrent: false,
        matchesPrevious: true,
        previousRotatedAt: new Date(now.getTime() + 10_000),
        now,
      }),
    ).toEqual({ action: 'reuse' });
  });
});
