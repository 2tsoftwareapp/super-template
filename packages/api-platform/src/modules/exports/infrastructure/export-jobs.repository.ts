import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database/database.provider';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database/database.types';
import { exportJobs } from '@repo/api-database/schema';

@Injectable()
export class ExportJobsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof exportJobs.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [job] = await executor.insert(exportJobs).values(values).returning();

    return job ?? null;
  }

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.id, jobId))
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
