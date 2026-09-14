import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { MAX_DELIVERY_RETRY_ATTEMPTS } from "../../domain/delivery-policy";
import { notificationDeliveries } from "../persistence";
import { DeliveriesRepository } from "../deliveries.repository";

const dialect = new PgDialect();
const DELIVERIES_TABLE = getTableName(notificationDeliveries);

const render = (statement: SQL) => dialect.sqlToQuery(statement);

type RawExecutor = (statement: SQL) => Promise<{ rows: unknown[] }>;

/** `execute()` is the raw-statement seam the claim sweeps use. */
function createRawExecutor(rows: unknown[] = []) {
  const execute = vi.fn<RawExecutor>(async () => ({ rows }));
  return { execute };
}

/** Captures `update().set().where().returning()`. */
function createUpdateCapture(rows: unknown[] = []) {
  const returning = vi.fn(async () => rows);
  const where = vi.fn<(clause: SQL) => { returning: typeof returning }>(() => ({ returning }));
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
    where,
  }));
  const update = vi.fn(() => ({ set }));

  return { client: { update }, update, set, where, returning };
}

/** Captures the plain `select().from().where()` read used to return rows. */
function createSelectCapture(rows: unknown[]) {
  const where = vi.fn<(clause: SQL) => Promise<unknown[]>>(async () => rows);
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return { select, from, where };
}

describe("DeliveriesRepository.claimPending", () => {
  it("leases due PENDING rows atomically and reads back the claimed records", async () => {
    const claimedRow = { id: "delivery-1", status: "PROCESSING", attempts: 2 };
    const execute = vi.fn<RawExecutor>(async () => ({ rows: [{ id: "delivery-1" }] }));
    const read = createSelectCapture([claimedRow]);
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.claimPending(10, { execute, select: read.select } as never),
    ).resolves.toEqual([claimedRow]);

    const { sql: rendered, params } = render(execute.mock.calls[0]![0]);
    expect(rendered).toContain(`UPDATE ${DELIVERIES_TABLE}`);
    // The lease is taken before any send, and consumes an attempt so retries
    // are counted at claim time rather than at failure time.
    expect(rendered).toContain("status = 'PROCESSING'");
    expect(rendered).toContain("attempts = attempts + 1");
    expect(rendered).toContain("status = 'PENDING'");
    expect(rendered).toContain("next_attempt_at IS NULL OR next_attempt_at <= now()");
    // Due rows are ordered oldest-first and leased without blocking peers.
    expect(rendered).toContain("ORDER BY next_attempt_at ASC NULLS FIRST");
    expect(rendered).toContain("FOR UPDATE SKIP LOCKED");
    expect(params).toEqual([10]);

    // The returned records come from the row set the UPDATE matched.
    const readClause = render(read.where.mock.calls[0]![0]);
    expect(readClause.sql).toContain(`"${DELIVERIES_TABLE}"."id" in`);
    expect(readClause.params).toEqual(["delivery-1"]);
  });

  it("returns an empty batch without reading rows when nothing was claimed", async () => {
    const select = vi.fn();
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.claimPending(10, { execute: vi.fn(async () => ({ rows: [] })), select } as never),
    ).resolves.toEqual([]);

    expect(select).not.toHaveBeenCalled();
  });

  it("tolerates a driver result without a rows field", async () => {
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.claimPending(10, { execute: vi.fn(async () => ({})) } as never),
    ).resolves.toEqual([]);
  });
});

describe("DeliveriesRepository.upsertBatch", () => {
  it("inserts nothing for an empty batch", async () => {
    const repository = new DeliveriesRepository({} as never);

    await expect(repository.upsertBatch([], {} as never)).resolves.toEqual([]);
  });

  it("swallows re-upserts on the (notification, token, channel) index", async () => {
    const returning = vi.fn(async () => [{ id: "delivery-1" }]);
    const onConflictDoNothing = vi.fn<(config: unknown) => { returning: typeof returning }>(() => ({
      returning,
    }));
    const values = vi.fn(() => ({ onConflictDoNothing }));
    const insert = vi.fn(() => ({ values }));
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.upsertBatch(
        [{ notificationId: "notification-1", deviceTokenId: "token-1", channel: "fcm" }],
        { insert } as never,
      ),
    ).resolves.toEqual([{ id: "delivery-1" }]);

    const [config] = onConflictDoNothing.mock.calls[0]! as unknown as [{ target: unknown[] }];
    // Re-running a job must converge instead of duplicating delivery rows.
    expect(config.target).toEqual([
      notificationDeliveries.notificationId,
      notificationDeliveries.deviceTokenId,
      notificationDeliveries.channel,
    ]);
  });
});

