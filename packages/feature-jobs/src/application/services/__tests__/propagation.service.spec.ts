import type { TransactionExecutor } from "@repo/api-kernel";

import { describe, expect, it, type Mock, vi } from "vitest";

import type { JobStatus } from "../../../domain/job-status";
import type { JobScope } from "../../ports/jobs.repository.port";
import { PropagationService } from "../propagation.service";

const ORG_SCOPE: JobScope = { type: "organization", organizationId: "org-1" };
const PLATFORM_SCOPE: JobScope = { type: "platform" };
const EXECUTOR = "tx" as unknown as TransactionExecutor;

type Graph = Record<string, { jobId: string; status: JobStatus }[]>;

type MarkBlockedFn = (jobId: string, ...rest: unknown[]) => Promise<{ id: string } | null>;
type RecordEventFn = (
  values: { jobId: string; type: string },
  ...rest: unknown[]
) => Promise<unknown>;

/**
 * BFS over a fake dependency graph. `propagateBlocked` reads the graph through
 * `listDependents` and writes through `markBlocked` + `recordEvent`, so the
 * traversal shape is fully observable without a database.
 */
function buildService(
  graph: Graph,
  overrides: { recordEvent?: Mock<RecordEventFn>; markBlocked?: Mock<MarkBlockedFn> } = {},
) {
  const listDependents = vi.fn(async (jobId: string) =>
    (graph[jobId] ?? []).map((dependent) => ({
      id: `dep-${dependent.jobId}`,
      jobId: dependent.jobId,
      status: dependent.status,
      organizationId: "org-1",
    })),
  );
  const markBlocked =
    overrides.markBlocked ?? vi.fn<MarkBlockedFn>(async (jobId) => ({ id: jobId }));
  const recordEvent = overrides.recordEvent ?? vi.fn<RecordEventFn>(async () => undefined);
  const withSavepoint = vi.fn(
    async (_executor: unknown, _name: string, fn: () => Promise<unknown>) => fn(),
  );

  const service = new PropagationService(
    { listDependents, markBlocked } as never,
    { recordEvent } as never,
    { run: vi.fn(), withTenant: vi.fn(), withSavepoint } as never,
  );

  const blockedJobIds = () => markBlocked.mock.calls.map(([jobId]) => jobId).sort();
  const traversedJobIds = () => listDependents.mock.calls.map(([jobId]) => jobId);
  const dependencyEvents = () => recordEvent.mock.calls.map(([values]) => values);

  return {
    service,
    listDependents,
    markBlocked,
    recordEvent,
    withSavepoint,
    blockedJobIds,
    traversedJobIds,
    dependencyEvents,
  };
}

