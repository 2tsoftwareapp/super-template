// Pure domain rules for the job lifecycle. No NestJS, no Drizzle — this layer
// must stay framework-free (enforced by scripts/check-source-policy.sh).

import type { JobStatus } from './job-status';

/** Statuses a job can never leave. */
const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

/** Only jobs that have not started may be cancelled by a user. */
const CANCELLABLE_STATUSES: ReadonlySet<JobStatus> = new Set(['PENDING']);

/** Statuses that block dependent jobs. */
const BLOCKING_STATUSES: ReadonlySet<JobStatus> = new Set([
  'FAILED',
  'CANCELLED',
]);

/** Statuses a PROCESSING job may transition from (prevents stale overwrite). */
const PROCESSING_STATUSES: ReadonlySet<JobStatus> = new Set(['PROCESSING']);

/** Default lease duration for claimed jobs. */
export const LEASE_DURATION_MS = 5 * 60 * 1000;

/** Default handler timeout. */
export const HANDLER_TIMEOUT_MS = 4 * 60 * 1000;

export const isTerminalStatus = (status: JobStatus): boolean =>
  TERMINAL_STATUSES.has(status);

export const isCancellableStatus = (status: JobStatus): boolean =>
  CANCELLABLE_STATUSES.has(status);

export const isBlockingStatus = (status: JobStatus): boolean =>
  BLOCKING_STATUSES.has(status);

export type FailureOutcome =
  | { action: 'retry'; retryAt: Date }
  | { action: 'fail' };

/**
 * Compute exponential backoff with jitter for retry scheduling.
 * base = min(60s × 2^(attempt-1), maxDelay) + random(0, 10s)
 */
export const computeRetryDelay = (attempt: number): number => {
  const exponential = Math.min(60_000 * Math.pow(2, attempt - 1), 3_600_000);
  const jitter = Math.floor(Math.random() * 10_000);
  return exponential + jitter;
};

/**
 * Decide what happens after a failed attempt: retry while attempts remain
 * (exponential backoff + jitter), otherwise mark the job failed permanently.
 */
export const resolveFailureOutcome = (input: {
  attempts: number;
  maxAttempts: number;
  now?: Date;
}): FailureOutcome => {
  if (input.attempts < input.maxAttempts) {
    const base = input.now?.getTime() ?? Date.now();
    const delay = computeRetryDelay(input.attempts);
    return { action: 'retry', retryAt: new Date(base + delay) };
  }

  return { action: 'fail' };
};
