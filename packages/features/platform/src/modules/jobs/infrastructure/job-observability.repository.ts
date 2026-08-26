import type { JsonObject } from "@repo/api-core";
import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/api-database";
import { jobAttempts, jobDependencies, jobEvents, jobs } from "@repo/api-database";
import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";

import type { JobObservabilityRepositoryPort } from "../application/ports/job-observability.repository.port";

type JobAttemptStatus = "PROCESSING" | "COMPLETED" | "FAILED";
type JobEventType =
  | "claimed"
  | "completed"
  | "failed"
  | "retry_scheduled"
  | "cancelled"
  | "no_handler";

function scopeWhereClause(
  scope: { type: "organization"; organizationId: string } | { type: "platform" },
  table: typeof jobs | typeof jobEvents | typeof jobAttempts,
) {
  if (scope.type === "organization") {
    return eq(table.organizationId, scope.organizationId);
  }
  return isNull(table.organizationId);
}

@Injectable()
export class JobObservabilityRepository implements JobObservabilityRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async startAttempt(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptNumber: number;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const [attempt] = await executor
      .insert(jobAttempts)
      .values({ ...values, status: "PROCESSING" })
      .returning();

    if (!attempt) {
      throw new Error("Job attempt insert returned no rows");
    }

    return attempt;
  }

  async finishAttempt(
    attemptId: string,
    values: { status: JobAttemptStatus; errorMessage?: string | null },
    executor: DatabaseExecutor = this.database,
  ) {
    const [attempt] = await executor
      .update(jobAttempts)
      .set({
        status: values.status,
        errorMessage: values.errorMessage ?? null,
        finishedAt: new Date(),
        durationMs: sql`extract(epoch from (now() - ${jobAttempts.startedAt})) * 1000`,
      })
      .where(eq(jobAttempts.id, attemptId))
      .returning();

    return attempt ?? null;
  }

  async recordEvent(
    values: {
      jobId: string;
      organizationId: string | null;
      attemptId?: string | null;
      type: JobEventType;
      message?: string | null;
      metadata?: JsonObject | null;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const [event] = await executor
      .insert(jobEvents)
      .values({
        jobId: values.jobId,
        organizationId: values.organizationId,
        attemptId: values.attemptId ?? null,
        type: values.type,
        message: values.message ?? null,
        metadata: values.metadata ?? null,
      })
      .returning();

    if (!event) {
      throw new Error("Job event insert returned no rows");
    }

    return event;
  }

  async listEvents(
    params: { jobId: string; page: number; limit: number },
    executor: DatabaseExecutor = this.database,
  ) {
    const whereClause = eq(jobEvents.jobId, params.jobId);
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(jobEvents)
        .where(whereClause)
        .orderBy(desc(jobEvents.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(jobEvents).where(whereClause),
    ]);

    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async addDependency(
    values: {
      jobId: string;
      organizationId: string | null;
      dependsOnJobId: string;
    },
    executor: DatabaseExecutor = this.database,
  ) {
    const [dependency] = await executor.insert(jobDependencies).values(values).returning();

    if (!dependency) {
      throw new Error("Job dependency insert returned no rows");
    }

    return dependency;
  }

  async listDependencies(jobId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select({
        id: jobDependencies.id,
        dependsOnJobId: jobDependencies.dependsOnJobId,
        dependsOnJobStatus: jobs.status,
        createdAt: jobDependencies.createdAt,
      })
      .from(jobDependencies)
      .innerJoin(jobs, eq(jobs.id, jobDependencies.dependsOnJobId))
      .where(eq(jobDependencies.jobId, jobId));
  }

  async wouldCreateCycle(
    jobId: string,
    dependsOnJobId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    if (jobId === dependsOnJobId) {
      return true;
    }

    const result = await executor.execute<{ wouldCycle: boolean }>(sql`
      WITH RECURSIVE chain AS (
        SELECT depends_on_job_id AS node
        FROM r_job_dependencies
        WHERE job_id = ${dependsOnJobId}
        UNION
        SELECT jd.depends_on_job_id
        FROM r_job_dependencies jd
        INNER JOIN chain c ON jd.job_id = c.node
      )
      SELECT EXISTS(SELECT 1 FROM chain WHERE node = ${jobId}) AS "wouldCycle"
    `);

    return result.rows[0]?.wouldCycle ?? false;
  }

  async hasIncompleteDependencies(
    jobId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<boolean> {
    const result = await executor.execute<{ incomplete: boolean }>(sql`
      SELECT EXISTS(
        SELECT 1
        FROM r_job_dependencies jd
        INNER JOIN w_jobs dep ON dep.id = jd.depends_on_job_id
        WHERE jd.job_id = ${jobId} AND dep.status <> 'COMPLETED'
      ) AS "incomplete"
    `);

    return result.rows[0]?.incomplete ?? false;
  }

  async getStatusCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor: DatabaseExecutor = this.database,
  ) {
    const scopeFilter = scopeWhereClause(scope, jobs);
    const dateFilter = this.buildDateFilter(filters);
    const whereClause = dateFilter ? and(scopeFilter, dateFilter) : scopeFilter;

    return executor
      .select({ status: jobs.status, total: count() })
      .from(jobs)
      .where(whereClause)
      .groupBy(jobs.status);
  }

  async getTypeCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor: DatabaseExecutor = this.database,
  ) {
    const scopeFilter = scopeWhereClause(scope, jobs);
    const dateFilter = this.buildDateFilter(filters);
    const whereClause = dateFilter ? and(scopeFilter, dateFilter) : scopeFilter;

    return executor
      .select({ type: jobs.type, total: count() })
      .from(jobs)
      .where(whereClause)
      .groupBy(jobs.type);
  }

  async getRetryCounts(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor: DatabaseExecutor = this.database,
  ) {
    const scopeFilter = scopeWhereClause(scope, jobs);
    const dateFilter = this.buildDateFilter(filters);
    const terminalFilter = inArray(jobs.status, ["COMPLETED", "FAILED"]);
    const baseWhere = dateFilter
      ? and(scopeFilter, terminalFilter, dateFilter)
      : and(scopeFilter, terminalFilter);

    const [retried] = await executor
      .select({ total: count() })
      .from(jobs)
      .where(and(baseWhere, sql`${jobs.attempts} > 1`));
    const [terminal] = await executor.select({ total: count() }).from(jobs).where(baseWhere);

    return {
      retried: Number(retried?.total ?? 0),
      terminal: Number(terminal?.total ?? 0),
    };
  }

  async getAverageDurationMs(
    scope: { type: "organization"; organizationId: string } | { type: "platform" },
    filters: { from?: string; to?: string },
    executor: DatabaseExecutor = this.database,
  ): Promise<number | null> {
    const scopeFilter = scopeWhereClause(scope, jobAttempts);
    const dateFilter = this.buildAttemptDateFilter(filters);
    const whereClause = and(
      scopeFilter,
      eq(jobAttempts.status, "COMPLETED"),
      ...(dateFilter ? [dateFilter] : []),
    );

    const [row] = await executor
      .select({ avgDurationMs: sql<string | null>`avg(${jobAttempts.durationMs})` })
      .from(jobAttempts)
      .where(whereClause);

    return row?.avgDurationMs ? Number(row.avgDurationMs) : null;
  }

  private buildDateFilter(filters: { from?: string; to?: string }) {
    const clauses = [];

    if (filters.from) {
      clauses.push(gte(jobs.createdAt, new Date(filters.from)));
    }

    if (filters.to) {
      clauses.push(lte(jobs.createdAt, new Date(filters.to)));
    }

    return clauses.length ? and(...clauses) : undefined;
  }

  private buildAttemptDateFilter(filters: { from?: string; to?: string }) {
    const clauses = [];

    if (filters.from) {
      clauses.push(gte(jobAttempts.startedAt, new Date(filters.from)));
    }

    if (filters.to) {
      clauses.push(lte(jobAttempts.startedAt, new Date(filters.to)));
    }

    return clauses.length ? and(...clauses) : undefined;
  }
}
