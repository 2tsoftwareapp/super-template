import type { TransactionExecutor } from "@repo/api-core";
import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, runIdempotentInsert } from "@repo/api-database";
import { importJobs } from "@repo/api-database";
import { and, eq, isNull } from "drizzle-orm";

import type {
  CreateImportJobValues,
  ImportJobRecord,
  ImportJobsRepositoryPort,
  UpdateImportJobValues,
} from "../application/ports/imports.repository.port";

@Injectable()
export class ImportJobsRepository implements ImportJobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: CreateImportJobValues,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db.insert(importJobs).values(values).returning();

    return (job as ImportJobRecord) ?? null;
  }

  async createIdempotent(
    values: CreateImportJobValues & { idempotencyKey: string },
    executor?: TransactionExecutor,
  ): Promise<{ value: ImportJobRecord | undefined; created: boolean }> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await runIdempotentInsert(
      async () => {
        const [inserted] = await db.insert(importJobs).values(values).returning();

        return inserted;
      },
      () => this.findByIdempotencyKey(values.createdById, values.idempotencyKey, executor),
    );

    return result ?? { value: undefined, created: false };
  }

  async findById(jobId: string, executor?: TransactionExecutor): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1);

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
        and(eq(importJobs.createdById, createdById), eq(importJobs.idempotencyKey, idempotencyKey)),
      )
      .limit(1);

    return (job as ImportJobRecord) ?? null;
  }

  async confirm(jobId: string, executor?: TransactionExecutor): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    // CAS guard: the UPDATE only matches rows that have not been confirmed yet.
    // Under concurrent requests the second UPDATE blocks on the row lock, then
    // re-evaluates the WHERE clause and matches zero rows -> null -> conflict.
    const [job] = await db
      .update(importJobs)
      .set({ confirmedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(importJobs.id, jobId), isNull(importJobs.confirmedAt)))
      .returning();

    return (job as ImportJobRecord) ?? null;
  }

  async update(
    jobId: string,
    values: UpdateImportJobValues,
    executor?: TransactionExecutor,
  ): Promise<ImportJobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(importJobs)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, jobId))
      .returning();

    return (job as ImportJobRecord) ?? null;
  }
}
