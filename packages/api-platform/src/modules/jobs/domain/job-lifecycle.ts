import type { JobStatus } from "./job-status";

// BLOCKED is terminal: it is set only when a dependency has FAILED or CANCELLED
// (see PropagationService.propagateBlocked). There is no transition out of BLOCKED,
// and the worker only claims PENDING jobs, so BLOCKED jobs stay parked permanently.
const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set([
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "BLOCKED",
]);

const CANCELLABLE_STATUSES: ReadonlySet<JobStatus> = new Set(["PENDING"]);

const BLOCKING_STATUSES: ReadonlySet<JobStatus> = new Set(["FAILED", "CANCELLED"]);

export const LEASE_DURATION_MS = 5 * 60 * 1000;

export const HANDLER_TIMEOUT_MS = 4 * 60 * 1000;

export const isTerminalStatus = (status: JobStatus): boolean => TERMINAL_STATUSES.has(status);

export const isCancellableStatus = (status: JobStatus): boolean => CANCELLABLE_STATUSES.has(status);

export const isBlockingStatus = (status: JobStatus): boolean => BLOCKING_STATUSES.has(status);

export type FailureOutcome = { action: "retry"; retryAt: Date } | { action: "fail" };

export const computeRetryDelay = (attempt: number): number => {
  const exponential = Math.min(60_000 * Math.pow(2, attempt - 1), 3_600_000);
  const jitter = Math.floor(Math.random() * 10_000);
  return exponential + jitter;
};

export const resolveFailureOutcome = (input: {
  attempts: number;
  maxAttempts: number;
  now?: Date;
}): FailureOutcome => {
  if (input.attempts < input.maxAttempts) {
    const base = input.now?.getTime() ?? Date.now();
    const delay = computeRetryDelay(input.attempts);
    return { action: "retry", retryAt: new Date(base + delay) };
  }

  return { action: "fail" };
};
