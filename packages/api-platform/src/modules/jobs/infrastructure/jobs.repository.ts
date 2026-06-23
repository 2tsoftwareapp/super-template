import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { jobs } from '@repo/api-database';
import { and, count, desc, eq, sql } from 'drizzle-orm';

interface ListJobsParams {
  page: number;
  limit: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  type?: string;
}

@Injectable()
export class JobsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  get client(): DatabaseClient {
    return this.database;
  }

  async create(
    values: typeof jobs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor.insert(jobs).values(values).returning();

    return job ?? null;
  }

  async createIdempotent(
    values: typeof jobs.$inferInsert & {
      createdById: string;
      idempotencyKey: string;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const result = await runIdempotentInsert(
      async () => {
        const [inserted] = await executor.insert(jobs).values(values).returning();

        return inserted ?? undefined;
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

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    return job ?? null;
  }

  async findByIdempotencyKey(
    createdById: string,
    idempotencyKey: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.createdById, createdById),
          eq(jobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return job ?? null;
  }

  async list(
    params: ListJobsParams,
    executor: DatabaseExecutor = this.database,
  ) {
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
      executor
        .select()
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.scheduledAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(jobs).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async claimDueJobs(
    limit: number,
    executor: DatabaseExecutor = this.database,
  ) {
    const result = await executor.execute<typeof jobs.$inferSelect>(sql`
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

    return result.rows;
  }

  async markCompleted(
    jobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(jobs)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return job ?? null;
  }

  async markFailed(
    jobId: string,
    errorMessage: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(jobs)
      .set({
        status: 'FAILED',
        errorMessage,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return job ?? null;
  }

  async markCancelled(
    jobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(jobs)
      .set({
        status: 'CANCELLED',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.status, 'PENDING')))
      .returning();

    return job ?? null;
  }

  async requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    errorMessage: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(jobs)
      .set({
        status: 'PENDING',
        scheduledAt,
        errorMessage,
        startedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId))
      .returning();

    return job ?? null;
  }
}
