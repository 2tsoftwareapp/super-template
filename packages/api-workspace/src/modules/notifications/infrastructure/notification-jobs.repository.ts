import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { notificationJobs } from '@repo/api-database';
import { and, asc, count, desc, eq, lte, sql } from 'drizzle-orm';

interface ListJobsParams {
  page: number;
  limit: number;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
}

@Injectable()
export class NotificationJobsRepository {
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
