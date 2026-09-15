import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import type { JobScope } from "../../application/ports/jobs.repository.port";
import { JobsRepository } from "../jobs.repository";
import { jobDependencies, jobs } from "../persistence";

const dialect = new PgDialect();
const JOBS_TABLE = getTableName(jobs);
const DEPENDENCIES_TABLE = getTableName(jobDependencies);
const ORG_SCOPE: JobScope = { type: "organization", organizationId: "org-1" };

/** Values the repository writes on a terminal/lease update. */
interface JobUpdateValues {
  status?: string;
  errorMessage?: string | null;
  scheduledAt?: Date;
  workerId?: string | null;
  leaseExpiresAt?: Date | null;
  processingStartedAt?: Date | null;
  startedAt?: Date | null;
}

/** Captures a raw statement handed to the driver. */
function createExecuteCapture(rows: unknown[] = []) {
  const execute = vi.fn<(statement: SQL) => Promise<{ rows: unknown[] }>>(async () => ({ rows }));
  return { client: { execute }, execute };
}

/**
 * Captures the Drizzle `update().set().where().returning()` chain so the test can
 * render the WHERE clause and read back the leased column values.
 */
function createUpdateCapture(rows: unknown[] = []) {
  const returning = vi.fn(async () => rows);
  const where = vi.fn<(condition: SQL) => { returning: typeof returning }>(() => ({ returning }));
  const set = vi.fn<(values: JobUpdateValues) => { where: typeof where }>(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  return { client: { update }, update, set, where, returning };
}

function renderWhere(capture: ReturnType<typeof createUpdateCapture>) {
  return dialect.sqlToQuery(capture.where.mock.calls[0]![0]);
}

/** `set()` values of an update chain that is expected to have run. */
function setValues(capture: ReturnType<typeof createUpdateCapture>): JobUpdateValues {
  const [values] = capture.set.mock.calls[0]!;
  return values;
}

function renderStatement(statement: SQL) {
  return dialect.sqlToQuery(statement);
}

describe("JobsRepository claimDueJobs", () => {
  it("takes a lease on due, unblocked PENDING jobs only", async () => {
    const executor = createExecuteCapture([{ id: "job-1" }]);
    const repository = new JobsRepository({} as never);

    await expect(
      repository.claimDueJobs(20, "worker-1", executor.client as never),
    ).resolves.toEqual([{ id: "job-1" }]);

    const { sql: rendered, params } = renderStatement(executor.execute.mock.calls[0]![0]);

    // Table names come from the schema object, so a rename cannot silently
    // desynchronise the raw statement from the model.
    expect(rendered).toContain(`UPDATE ${JOBS_TABLE}`);
    expect(rendered).toContain(`FROM ${DEPENDENCIES_TABLE}`);
    // Cancelled / terminal jobs are excluded here: this is the only thing that
    // keeps a CANCELLED job from ever being executed.
    expect(rendered).toContain("status = 'PENDING'");
    expect(rendered).toContain("scheduled_at <= now()");
    // A job whose dependency did not complete is not due.
    expect(rendered).toContain("dep.status <> 'COMPLETED'");
    expect(rendered).toContain("ORDER BY priority DESC, scheduled_at ASC");
    expect(rendered).toContain("FOR UPDATE SKIP LOCKED");
    // Claiming consumes an attempt and starts the lease window.
    expect(rendered).toContain("attempts = attempts + 1");
    expect(rendered).toContain("lease_expires_at = now() + interval '5 minutes'");
    expect(rendered).toContain('max_attempts AS "maxAttempts"');
    expect(params).toContain("worker-1");
    expect(params).toContain(20);
  });

  it("returns no rows when the driver claims nothing", async () => {
    const executor = createExecuteCapture([]);
    const repository = new JobsRepository({} as never);

    await expect(repository.claimDueJobs(5, "worker-1", executor.client as never)).resolves.toEqual(
      [],
    );
  });
});

describe("JobsRepository terminal writes are lease-fenced", () => {
  it("fences markCompleted on the claiming worker and attempt number", async () => {
    const executor = createUpdateCapture([{ id: "job-1", status: "COMPLETED" }]);
    const repository = new JobsRepository({} as never);

    await expect(
      repository.markCompleted("job-1", "worker-1", 2, executor.client as never),
    ).resolves.toEqual({ id: "job-1", status: "COMPLETED" });

    const values = setValues(executor);
    expect(values.status).toBe("COMPLETED");

    const { sql: rendered, params } = renderWhere(executor);
    expect(rendered).toContain(`"${JOBS_TABLE}"."id" = $1`);
    expect(rendered).toContain(`"${JOBS_TABLE}"."status" = `);
    expect(rendered).toContain(`"${JOBS_TABLE}"."worker_id" = `);
    expect(rendered).toContain(`"${JOBS_TABLE}"."attempts" = `);
    expect(params).toEqual(["job-1", "PROCESSING", "worker-1", 2]);
  });

  it("returns null when the lease no longer matches", async () => {
    const executor = createUpdateCapture([]);
    const repository = new JobsRepository({} as never);

    await expect(
      repository.markCompleted("job-1", "worker-1", 2, executor.client as never),
    ).resolves.toBeNull();
  });

  it("fences markFailed and stores the error message", async () => {
    const executor = createUpdateCapture([{ id: "job-1", status: "FAILED" }]);
    const repository = new JobsRepository({} as never);

    await repository.markFailed("job-1", "boom", "worker-1", 2, executor.client as never);

    const values = setValues(executor);
    expect(values).toMatchObject({ status: "FAILED", errorMessage: "boom" });

    const { params } = renderWhere(executor);
    expect(params).toEqual(["job-1", "PROCESSING", "worker-1", 2]);
  });

  it("clears the lease and reschedules on retry", async () => {
    const retryAt = new Date("2026-09-15T11:00:00.000Z");
    const executor = createUpdateCapture([{ id: "job-1", status: "PENDING" }]);
    const repository = new JobsRepository({} as never);

    await repository.requeueForRetry(
      "job-1",
      retryAt,
      "boom",
      "worker-1",
      1,
      executor.client as never,
    );

    const values = setValues(executor);
    expect(values).toMatchObject({
      status: "PENDING",
      scheduledAt: retryAt,
      errorMessage: "boom",
      workerId: null,
      leaseExpiresAt: null,
      processingStartedAt: null,
      startedAt: null,
    });

    const { params } = renderWhere(executor);
    expect(params).toEqual(["job-1", "PROCESSING", "worker-1", 1]);
  });
});

describe("JobsRepository stale-lease recovery", () => {
  it("requeues leases with attempts left and fails exhausted ones", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: "job-1" }] })
      .mockResolvedValueOnce({ rows: [{ id: "job-2" }] });
    const repository = new JobsRepository({} as never);

    await expect(repository.recoverStaleProcessing({ execute } as never)).resolves.toEqual({
      requeued: [{ id: "job-1" }],
      failed: [{ id: "job-2" }],
    });

    const [requeueCall, failCall] = execute.mock.calls as unknown as [[SQL], [SQL]];
    const requeueSql = renderStatement(requeueCall[0]).sql;
    const failSql = renderStatement(failCall[0]).sql;

    for (const rendered of [requeueSql, failSql]) {
      expect(rendered).toContain(`UPDATE ${JOBS_TABLE}`);
      expect(rendered).toContain("status = 'PROCESSING'");
      expect(rendered).toContain("lease_expires_at < now()");
    }

    expect(requeueSql).toContain("attempts < max_attempts");
    expect(requeueSql).toContain("status = 'PENDING'");
    expect(failSql).toContain("attempts >= max_attempts");
    expect(failSql).toContain("status = 'FAILED'");
  });
});

