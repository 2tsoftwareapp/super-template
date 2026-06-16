import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { importJobs } from '@repo/api-database';

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

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, jobId))
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
