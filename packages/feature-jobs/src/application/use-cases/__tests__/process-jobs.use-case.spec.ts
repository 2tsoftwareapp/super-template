import type { JobHandlerContext, JsonObject } from "@repo/api-kernel";

import {
  getTenantContext,
  redactSensitive,
  TenantContextService,
  tenantContextForJob,
  WORKER_DISPATCH_CONTEXT,
} from "@repo/api-kernel";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import {
  computeRetryDelay,
  HANDLER_TIMEOUT_MS,
  resolveFailureOutcome,
} from "../../../domain/job-lifecycle";
import type { JobRecord } from "../../ports/jobs.repository.port";
import { JobHandlersRegistry } from "../../services/job-handlers.registry";
import { ProcessJobsUseCase } from "../process-jobs.use-case";

const NOW = new Date("2026-09-15T10:00:00.000Z");
const JOB_TYPE = "test.job";
/** Opaque executor handle: the use case dereferences nothing on it. */
const TX = "tx";

type ClaimDueJobsFn = (limit: number, workerId: string) => Promise<JobRecord[]>;
type MarkCompletedFn = (
  jobId: string,
  workerId: string,
  attempts: number,
  executor?: unknown,
) => Promise<JobRecord | null>;
type MarkFailedFn = (
  jobId: string,
  message: string,
  workerId: string,
  attempts: number,
  executor?: unknown,
) => Promise<JobRecord | null>;
type RequeueForRetryFn = (
  jobId: string,
  scheduledAt: Date,
  message: string,
  workerId: string,
  attempts: number,
  executor?: unknown,
) => Promise<JobRecord | null>;
type StartAttemptFn = (
  values: { jobId: string; organizationId: string | null; attemptNumber: number },
  executor?: unknown,
) => Promise<{ id: string }>;

interface RecordedEvent {
  jobId: string;
  organizationId: string | null;
  attemptId?: string | null;
  type: string;
  message?: string | null;
  metadata?: JsonObject | null;
}
type RecordEventFn = (values: RecordedEvent, executor?: unknown) => Promise<unknown>;

const buildJob = (overrides: Partial<JobRecord> = {}): JobRecord => ({
  id: "job-1",
  organizationId: "org-1",
  type: JOB_TYPE,
  payload: { hello: "world" },
  status: "PROCESSING",
  scheduledAt: new Date("2026-09-15T09:00:00.000Z"),
  priority: 0,
  attempts: 1,
  maxAttempts: 3,
  processingStartedAt: new Date("2026-09-15T09:59:00.000Z"),
  leaseExpiresAt: new Date("2026-09-15T10:04:00.000Z"),
  workerId: "worker-abc",
  startedAt: new Date("2026-09-15T09:59:00.000Z"),
  completedAt: null,
  cancelledAt: null,
  errorMessage: null,
  createdById: "user-1",
  idempotencyKey: null,
  createdAt: new Date("2026-09-15T08:00:00.000Z"),
  updatedAt: new Date("2026-09-15T09:59:00.000Z"),
  ...overrides,
});

/**
 * Wires the use case with a real TenantContextService + JobHandlersRegistry and
 * fake repositories, so the test exercises the production control flow and only
 * the persistence boundary is substituted.
 */
