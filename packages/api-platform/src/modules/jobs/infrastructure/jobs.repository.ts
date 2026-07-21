import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import type { JsonObject, TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { jobs } from '@repo/api-database';
import { and, count, desc, eq, sql } from 'drizzle-orm';

import type { JobRecord, JobsRepositoryPort } from '../application/ports/jobs.repository.port';

interface ListJobsParams {
  page: number;
  limit: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  type?: string;
}

@Injectable()
export class JobsRepository implements JobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById?: string | null;
      idempotencyKey?: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db.insert(jobs).values(values as typeof jobs.$inferInsert).returning();

    return (job as JobRecord) ?? null;
  }

  async createIdempotent(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById: string;
      idempotencyKey: string;
    },
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await runIdempotentInsert(
      async () => {
        const [inserted] = await db.insert(jobs).values(values as typeof jobs.$inferInsert & { createdById: string; idempotencyKey: string }).returning();

        return inserted as JobRecord | undefined;
      },
      () =>
        this.findByIdempotencyKey(
          values.createdById,
          values.idempotencyKey,
          executor,
        ),
    );

    return result?.value ?? null;
  }

  async findById(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    return (job as JobRecord) ?? null;
  }

  async findByIdempotencyKey(
    createdById: string,
    idempotencyKey: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.createdById, createdById),
          eq(jobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return (job as JobRecord) ?? null;
  }

  async list(
    params: ListJobsParams,
    executor?: TransactionExecutor,
  ): Promise<{ rows: JobRecord[]; total: number }> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const filters = [];

    if (params.status) {
      filters.push(eq(jobs.status, params.status));
    }

    if (params.type) {
      filters.push(eq(jobs.type, params.type));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.scheduledAt))
        .limit(params.limit)
        .offset(offset),
      db.select({ total: count() }).from(jobs).where(whereClause),
    ]);

    return {
      rows: rows as JobRecord[],
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async claimDueJobs(
    limit: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord[]> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await db.execute<typeof jobs.$inferSelect>(sql`
      UPDATE jobs
      SET
        status = 'PROCESSING',
        started_at = now(),
        attempts = attempts + 1,
        updated_at = now()
      WHERE id IN (
        SELECT id
        FROM jobs
        WHERE status = 'PENDING'
          AND scheduled_at <= now()
          AND NOT EXISTS (
            SELECT 1
            FROM job_dependencies jd
            INNER JOIN jobs dep ON dep.id = jd.depends_on_job_id
            WHERE jd.job_id = jobs.id AND dep.status <> 'COMPLETED'
          )
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        organization_id AS "organizationId",
        type,
        payload,
        status,
        scheduled_at AS "scheduledAt",
        priority,
        attempts,
        max_attempts AS "maxAttempts",
        started_at AS "startedAt",
        completed_at AS "completedAt",
        cancelled_at AS "cancelledAt",
        error_message AS "errorMessage",
        created_by_id AS "createdById",
        idempotency_key AS "idempotencyKey",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `);

    return result.rows as JobRecord[];
  }

  async markCompleted(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return (job as JobRecord) ?? null;
  }

  async markFailed(
    jobId: string,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: 'FAILED',
        errorMessage: message,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return (job as JobRecord) ?? null;
  }

  async markCancelled(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.status, 'PENDING')))
      .returning();

    return (job as JobRecord) ?? null;
  }

  async requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: 'PENDING',
        scheduledAt,
        errorMessage: message,
        startedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return (job as JobRecord) ?? null;
  }
}
