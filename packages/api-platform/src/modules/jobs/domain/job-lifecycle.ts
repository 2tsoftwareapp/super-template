// Pure domain rules for the job lifecycle. No NestJS, no Drizzle — this layer
// must stay framework-free (enforced by scripts/check-source-policy.sh).

import type { JobStatus } from '../application/jobs.types';

/** Statuses a job can never leave. */
const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

/** Only jobs that have not started may be cancelled by a user. */
const CANCELLABLE_STATUSES: ReadonlySet<JobStatus> = new Set(['PENDING']);

/** Fixed retry backoff between failed attempts. */
export const RETRY_DELAY_MS = 60_000;

export const isTerminalStatus = (status: JobStatus): boolean =>
  TERMINAL_STATUSES.has(status);

export const isCancellableStatus = (status: JobStatus): boolean =>
  CANCELLABLE_STATUSES.has(status);

export type FailureOutcome =
  | { action: 'retry'; retryAt: Date }
  | { action: 'fail' };

/**
 * Decide what happens after a failed attempt: retry while attempts remain
 * (fixed backoff), otherwise mark the job failed permanently.
 */
export const resolveFailureOutcome = (input: {
  attempts: number;
  maxAttempts: number;
  now?: Date;
}): FailureOutcome => {
  if (input.attempts < input.maxAttempts) {
    const base = input.now?.getTime() ?? Date.now();
    return { action: 'retry', retryAt: new Date(base + RETRY_DELAY_MS) };
  }

  return { action: 'fail' };
};