function buildHarness(
  options: {
    /** Rows the claim returns. The worker is expected to process exactly these. */
    claimed?: JobRecord[];
    /** Handler body override; the default resolves successfully. */
    handlerOverride?: (context: JobHandlerContext) => Promise<void>;
    /** Set false to simulate a job type nobody registered a handler for. */
    registerHandler?: boolean;
    markCompleted?: Mock<MarkCompletedFn>;
    markFailed?: Mock<MarkFailedFn>;
    startAttempt?: Mock<StartAttemptFn>;
  } = {},
) {
  const claimed = options.claimed ?? [buildJob()];
  const ambientContexts: { claim?: unknown; handler?: unknown } = {};
  const handlerContexts: JobHandlerContext[] = [];

  const claimDueJobs = vi.fn<ClaimDueJobsFn>(async () => {
    ambientContexts.claim = getTenantContext();
    return claimed;
  });
  const markCompleted =
    options.markCompleted ?? vi.fn<MarkCompletedFn>(async () => claimed[0] ?? null);
  const markFailed = options.markFailed ?? vi.fn<MarkFailedFn>(async () => claimed[0] ?? null);
  const requeueForRetry = vi.fn<RequeueForRetryFn>(async () => claimed[0] ?? null);

  const jobsRepository = { claimDueJobs, markCompleted, markFailed, requeueForRetry };

  const startAttempt =
    options.startAttempt ??
    vi.fn<StartAttemptFn>(async (values) => ({ id: `attempt-${values.jobId}` }));
  const finishAttempt = vi.fn(async () => null);
  const recordEvent = vi.fn<RecordEventFn>(async () => undefined);

  const jobObservabilityRepository = { startAttempt, finishAttempt, recordEvent };

  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(TX)),
    withTenant: vi.fn(async (_ctx: unknown, fn: (tx: unknown) => Promise<unknown>) => fn(TX)),
    withSavepoint: vi.fn(async (_tx: unknown, _name: string, fn: () => Promise<unknown>) => fn()),
  };

  const activityEmitter = { emit: vi.fn(async () => undefined) };
  const propagationService = { propagateBlocked: vi.fn(async () => undefined) };

  const jobHandlersRegistry = new JobHandlersRegistry();
  if (options.registerHandler !== false) {
    jobHandlersRegistry.registerHandler(JOB_TYPE, async (context) => {
      handlerContexts.push(context);
      ambientContexts.handler = getTenantContext();
      await (options.handlerOverride ?? (async () => undefined))(context);
    });
  }

  const useCase = new ProcessJobsUseCase(
    jobsRepository as never,
    new TenantContextService(),
    jobHandlersRegistry,
    jobObservabilityRepository as never,
    transactionPort as never,
    activityEmitter as never,
    propagationService as never,
  );

  /** The worker id the claim was made with; the lease fence must reuse it. */
  const claimedWorkerId = () => claimDueJobs.mock.calls[0]![1];
  const eventsOfType = (type: string) =>
    recordEvent.mock.calls.map(([values]) => values).filter((values) => values.type === type);

  return {
    useCase,
    jobsRepository,
    jobObservabilityRepository,
    transactionPort,
    activityEmitter,
    propagationService,
    handlerContexts,
    ambientContexts,
    claimedWorkerId,
    eventsOfType,
  };
}

const throwingHandler = (error: unknown) => async () => {
  throw error;
};

