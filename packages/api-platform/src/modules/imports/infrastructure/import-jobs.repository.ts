import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { importJobs } from '@repo/api-database';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ImportJobsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof importJobs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor.insert(importJobs).values(values).returning();

    return job ?? null;
  }

  async createIdempotent(
    values: typeof importJobs.$inferInsert & {
      createdById: string;
      idempotencyKey: string;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    return runIdempotentInsert(
      async () => {
        const [inserted] = await executor
          .insert(importJobs)
          .values(values)
          .returning();

        return inserted ?? undefined;
      },
      () =>
        this.findByIdempotencyKey(
          values.createdById,
          values.idempotencyKey,
          executor,
        ),
    );
  }

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, jobId))
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
      .from(importJobs)
      .where(
        and(
          eq(importJobs.createdById, createdById),
          eq(importJobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return job ?? null;
  }

  async update(
    jobId: string,
    values: Partial<typeof importJobs.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(importJobs)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId))
      .returning();

    return job ?? null;
  }
}
