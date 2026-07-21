import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import type { TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, runIdempotentInsert } from '@repo/api-database';
import { importJobs } from '@repo/api-database';
import { and, eq } from 'drizzle-orm';

import type {
  ImportJobRecord,
  ImportJobsRepositoryPort,
} from '../application/ports/imports.repository.port';

@Injectable()
export class ImportJobsRepository implements ImportJobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: Record<string, unknown>,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db.insert(importJobs).values(values as typeof importJobs.$inferInsert).returning();

    return (job as ImportJobRecord) ?? null;
  }

  async createIdempotent(
    values: Record<string, unknown> & { createdById: string; idempotencyKey: string },
    executor?: TransactionExecutor,
  ): Promise<{ value: ImportJobRecord | undefined; created: boolean }> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await runIdempotentInsert(
      async () => {
        const [inserted] = await db
          .insert(importJobs)
          .values(values as typeof importJobs.$inferInsert & { createdById: string; idempotencyKey: string })
          .returning();

        return inserted as ImportJobRecord | undefined;
      },
      () =>
        this.findByIdempotencyKey(
          values.createdById,
          values.idempotencyKey,
          executor,
        ),
    );

    return result ?? { value: undefined, created: false };
  }

  async findById(
    jobId: string,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, jobId))
      .limit(1);

    return (job as ImportJobRecord) ?? null;
  }

  async findByIdempotencyKey(
    createdById: string,
    idempotencyKey: string,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .select()
      .from(importJobs)
      .where(
        and(
          eq(importJobs.createdById, createdById),
          eq(importJobs.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    return (job as ImportJobRecord) ?? null;
  }

  async update(
    jobId: string,
    values: Record<string, unknown>,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(importJobs)
      .set({
        ...(values as Partial<typeof importJobs.$inferInsert>),
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId))
      .returning();

    return (job as ImportJobRecord) ?? null;
  }
}