describe("PropagationService.propagateBlocked", () => {
  it("blocks every pending descendant and keeps walking through blocking nodes", async () => {
    // job-1 (failed) ─┬─ job-2 (PENDING) ─── job-4 (PENDING)
    //                 └─ job-3 (FAILED)  ─── job-5 (PENDING)
    const harness = buildService({
      "job-1": [
        { jobId: "job-2", status: "PENDING" },
        { jobId: "job-3", status: "FAILED" },
      ],
      "job-2": [{ jobId: "job-4", status: "PENDING" }],
      "job-3": [{ jobId: "job-5", status: "PENDING" }],
    });

    await harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "failed", EXECUTOR);

    // job-3 is already blocking, so it is never re-blocked — but its own
    // dependents still get visited.
    expect(harness.blockedJobIds()).toEqual(["job-2", "job-4", "job-5"]);
    expect(harness.traversedJobIds()).toEqual(["job-1", "job-2", "job-3", "job-4", "job-5"]);

    expect(harness.markBlocked).toHaveBeenCalledWith(
      "job-2",
      ORG_SCOPE,
      "Dependency job-1 failed",
      EXECUTOR,
    );
    expect(harness.markBlocked).toHaveBeenCalledWith(
      "job-5",
      ORG_SCOPE,
      "Dependency job-3 failed",
      EXECUTOR,
    );

    const events = harness.dependencyEvents();
    expect(events).toHaveLength(3);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jobId: "job-2",
          type: "dependency_failed",
          message: "Dependency job-1 failed",
        }),
        expect.objectContaining({
          jobId: "job-5",
          type: "dependency_failed",
          message: "Dependency job-3 failed",
        }),
      ]),
    );
  });

  it("does not block or traverse past a COMPLETED dependent", async () => {
    const harness = buildService({
      "job-1": [{ jobId: "job-2", status: "COMPLETED" }],
      "job-2": [{ jobId: "job-3", status: "PENDING" }],
    });

    await harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "failed", EXECUTOR);

    expect(harness.markBlocked).not.toHaveBeenCalled();
    expect(harness.traversedJobIds()).toEqual(["job-1"]);
  });

  it("still traverses descendants of an already-blocking dependent", async () => {
    // H-002: a previous propagation run may have crashed mid-graph, so a node
    // that is already FAILED must not stop the walk.
    const harness = buildService({
      "job-1": [{ jobId: "job-2", status: "CANCELLED" }],
      "job-2": [{ jobId: "job-3", status: "PENDING" }],
    });

    await harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "cancelled", EXECUTOR);

    expect(harness.blockedJobIds()).toEqual(["job-3"]);
    expect(harness.traversedJobIds()).toEqual(["job-1", "job-2", "job-3"]);
  });

  it("keeps descendants unblocked when markBlocked loses the race", async () => {
    const markBlocked = vi.fn<MarkBlockedFn>(async (jobId) =>
      jobId === "job-2" ? null : { id: jobId },
    );
    const harness = buildService(
      {
        "job-1": [{ jobId: "job-2", status: "PENDING" }],
        "job-2": [{ jobId: "job-3", status: "PENDING" }],
      },
      { markBlocked },
    );

    await harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "failed", EXECUTOR);

    // job-2 is still PENDING (someone else moved it), so job-3 must not be
    // blocked: its dependency has not actually failed.
    expect(harness.blockedJobIds()).toEqual(["job-2"]);
    expect(harness.traversedJobIds()).toEqual(["job-1"]);
  });

  it("isolates a dependent whose event write fails and keeps blocking its siblings", async () => {
    const recordEvent = vi.fn<RecordEventFn>(async (values) => {
      if (values.jobId === "job-2") {
        throw new Error("event insert failed");
      }
    });
    const harness = buildService(
      {
        "job-1": [
          { jobId: "job-2", status: "PENDING" },
          { jobId: "job-3", status: "PENDING" },
        ],
        "job-2": [{ jobId: "job-4", status: "PENDING" }],
      },
      { recordEvent },
    );

    await expect(
      harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "failed", EXECUTOR),
    ).resolves.toBeUndefined();

    // job-2's savepoint rolled back, so it is not queued: its subtree (job-4)
    // is never walked and job-3's sibling handling continues.
    expect(harness.traversedJobIds()).toEqual(["job-1", "job-3"]);
    expect(harness.withSavepoint.mock.calls.map(([, name]) => name)).toEqual([
      "propagate_job-2",
      "propagate_job-3",
    ]);
    // The fake savepoint cannot roll the write back, so job-2 still shows as
    // attempted; what matters is that it was not traversed.
    expect(harness.blockedJobIds()).toEqual(["job-2", "job-3"]);
  });

  it("terminates on a dependency cycle without re-walking a visited node", async () => {
    const harness = buildService({
      "job-1": [{ jobId: "job-2", status: "PENDING" }],
      "job-2": [{ jobId: "job-1", status: "PENDING" }],
    });

    await harness.service.propagateBlocked("job-1", ORG_SCOPE, "org-1", "failed", EXECUTOR);

    expect(harness.traversedJobIds()).toEqual(["job-1", "job-2"]);
    expect(harness.blockedJobIds()).toEqual(["job-1", "job-2"]);
  });

  it("passes the caller scope through to every repository call", async () => {
    const harness = buildService({ "job-1": [{ jobId: "job-2", status: "PENDING" }] });

    await harness.service.propagateBlocked("job-1", PLATFORM_SCOPE, null, "failed", EXECUTOR);

    expect(harness.listDependents).toHaveBeenCalledWith("job-1", PLATFORM_SCOPE, EXECUTOR);
    expect(harness.markBlocked).toHaveBeenCalledWith(
      "job-2",
      PLATFORM_SCOPE,
      "Dependency job-1 failed",
      EXECUTOR,
    );
    expect(harness.dependencyEvents()[0]).toMatchObject({ jobId: "job-2", organizationId: null });
  });
});