describe("ProcessJobsUseCase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    // computeRetryDelay() adds Math.random() jitter; pinning it makes the
    // scheduled retryAt reproducible instead of a range assertion.
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("completes a job whose handler resolves and records the completion once", async () => {
    const harness = buildHarness();

    await harness.useCase.execute();

    const [limit, workerId] = harness.jobsRepository.claimDueJobs.mock.calls[0]!;
    expect(limit).toBeGreaterThan(0);
    expect(workerId).toMatch(/^worker-/);

    // The same worker identity that claimed must fence the terminal write.
    expect(harness.jobsRepository.markCompleted).toHaveBeenCalledWith("job-1", workerId, 1, TX);
    expect(harness.jobObservabilityRepository.startAttempt).toHaveBeenCalledWith(
      { jobId: "job-1", organizationId: "org-1", attemptNumber: 1 },
      TX,
    );
    expect(harness.jobObservabilityRepository.finishAttempt).toHaveBeenCalledWith(
      "attempt-job-1",
      { status: "COMPLETED" },
      TX,
    );
    expect(harness.eventsOfType("completed")).toHaveLength(1);
    expect(harness.activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", entityType: "job", entityId: "job-1" }),
      TX,
    );

    expect(harness.jobsRepository.requeueForRetry).not.toHaveBeenCalled();
    expect(harness.jobsRepository.markFailed).not.toHaveBeenCalled();
    expect(harness.propagationService.propagateBlocked).not.toHaveBeenCalled();
  });

  it("claims cross-tenant and runs the handler inside the job's own tenant context", async () => {
    const harness = buildHarness();

    await harness.useCase.execute();

    expect(harness.ambientContexts.claim).toEqual(WORKER_DISPATCH_CONTEXT);
    expect(harness.ambientContexts.handler).toEqual(
      tenantContextForJob({ organizationId: "org-1", actorUserId: "user-1" }),
    );
    expect(harness.handlerContexts[0]).toEqual({
      jobId: "job-1",
      payload: { hello: "world" },
      organizationId: "org-1",
      createdById: "user-1",
    });
  });

  it("does not emit an activity entry for platform-scope jobs", async () => {
    const harness = buildHarness({ claimed: [buildJob({ organizationId: null })] });

    await harness.useCase.execute();

    expect(harness.jobsRepository.markCompleted).toHaveBeenCalledTimes(1);
    expect(harness.activityEmitter.emit).not.toHaveBeenCalled();
  });

  it("requeues with domain backoff while attempts remain", async () => {
    const job = buildJob({ attempts: 1, maxAttempts: 3, payload: { to: "user@example.test" } });
    const harness = buildHarness({
      claimed: [job],
      handlerOverride: throwingHandler(new Error("boom")),
    });

    await harness.useCase.execute();

    expect(harness.jobsRepository.requeueForRetry).toHaveBeenCalledTimes(1);
    const [jobId, scheduledAt, message, workerId, attempts, tx] =
      harness.jobsRepository.requeueForRetry.mock.calls[0]!;

    expect(jobId).toBe("job-1");
    expect(workerId).toBe(harness.claimedWorkerId());
    expect(attempts).toBe(job.attempts);
    expect(message).toBe("boom");
    expect(tx).toBe(TX);
    // Expected retryAt is derived from the domain helper, not re-derived here.
    expect(scheduledAt.getTime()).toBe(NOW.getTime() + computeRetryDelay(job.attempts));

    expect(harness.jobObservabilityRepository.finishAttempt).toHaveBeenCalledWith(
      "attempt-job-1",
      { status: "FAILED", errorMessage: "boom" },
      TX,
    );
    expect(harness.eventsOfType("retry_scheduled")).toHaveLength(1);
    expect(harness.eventsOfType("retry_scheduled")[0]).toMatchObject({
      jobId: "job-1",
      message: "boom",
      metadata: { payload: { to: "user@example.test" } },
    });

    expect(harness.jobsRepository.markFailed).not.toHaveBeenCalled();
    expect(harness.propagationService.propagateBlocked).not.toHaveBeenCalled();
  });

  it("fails permanently once attempts are exhausted and never leaks secrets into the event", async () => {
    const job = buildJob({
      attempts: 3,
      maxAttempts: 3,
      payload: { to: "user@example.test", password: "hunter2" },
    });
    const harness = buildHarness({
      claimed: [job],
      handlerOverride: throwingHandler(new Error("boom")),
    });

    await harness.useCase.execute();

    expect(harness.jobsRepository.requeueForRetry).not.toHaveBeenCalled();
    expect(harness.jobsRepository.markFailed).toHaveBeenCalledWith(
      "job-1",
      "boom",
      harness.claimedWorkerId(),
      3,
      TX,
    );

    const failedEvents = harness.eventsOfType("failed");
    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0]).toMatchObject({
      message: "boom",
      metadata: { payload: redactSensitive(job.payload) },
    });
    expect(JSON.stringify(failedEvents[0])).not.toContain("hunter2");

    expect(harness.propagationService.propagateBlocked).toHaveBeenCalledWith(
      "job-1",
      { type: "organization", organizationId: "org-1" },
      "org-1",
      "failed",
      TX,
    );
  });

  it.each([1, 2, 3])(
    "follows the domain failure policy at attempt %i for maxAttempts=3",
    async (attempts) => {
      const harness = buildHarness({
        claimed: [buildJob({ attempts, maxAttempts: 3 })],
        handlerOverride: throwingHandler(new Error("boom")),
      });

      await harness.useCase.execute();

      const decision = resolveFailureOutcome({ attempts, maxAttempts: 3 });
      if (decision.action === "retry") {
        expect(harness.jobsRepository.requeueForRetry).toHaveBeenCalledTimes(1);
        expect(harness.jobsRepository.markFailed).not.toHaveBeenCalled();
      } else {
        expect(harness.jobsRepository.markFailed).toHaveBeenCalledTimes(1);
        expect(harness.jobsRepository.requeueForRetry).not.toHaveBeenCalled();
      }
    },
  );

  it("reports a non-Error throw as an unknown processing error", async () => {
    const harness = buildHarness({
      claimed: [buildJob({ attempts: 3, maxAttempts: 3 })],
      handlerOverride: throwingHandler("nope"),
    });

    await harness.useCase.execute();

    expect(harness.jobsRepository.markFailed).toHaveBeenCalledWith(
      "job-1",
      "Unknown processing error",
      expect.any(String),
      3,
      TX,
    );
  });

  it("fails a job whose type has no registered handler", async () => {
    const harness = buildHarness({ registerHandler: false });

    await harness.useCase.execute();

    const message = `No handler registered for job type "${JOB_TYPE}"`;

    expect(harness.handlerContexts).toHaveLength(0);
    expect(harness.jobsRepository.markFailed).toHaveBeenCalledWith(
      "job-1",
      message,
      harness.claimedWorkerId(),
      1,
      TX,
    );
    expect(harness.jobsRepository.markCompleted).not.toHaveBeenCalled();
    expect(harness.eventsOfType("no_handler")).toHaveLength(1);
    expect(harness.eventsOfType("no_handler")[0]).toMatchObject({ jobId: "job-1", message });
    expect(harness.propagationService.propagateBlocked).toHaveBeenCalledWith(
      "job-1",
      { type: "organization", organizationId: "org-1" },
      "org-1",
      "no handler",
      TX,
    );
  });

  it("records the completion side effects only once when the same job is claimed twice", async () => {
    const job = buildJob();
    const harness = buildHarness({
      claimed: [job],
      markCompleted: vi
        .fn<MarkCompletedFn>()
        .mockResolvedValueOnce(job)
        .mockResolvedValueOnce(null),
    });

    await harness.useCase.execute();
    await harness.useCase.execute();

    // Both runs reached the guarded terminal write ...
    expect(harness.jobsRepository.markCompleted).toHaveBeenCalledTimes(2);
    // ... and the handler body ran twice, so handlers must be idempotent ...
    expect(harness.handlerContexts).toHaveLength(2);
    // ... but the second write lost the fence, so completion is recorded once.
    expect(harness.jobObservabilityRepository.finishAttempt).toHaveBeenCalledTimes(1);
    expect(harness.eventsOfType("completed")).toHaveLength(1);
    expect(harness.activityEmitter.emit).toHaveBeenCalledTimes(1);
  });

  it("skips failure side effects when the lease fence rejects the terminal write", async () => {
    const harness = buildHarness({
      claimed: [buildJob({ attempts: 3, maxAttempts: 3 })],
      handlerOverride: throwingHandler(new Error("boom")),
      markFailed: vi.fn<MarkFailedFn>(async () => null),
    });

    await harness.useCase.execute();

    expect(harness.jobObservabilityRepository.finishAttempt).not.toHaveBeenCalled();
    expect(harness.eventsOfType("failed")).toHaveLength(0);
    expect(harness.propagationService.propagateBlocked).not.toHaveBeenCalled();
  });

  it("isolates a job whose attempt bookkeeping throws and keeps processing the batch", async () => {
    const harness = buildHarness({
      claimed: [buildJob({ id: "job-1" }), buildJob({ id: "job-2" })],
      startAttempt: vi.fn<StartAttemptFn>(async (values) => {
        if (values.jobId === "job-1") {
          throw new Error("attempt insert failed");
        }
        return { id: `attempt-${values.jobId}` };
      }),
    });

    await expect(harness.useCase.execute()).resolves.toBeUndefined();

    // The job never reached a terminal status, so the event must not claim one:
    // no "failed" event, and the error is visible as a processing error instead.
    expect(harness.eventsOfType("failed")).toHaveLength(0);

    const isolated = harness.eventsOfType("processing_error");
    expect(isolated).toHaveLength(1);
    expect(isolated[0]).toMatchObject({
      jobId: "job-1",
      message:
        "Job left PROCESSING; error before a terminal status was recorded: attempt insert failed",
    });

    expect(harness.jobsRepository.markFailed).not.toHaveBeenCalled();
    expect(harness.jobsRepository.markCompleted).toHaveBeenCalledTimes(1);
    expect(harness.jobsRepository.markCompleted).toHaveBeenCalledWith(
      "job-2",
      expect.any(String),
      1,
      TX,
    );
  });

  it("treats a handler exceeding the domain timeout as a failure", async () => {
    const harness = buildHarness({
      handlerOverride: () => new Promise<never>(() => undefined),
    });

    const run = harness.useCase.execute();
    await vi.advanceTimersByTimeAsync(HANDLER_TIMEOUT_MS);
    await run;

    const message = `Handler timed out after ${HANDLER_TIMEOUT_MS}ms`;

    expect(harness.jobsRepository.requeueForRetry).toHaveBeenCalledWith(
      "job-1",
      expect.any(Date),
      message,
      expect.any(String),
      1,
      TX,
    );
    expect(harness.jobsRepository.markCompleted).not.toHaveBeenCalled();
  });

  it("does nothing when the claim finds no due job", async () => {
    const harness = buildHarness({ claimed: [] });

    await harness.useCase.execute();

    expect(harness.handlerContexts).toHaveLength(0);
    expect(harness.jobObservabilityRepository.startAttempt).not.toHaveBeenCalled();
    expect(harness.jobsRepository.markCompleted).not.toHaveBeenCalled();
    expect(harness.jobsRepository.markFailed).not.toHaveBeenCalled();
  });
});
