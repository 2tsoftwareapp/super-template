import { and, count, desc, eq, lte, sql } from "drizzle-orm";

import type { Executor } from "./client";
import { jobs, type JobRow } from "./schema";

export type JobStatus = "PENDING" | "PROCESSING" | "DONE" | "FAILED";

export interface ClaimedJob {
  id: string;
  type: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
}

export interface EnqueueJobInput {
  type: string;
  payload?: unknown;
  runAt?: Date;
  maxAttempts?: number;
}

/** Base for exponential backoff, capped so a poisoned job cannot starve the queue. */
const BACKOFF_BASE_SECONDS = 15;
const BACKOFF_MAX_SECONDS = 300;
/**
 * A PROCESSING row untouched for this long belongs to a worker that died; it is
 * claimed again (counting an attempt). Handlers must finish well within it and
 * be idempotent.
 */
export const JOB_LOCK_TIMEOUT_SECONDS = 600;

/** Delay before retry number `attempts + 1`: 15s, 30s, 60s … capped at 5 minutes. */
export function retryDelaySeconds(attempts: number): number {
  return Math.min(BACKOFF_BASE_SECONDS * 2 ** attempts, BACKOFF_MAX_SECONDS);
}

export async function enqueueJob(db: Executor, input: EnqueueJobInput): Promise<JobRow> {
  const [row] = await db
    .insert(jobs)
    .values({
      type: input.type,
      payload: (input.payload ?? {}) as JobRow["payload"],
      ...(input.runAt ? { runAt: input.runAt } : {}),
      ...(input.maxAttempts ? { maxAttempts: input.maxAttempts } : {}),
    })
    .returning();

  if (!row) {
    throw new Error("Job insert returned no row");
  }

  return row;
}

/**
 * Single statement claim: concurrent workers take distinct rows and never block
 * on each other. PROCESSING rows are invisible to the next claim until the
 * worker marks them done/failed, or until JOB_LOCK_TIMEOUT_SECONDS passes.
 */
export async function claimJobs(db: Executor, limit: number): Promise<ClaimedJob[]> {
  const result = await db.execute<{
    id: string;
    type: string;
    payload: unknown;
    attempts: number;
    max_attempts: number;
  }>(sql`
    UPDATE jobs
    SET status = 'PROCESSING',
        attempts = CASE WHEN status = 'PROCESSING' THEN attempts + 1 ELSE attempts END,
        updated_at = now()
    WHERE id IN (
      SELECT id FROM jobs
      WHERE (status = 'PENDING' AND run_at <= now())
         OR (status = 'PROCESSING'
             AND updated_at < now() - (${JOB_LOCK_TIMEOUT_SECONDS} * interval '1 second'))
      ORDER BY run_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload, attempts, max_attempts
  `);

  return (result.rows ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    payload: row.payload,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
  }));
}

export async function completeJob(db: Executor, id: string, result: unknown): Promise<void> {
  await db
    .update(jobs)
    .set({
      status: "DONE",
      result: (result ?? null) as JobRow["result"],
      lastError: null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id));
}

/**
 * Failed attempt: attempts + 1, then either FAILED (budget exhausted or the
 * error is not retryable) or back to PENDING with an exponential delay, so
 * retries do not spin in one pass.
 */
export async function failJob(
  db: Executor,
  job: Pick<ClaimedJob, "id" | "attempts" | "maxAttempts">,
  error: string,
  retryable = true,
): Promise<void> {
  const exhausted = !retryable || job.attempts + 1 >= job.maxAttempts;
  const delaySeconds = exhausted ? 0 : retryDelaySeconds(job.attempts);

  await db.execute(sql`
    UPDATE jobs
    SET attempts = attempts + 1,
        status = ${exhausted ? "FAILED" : "PENDING"},
        run_at = now() + (${delaySeconds} * interval '1 second'),
        last_error = ${error},
        updated_at = now()
    WHERE id = ${job.id}
  `);
}

export async function listJobs(
  db: Executor,
  input: { page: number; limit: number; status?: JobStatus },
): Promise<{ rows: JobRow[]; total: number }> {
  const where = input.status ? eq(jobs.status, input.status) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(where)
      .orderBy(desc(jobs.createdAt))
      .limit(input.limit)
      .offset((input.page - 1) * input.limit),
    db.select({ value: count() }).from(jobs).where(where),
  ]);

  return { rows, total: Number(totalRow?.value ?? 0) };
}

export async function findJob(db: Executor, id: string): Promise<JobRow | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

  return row ?? null;
}

/** Used by the worker's own tests: pending jobs that are due. */
export async function countDueJobs(db: Executor): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "PENDING"), lte(jobs.runAt, new Date())));

  return Number(row?.value ?? 0);
}
