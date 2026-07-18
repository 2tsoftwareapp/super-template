import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { notificationJobs } from '@repo/api-database';
import { and, asc, count, desc, eq, lte, sql } from 'drizzle-orm';

import type { NotificationJobsRepositoryPort } from '../application/ports/notification-jobs.repository.port';

interface ListJobsParams {
  page: number;
  limit: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  organizationId?: string;
}

@Injectable()
export class NotificationJobsRepository implements NotificationJobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof notificationJobs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .insert(notificationJobs)
      .values(values)
      .returning();

    return job ?? null;
  }

  async createIdempotent(
    values: typeof notificationJobs.$inferInsert & {
      actorId: string;
      idempotencyKey: string;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    return runIdempotentInsert(
      async () => {
        const [inserted] = await executor
          .insert(notificationJobs)
          .values(values)
          .returning();

        return inserted ?? undefined;
      },
      () =>
        this.findByIdempotencyKey(
          values.actorId,
          values.idempotencyKey,
          executor,
        ),
    );
  }

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor
      .select()
      .from(notificationJobs)
      .where(eq(notificationJobs.id, jobId))
      .limit(1);

    return job ?? null;
  }

  async findByIdempotencyKey(
    actorId: string,
    idempotencyKey: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .select()
      .from(notificationJobs)
      .where(
        and(
          eq(notificationJobs.actorId, actorId),
          eq(notificationJobs.idempotencyKey, idempotencyKey),
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
      filters.push(eq(notificationJobs.status, params.status));
    }

    if (params.organizationId) {
      filters.push(eq(notificationJobs.organizationId, params.organizationId));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(notificationJobs)
        .where(whereClause)
        .orderBy(desc(notificationJobs.scheduledAt))
        .limit(params.limit)
        .offset(offset),
      executor
        .select({ total: count() })
        .from(notificationJobs)
        .where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async listDue(limit: number, executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(notificationJobs)
      .where(
        and(
          eq(notificationJobs.status, 'PENDING'),
          lte(notificationJobs.scheduledAt, sql`now()`),
        ),
      )
      .orderBy(asc(notificationJobs.scheduledAt))
      .limit(limit);
  }

  /**
   * Atomically claim up to `limit` pending jobs that are due.
   * Step 1: SELECT … FOR UPDATE SKIP LOCKED so concurrent workers each get distinct rows.
   * Step 2: UPDATE those IDs to PROCESSING in the same transaction.
   * Returns the claimed jobs ready for processing.
   */
  async claimDue(limit: number, executor: DatabaseExecutor = this.database) {
    // Use raw SQL for FOR UPDATE SKIP LOCKED — Drizzle doesn't expose this via builder
    const claimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE notification_jobs
        SET status = 'PROCESSING', updated_at = now()
        WHERE id IN (
          SELECT id FROM notification_jobs
          WHERE status = 'PENDING' AND scheduled_at <= now()
          ORDER BY scheduled_at ASC
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!claimed.rows || claimed.rows.length === 0) {
      return [];
    }

    const ids = claimed.rows.map((r) => r.id);
    return executor
      .select()
      .from(notificationJobs)
      .where(sql`${notificationJobs.id} = ANY(${ids})`);
  }


  async markProcessing(
    jobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(notificationJobs)
      .set({
        status: 'PROCESSING',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationJobs.id, jobId),
          eq(notificationJobs.status, 'PENDING'),
        ),
      )
      .returning();

    return job ?? null;
  }

  async markCompleted(
    jobId: string,
    recipientCount: number,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(notificationJobs)
      .set({
        status: 'COMPLETED',
        recipientCount,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationJobs.id, jobId))
      .returning();

    return job ?? null;
  }

  async markFailed(
    jobId: string,
    errorMessage: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(notificationJobs)
      .set({
        status: 'FAILED',
        errorMessage,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationJobs.id, jobId))
      .returning();

    return job ?? null;
  }

  async markCancelled(
    jobId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(notificationJobs)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(notificationJobs.id, jobId),
          eq(notificationJobs.status, 'PENDING'),
        ),
      )
      .returning();

    return job ?? null;
  }
}
