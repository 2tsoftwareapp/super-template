import { and, count, desc, eq, lte, sql } from "drizzle-orm";

import type { Database } from "./client";
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

export async function enqueueJob(db: Database, input: EnqueueJobInput): Promise<JobRow> {
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
 * worker marks them done/failed.
 */
export async function claimJobs(db: Database, limit: number): Promise<ClaimedJob[]> {
  const result = await db.execute<{
    id: string;
    type: string;
    payload: unknown;
    attempts: number;
    max_attempts: number;
  }>(sql`
    UPDATE jobs
    SET status = 'PROCESSING', updated_at = now()
    WHERE id IN (
      SELECT id FROM jobs
      WHERE status = 'PENDING' AND run_at <= now()
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

export async function completeJob(db: Database, id: string, result: unknown): Promise<void> {
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
 * Failed attempt: attempts + 1, then either FAILED (budget exhausted) or back
 * to PENDING with an exponential delay, so retries do not spin in one pass.
 */
export async function failJob(
  db: Database,
  id: string,
  attempts: number,
  maxAttempts: number,
  error: string,
): Promise<void> {
  const exhausted = attempts + 1 >= maxAttempts;
  const delaySeconds = exhausted
    ? 0
    : Math.min(BACKOFF_BASE_SECONDS * 2 ** attempts, BACKOFF_MAX_SECONDS);

  await db.execute(sql`
    UPDATE jobs
    SET attempts = attempts + 1,
        status = ${exhausted ? "FAILED" : "PENDING"},
        run_at = now() + (${delaySeconds} * interval '1 second'),
        last_error = ${error},
        updated_at = now()
    WHERE id = ${id}
  `);
}

export async function listJobs(
  db: Database,
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

export async function findJob(db: Database, id: string): Promise<JobRow | null> {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

  return row ?? null;
}

/** Used by the worker's own tests: pending jobs that are due. */
export async function countDueJobs(db: Database): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(jobs)
    .where(and(eq(jobs.status, "PENDING"), lte(jobs.runAt, new Date())));

  return Number(row?.value ?? 0);
}
