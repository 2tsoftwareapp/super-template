import { describe, expect, it } from 'vitest';

import {
  isCancellableStatus,
  isTerminalStatus,
  resolveFailureOutcome,
  RETRY_DELAY_MS,
} from '../job-lifecycle';

describe('job-lifecycle', () => {
  describe('isTerminalStatus', () => {
    it.each(['COMPLETED', 'CANCELLED', 'FAILED'] as const)(
      'treats %s as terminal',
      (status) => {
        expect(isTerminalStatus(status)).toBe(true);
      },
    );

    it.each(['PENDING', 'PROCESSING'] as const)(
      'treats %s as non-terminal',
      (status) => {
        expect(isTerminalStatus(status)).toBe(false);
      },
    );
  });

  describe('isCancellableStatus', () => {
    it('allows cancelling only pending jobs', () => {
      expect(isCancellableStatus('PENDING')).toBe(true);
      expect(isCancellableStatus('PROCESSING')).toBe(false);
      expect(isCancellableStatus('COMPLETED')).toBe(false);
      expect(isCancellableStatus('CANCELLED')).toBe(false);
      expect(isCancellableStatus('FAILED')).toBe(false);
    });
  });

  describe('resolveFailureOutcome', () => {
    const now = new Date('2026-07-11T00:00:00Z');

    it('retries with fixed backoff while attempts remain', () => {
      const outcome = resolveFailureOutcome({
        attempts: 1,
        maxAttempts: 3,
        now,
      });

      expect(outcome).toEqual({
        action: 'retry',
        retryAt: new Date(now.getTime() + RETRY_DELAY_MS),
      });
    });

    it('fails permanently when attempts are exhausted', () => {
      expect(
        resolveFailureOutcome({ attempts: 3, maxAttempts: 3, now }),
      ).toEqual({ action: 'fail' });
    });

    it('fails permanently when attempts exceed the maximum', () => {
      expect(
        resolveFailureOutcome({ attempts: 5, maxAttempts: 3, now }),
      ).toEqual({ action: 'fail' });
    });
  });
});
