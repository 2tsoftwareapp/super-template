import type { JsonObject, TransactionExecutor } from "@repo/api-core";
import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, runIdempotentInsert } from "@repo/api-database";
import { jobs } from "@repo/api-database";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

import type {
  JobRecord,
  JobScope,
  JobsRepositoryPort,
} from "../application/ports/jobs.repository.port";
import type { JobStatus } from "../domain/job-status";

function scopeCondition(scope: JobScope) {
  return scope.type === "organization"
    ? eq(jobs.organizationId, scope.organizationId)
    : isNull(jobs.organizationId);
}

@Injectable()
export class JobsRepository implements JobsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      processingStartedAt?: Date | null;
      leaseExpiresAt?: Date | null;
      workerId?: string | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById?: string | null;
      idempotencyKey?: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .insert(jobs)
      .values(values as typeof jobs.$inferInsert)
      .returning();
    return (job as JobRecord) ?? null;
  }

  async createIdempotent(
    values: {
      id?: string;
      type: string;
      payload: JsonObject;
      status?: string;
      scheduledAt?: Date;
      priority?: number;
      attempts?: number;
      maxAttempts?: number;
      processingStartedAt?: Date | null;
      leaseExpiresAt?: Date | null;
      workerId?: string | null;
      startedAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      errorMessage?: string | null;
      organizationId?: string | null;
      createdById: string;
      idempotencyKey: string;
    },
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await runIdempotentInsert(
      async () => {
        const [inserted] = await db
          .insert(jobs)
          .values(
            values as typeof jobs.$inferInsert & { createdById: string; idempotencyKey: string },
          )
          .returning();
        return inserted;
      },
      () =>
        this.findByIdempotencyKey(
          values.organizationId ?? null,
          values.createdById,
          values.idempotencyKey,
          executor,
        ),
    );
    return result?.value ?? null;
  }

  async findById(
    jobId: string,
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, jobId), scopeCondition(scope)))
      .limit(1);
    return (job as JobRecord) ?? null;
  }

  async findByIdempotencyKey(
    organizationId: string | null,
    createdById: string,
    idempotencyKey: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const orgFilter =
      organizationId === null
        ? isNull(jobs.organizationId)
        : eq(jobs.organizationId, organizationId);
    const [job] = await db
      .select()
      .from(jobs)
      .where(
        and(orgFilter, eq(jobs.createdById, createdById), eq(jobs.idempotencyKey, idempotencyKey)),
      )
      .limit(1);
    return (job as JobRecord) ?? null;
  }

  async list(
    params: { scope: JobScope; page: number; limit: number; status?: string; type?: string },
    executor?: TransactionExecutor,
  ): Promise<{ rows: JobRecord[]; total: number }> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const filters: ReturnType<typeof eq>[] = [scopeCondition(params.scope)];

    if (params.status) {
      filters.push(eq(jobs.status, params.status as JobStatus));
    }
    if (params.type) {
      filters.push(eq(jobs.type, params.type));
    }

    const whereClause = and(...filters);
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.scheduledAt))
        .limit(params.limit)
        .offset(offset),
      db.select({ total: count() }).from(jobs).where(whereClause),
    ]);

    return { rows: rows, total: Number(totals[0]?.total ?? 0) };
  }

  async claimDueJobs(
    limit: number,
    workerId: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord[]> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const result = await db.execute<typeof jobs.$inferSelect>(sql`
      UPDATE jobs
      SET
        status = 'PROCESSING',
        processing_started_at = now(),
        lease_expires_at = now() + interval '5 minutes',
        worker_id = ${workerId},
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
        id, organization_id AS "organizationId", type, payload, status,
        scheduled_at AS "scheduledAt", priority, attempts, max_attempts AS "maxAttempts",
        processing_started_at AS "processingStartedAt", lease_expires_at AS "leaseExpiresAt",
        worker_id AS "workerId", started_at AS "startedAt", completed_at AS "completedAt",
        cancelled_at AS "cancelledAt", error_message AS "errorMessage",
        created_by_id AS "createdById", idempotency_key AS "idempotencyKey",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `);
    return result.rows;
  }

  async markCompleted(
    jobId: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: "COMPLETED",
        errorMessage: null,
        completedAt: new Date(),
        processingStartedAt: null,
        leaseExpiresAt: null,
        workerId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.status, "PROCESSING"),
          eq(jobs.workerId, workerId),
          eq(jobs.attempts, attempts),
        ),
      )
      .returning();
    return (job as JobRecord) ?? null;
  }

  async markFailed(
    jobId: string,
    message: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: "FAILED",
        errorMessage: message,
        completedAt: new Date(),
        processingStartedAt: null,
        leaseExpiresAt: null,
        workerId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.status, "PROCESSING"),
          eq(jobs.workerId, workerId),
          eq(jobs.attempts, attempts),
        ),
      )
      .returning();
    return (job as JobRecord) ?? null;
  }

  async markCancelled(
    jobId: string,
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: "CANCELLED",
        cancelledAt: new Date(),
        processingStartedAt: null,
        leaseExpiresAt: null,
        workerId: null,
        updatedAt: new Date(),
      })
      .where(and(eq(jobs.id, jobId), eq(jobs.status, "PENDING"), scopeCondition(scope)))
      .returning();
    return (job as JobRecord) ?? null;
  }

  async markBlocked(
    jobId: string,
    scope: JobScope,
    message: string,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({ status: "BLOCKED", errorMessage: message, updatedAt: new Date() })
      .where(and(eq(jobs.id, jobId), eq(jobs.status, "PENDING"), scopeCondition(scope)))
      .returning();
    return (job as JobRecord) ?? null;
  }

  async requeueForRetry(
    jobId: string,
    scheduledAt: Date,
    message: string,
    workerId: string,
    attempts: number,
    executor?: TransactionExecutor,
  ): Promise<JobRecord | null> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const [job] = await db
      .update(jobs)
      .set({
        status: "PENDING",
        scheduledAt,
        errorMessage: message,
        startedAt: null,
        processingStartedAt: null,
        leaseExpiresAt: null,
        workerId: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(jobs.id, jobId),
          eq(jobs.status, "PROCESSING"),
          eq(jobs.workerId, workerId),
          eq(jobs.attempts, attempts),
        ),
      )
      .returning();
    return (job as JobRecord) ?? null;
  }

  async recoverStaleProcessing(executor?: TransactionExecutor): Promise<{
    requeued: JobRecord[];
    failed: JobRecord[];
  }> {
    const db = (executor ?? this.database) as DatabaseExecutor;

    const requeued = await db.execute<typeof jobs.$inferSelect>(sql`
      UPDATE jobs
      SET
        status = 'PENDING',
        processing_started_at = NULL, lease_expires_at = NULL, worker_id = NULL,
        started_at = NULL, updated_at = now(),
        error_message = CONCAT('Stale recovery: lease expired at ', lease_expires_at)
      WHERE
        status = 'PROCESSING'
        AND lease_expires_at IS NOT NULL AND lease_expires_at < now()
        AND attempts < max_attempts
      RETURNING
        id, organization_id AS "organizationId", type, payload, status,
        scheduled_at AS "scheduledAt", priority, attempts, max_attempts AS "maxAttempts",
        processing_started_at AS "processingStartedAt", lease_expires_at AS "leaseExpiresAt",
        worker_id AS "workerId", started_at AS "startedAt", completed_at AS "completedAt",
        cancelled_at AS "cancelledAt", error_message AS "errorMessage",
        created_by_id AS "createdById", idempotency_key AS "idempotencyKey",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `);

    const failed = await db.execute<typeof jobs.$inferSelect>(sql`
      UPDATE jobs
      SET
        status = 'FAILED',
        completed_at = now(), updated_at = now(),
        error_message = CONCAT('Stale recovery exhausted: lease expired at ', lease_expires_at),
        processing_started_at = NULL, lease_expires_at = NULL, worker_id = NULL
      WHERE
        status = 'PROCESSING'
        AND lease_expires_at IS NOT NULL AND lease_expires_at < now()
        AND attempts >= max_attempts
      RETURNING
        id, organization_id AS "organizationId", type, payload, status,
        scheduled_at AS "scheduledAt", priority, attempts, max_attempts AS "maxAttempts",
        processing_started_at AS "processingStartedAt", lease_expires_at AS "leaseExpiresAt",
        worker_id AS "workerId", started_at AS "startedAt", completed_at AS "completedAt",
        cancelled_at AS "cancelledAt", error_message AS "errorMessage",
        created_by_id AS "createdById", idempotency_key AS "idempotencyKey",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `);

    return {
      requeued: requeued.rows,
      failed: failed.rows,
    };
  }

  async acquireDependencyGraphLock(scope: JobScope, executor?: TransactionExecutor): Promise<void> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    const lockKey =
      scope.type === "organization" ? `dep-graph-${scope.organizationId}` : "dep-graph-platform";
    await db.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);
  }

  async listDependents(
    jobId: string,
    scope: JobScope,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; jobId: string; status: JobStatus; organizationId: string | null }[]> {
    const db = (executor ?? this.database) as DatabaseExecutor;
    // The join aliases jobs as "j", so the scope condition must reference the
    // alias: scopeCondition() renders "jobs"."organization_id", which is an
    // invalid reference once the table name is shadowed by the alias.
    const scopeFilter =
      scope.type === "organization"
        ? sql`j.organization_id = ${scope.organizationId}`
        : sql`j.organization_id IS NULL`;
    const result = await db.execute<{
      id: string;
      job_id: string;
      status: string;
      organization_id: string | null;
    }>(sql`
      SELECT jd.id, jd.job_id, j.status, j.organization_id
      FROM job_dependencies jd
      INNER JOIN jobs j ON j.id = jd.job_id
      WHERE jd.depends_on_job_id = ${jobId}
      AND ${scopeFilter}
    `);
    return result.rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      status: r.status as JobStatus,
      organizationId: r.organization_id,
    }));
  }
}