describe("JobsRepository tenant scoping", () => {
  it("blocks only pending jobs inside the caller's scope", async () => {
    const executor = createUpdateCapture([{ id: "job-1", status: "BLOCKED" }]);
    const repository = new JobsRepository({} as never);

    await repository.markBlocked(
      "job-1",
      ORG_SCOPE,
      "Dependency job-0 failed",
      executor.client as never,
    );

    const values = setValues(executor);
    expect(values).toMatchObject({ status: "BLOCKED", errorMessage: "Dependency job-0 failed" });

    const { params } = renderWhere(executor);
    expect(params).toEqual(["job-1", "PENDING", "org-1"]);
  });

  it("matches only organization-less jobs in platform scope", async () => {
    const executor = createUpdateCapture([]);
    const repository = new JobsRepository({} as never);

    await repository.markBlocked("job-1", { type: "platform" }, "m", executor.client as never);

    const { sql: rendered, params } = renderWhere(executor);
    // No organization parameter is bound in platform scope.
    expect(params).toEqual(["job-1", "PENDING"]);
    expect(rendered.toLowerCase()).toContain("is null");
  });

  it("only cancels pending jobs in the caller's scope", async () => {
    const executor = createUpdateCapture([{ id: "job-1", status: "CANCELLED" }]);
    const repository = new JobsRepository({} as never);

    await repository.markCancelled("job-1", ORG_SCOPE, executor.client as never);

    const values = setValues(executor);
    expect(values.status).toBe("CANCELLED");

    const { params } = renderWhere(executor);
    expect(params).toEqual(["job-1", "PENDING", "org-1"]);
  });

  it("scopes listDependents through the join alias, not the shadowed table name", async () => {
    const executor = createExecuteCapture([
      { id: "dep-1", job_id: "job-2", status: "PENDING", organization_id: "org-1" },
    ]);
    const repository = new JobsRepository({} as never);

    await expect(
      repository.listDependents("job-1", ORG_SCOPE, executor.client as never),
    ).resolves.toEqual([
      { id: "dep-1", jobId: "job-2", status: "PENDING", organizationId: "org-1" },
    ]);

    const { sql: rendered, params } = renderStatement(executor.execute.mock.calls[0]![0]);

    expect(rendered).toContain("jd.depends_on_job_id = $1");
    expect(rendered).toContain("j.organization_id = $2");
    // The joined table is aliased as "j"; referencing the bare table name here
    // would be an invalid column reference at runtime.
    expect(rendered).not.toContain(`"${JOBS_TABLE}"."organization_id"`);
    expect(params).toEqual(["job-1", "org-1"]);
  });
});

describe("JobsRepository dependency-graph lock", () => {
  it.each([
    [ORG_SCOPE, "dep-graph-org-1"],
    [{ type: "platform" } as JobScope, "dep-graph-platform"],
  ])("takes the advisory transaction lock for %o", async (scope, lockKey) => {
    const executor = createExecuteCapture();
    const repository = new JobsRepository({} as never);

    await repository.acquireDependencyGraphLock(scope, executor.client as never);

    const { sql: rendered, params } = renderStatement(executor.execute.mock.calls[0]![0]);

    expect(rendered).toContain("pg_advisory_xact_lock(hashtext(");
    expect(params).toEqual([lockKey]);
  });
});