describe("DeliveriesRepository.markSentIfProcessing", () => {
  it("only marks SENT while the row is still PROCESSING", async () => {
    const executor = createUpdateCapture([{ id: "delivery-1", status: "SENT" }]);
    const repository = new DeliveriesRepository({} as never);

    await repository.markSentIfProcessing("delivery-1", "provider-1", executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    // Without the status guard a racing transfer that already set the row to
    // FAILED could be overwritten back to SENT.
    expect(rendered).toContain(`"${DELIVERIES_TABLE}"."id" = $1`);
    expect(rendered).toContain(`"${DELIVERIES_TABLE}"."status" = $2`);
    expect(params).toEqual(["delivery-1", "PROCESSING"]);
    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "SENT", providerMessageId: "provider-1" }),
    );
  });

  it("returns null when a transfer already invalidated the row", async () => {
    const executor = createUpdateCapture([]);
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.markSentIfProcessing("delivery-1", null, executor.client as never),
    ).resolves.toBeNull();
  });
});

describe("DeliveriesRepository terminal writes", () => {
  it("stores the failure reason on markFailed", async () => {
    const executor = createUpdateCapture([{ id: "delivery-1", status: "FAILED" }]);
    const repository = new DeliveriesRepository({} as never);

    await repository.markFailed("delivery-1", "boom", executor.client as never);

    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "FAILED", lastError: "boom" }),
    );
  });

  it("clears the previous error and schedules the retry on markRetryable", async () => {
    const executor = createUpdateCapture([{ id: "delivery-1", status: "PENDING" }]);
    const repository = new DeliveriesRepository({} as never);
    const nextAttemptAt = new Date("2026-09-15T01:00:00.000Z");

    await repository.markRetryable("delivery-1", nextAttemptAt, executor.client as never);

    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "PENDING", nextAttemptAt, lastError: null }),
    );
  });
});

describe("DeliveriesRepository.recoverStaleProcessing", () => {
  it("selects expired PROCESSING leases with a bounded, lock-safe scan", async () => {
    const execute = createRawExecutor([{ id: "delivery-1" }, { id: "delivery-2" }]);
    const executor = createUpdateCapture();
    const read = createSelectCapture([{ id: "delivery-1" }, { id: "delivery-2" }]);
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.recoverStaleProcessing(5, {
        execute: execute.execute,
        update: executor.update,
        select: read.select,
      } as never),
    ).resolves.toEqual([{ id: "delivery-1" }, { id: "delivery-2" }]);

    const { sql: rendered, params } = render(execute.execute.mock.calls[0]![0]);
    expect(rendered).toContain(`FROM ${DELIVERIES_TABLE}`);
    expect(rendered).toContain("status = 'PROCESSING'");
    expect(rendered).toContain("updated_at < now() - make_interval(mins => $1)");
    expect(rendered).toContain("LIMIT 100");
    // Two workers must not recover the same lease.
    expect(rendered).toContain("FOR UPDATE SKIP LOCKED");
    expect(params).toEqual([5]);
  });

  it("splits the recovered leases into retry and permanent-failure buckets at the shared cap", async () => {
    const executor = createUpdateCapture();
    const read = createSelectCapture([]);
    const repository = new DeliveriesRepository({} as never);

    await repository.recoverStaleProcessing(5, {
      execute: createRawExecutor([{ id: "delivery-1" }]).execute,
      update: executor.update,
      select: read.select,
    } as never);

    expect(executor.update).toHaveBeenCalledTimes(2);
    const buckets = executor.set.mock.calls.map((call) => call[0]);
    expect(buckets[0]).toMatchObject({ status: "PENDING" });
    expect(buckets[1]).toMatchObject({ status: "FAILED" });

    const retry = render(executor.where.mock.calls[0]![0]!);
    const fail = render(executor.where.mock.calls[1]![0]!);

    // Both buckets read the cap from the shared domain constant, so recovery
    // and the delivery processor cannot disagree about the attempt budget.
    expect(retry.sql).toContain(`"${DELIVERIES_TABLE}"."attempts" < $2`);
    expect(fail.sql).toContain(`"${DELIVERIES_TABLE}"."attempts" >= $2`);
    expect(retry.params).toEqual(["delivery-1", MAX_DELIVERY_RETRY_ATTEMPTS]);
    expect(fail.params).toEqual(["delivery-1", MAX_DELIVERY_RETRY_ATTEMPTS]);
  });

  it("returns no rows without writing when no lease is stale", async () => {
    const executor = createUpdateCapture();
    const select = vi.fn();
    const repository = new DeliveriesRepository({} as never);

    await expect(
      repository.recoverStaleProcessing(5, {
        execute: vi.fn(async () => ({ rows: [] })),
        update: executor.update,
        select,
      } as never),
    ).resolves.toEqual([]);

    expect(executor.update).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
  });
});
