import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, runIdempotentInsert } from "@repo/database-runtime";
import { and, eq, inArray, lt, sql } from "drizzle-orm";

import type {
  ExportJobRecord,
  ExportJobsRepositoryPort,
} from "../application/ports/export-jobs.repository.port";

import { exportJobs } from "../../infrastructure/persistence";

@Injectable()
export class ExportJobsRepository implements ExportJobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(values: typeof exportJobs.$inferInsert, executor: DatabaseExecutor = this.database) {
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
        const [inserted] = await executor.insert(exportJobs).values(values).returning();

        return inserted ?? undefined;
      },
      () => this.findByIdempotencyKey(values.createdById, values.idempotencyKey, executor),
    );
  }

  async findById(jobId: string, executor: DatabaseExecutor = this.database) {
    const [job] = await executor.select().from(exportJobs).where(eq(exportJobs.id, jobId)).limit(1);

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
        and(eq(exportJobs.createdById, createdById), eq(exportJobs.idempotencyKey, idempotencyKey)),
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

  async claimPending(
    limit: number,
    executor: DatabaseExecutor = this.database,
  ): Promise<ExportJobRecord[]> {
    // Raw SQL for FOR UPDATE SKIP LOCKED (Drizzle builder does not expose it).
    // Single statement: claim = PENDING -> PROCESSING atomically; concurrent
    // workers select distinct rows, so a job is never double-processed.
    const claimed = await executor.execute<{ id: string }>(sql`
      UPDATE t_export_jobs
      SET status = 'PROCESSING', updated_at = now()
      WHERE id IN (
        SELECT id FROM t_export_jobs
        WHERE status = 'PENDING'
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id
    `);

    if (!claimed.rows || claimed.rows.length === 0) {
      return [];
    }

    const ids = claimed.rows.map((r) => r.id);

    return executor.select().from(exportJobs).where(inArray(exportJobs.id, ids));
  }

  async recoverStaleProcessing(
    before: Date,
    executor: DatabaseExecutor = this.database,
  ): Promise<number> {
    // Export jobs are claimed (PENDING -> PROCESSING) by a worker and completed
    // in bounded time; a PROCESSING row untouched past the cutoff means the
    // worker died mid-export. Fail it so history is terminal and the user can
    // retry.
    const recovered = await executor
      .update(exportJobs)
      .set({ status: "FAILED", completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(exportJobs.status, "PROCESSING"), lt(exportJobs.updatedAt, before)))
      .returning({ id: exportJobs.id });

    return recovered.length;
  }
}
