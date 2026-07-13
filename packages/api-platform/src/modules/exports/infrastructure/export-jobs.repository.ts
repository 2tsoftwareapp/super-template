import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { exportJobs } from '@repo/api-database';
import { and, eq } from 'drizzle-orm';

import type { ExportJobsRepositoryPort } from '../application/ports/export-jobs.repository.port';

@Injectable()
export class ExportJobsRepository implements ExportJobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof exportJobs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor.insert(exportJobs).values(values).returning();

    return job ?? null;
  }

  async createIdempotent(
    values: typeof exportJobs.$inferInsert & {
      createdById: string;
      idempotencyKey: string;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    return runIdempotentInsert(
      async () => {
        const [inserted] = await executor
          .insert(exportJobs)
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
      .from(exportJobs)
      .where(eq(exportJobs.id, jobId))
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
      .from(exportJobs)
      .where(
        and(
          eq(exportJobs.createdById, createdById),
          eq(exportJobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return job ?? null;
  }

  async update(
    jobId: string,
    values: Partial<typeof exportJobs.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor
      .update(exportJobs)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(exportJobs.id, jobId))
      .returning();

    return job ?? null;
  }
}
