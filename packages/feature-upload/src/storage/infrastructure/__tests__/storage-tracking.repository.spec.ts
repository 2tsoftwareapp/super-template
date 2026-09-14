import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { storageDeleteOutbox } from "../../../infrastructure/persistence";
import { StorageTrackingRepository } from "../storage-tracking.repository";

const dialect = new PgDialect();
const OUTBOX_TABLE = getTableName(storageDeleteOutbox);

const render = (statement: SQL) => dialect.sqlToQuery(statement);

/** Raw-statement capture: `execute()` is the only thing these sweeps call. */
function createExecuteExecutor(rows: unknown[] = []) {
  const execute = vi.fn<(statement: SQL) => Promise<{ rows: unknown[] }>>(async () => ({ rows }));
  return { client: { execute }, execute };
}

/** Captures `insert().values().onConflict...()` and `update().set().where()`. */
function createWriteExecutor() {
  const onConflictDoNothing = vi.fn(async () => undefined);
  const onConflictDoUpdate = vi.fn<(config: unknown) => Promise<void>>(async () => undefined);
  const values = vi.fn(() => ({ onConflictDoNothing, onConflictDoUpdate }));
  const insert = vi.fn(() => ({ values }));

  const where = vi.fn(async () => undefined);
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
    where,
  }));
  const update = vi.fn(() => ({ set }));

  return {
    client: { insert, update },
    insert,
    values,
    onConflictDoNothing,
    onConflictDoUpdate,
    update,
    set,
    where,
  };
}

describe("StorageTrackingRepository.claimPendingDeletes", () => {
  it("claims a bounded batch of PENDING deletes with SKIP LOCKED", async () => {
    const executor = createExecuteExecutor([
      { id: "row-1", storageKey: "uploads/a.png", attempts: 1, maxAttempts: 5 },
    ]);
    const repository = new StorageTrackingRepository({} as never);

    await expect(repository.claimPendingDeletes(25, executor.client as never)).resolves.toEqual([
      { id: "row-1", storageKey: "uploads/a.png", attempts: 1, maxAttempts: 5 },
    ]);

    const { sql: rendered, params } = render(executor.execute.mock.calls[0]![0]);

    expect(rendered).toContain(`UPDATE ${OUTBOX_TABLE}`);
    expect(rendered).toContain("status = 'PENDING'");
    expect(rendered).toContain("ORDER BY created_at ASC");
    expect(rendered).toContain("LIMIT $1");
    // Concurrent workers must take distinct rows rather than block or double-claim.
    expect(rendered).toContain("FOR UPDATE SKIP LOCKED");
    // The claimed rows are handed back with their attempt budget for backoff.
    expect(rendered).toContain('storage_key AS "storageKey"');
    expect(rendered).toContain('max_attempts AS "maxAttempts"');
    expect(params).toEqual([25]);
  });

  it("returns an empty batch when nothing is pending", async () => {
    const repository = new StorageTrackingRepository({} as never);

    await expect(
      repository.claimPendingDeletes(10, createExecuteExecutor([]).client as never),
    ).resolves.toEqual([]);
  });

  it("tolerates a driver result without a rows field", async () => {
    const repository = new StorageTrackingRepository({} as never);
    const execute = vi.fn(async () => ({}));

    await expect(repository.claimPendingDeletes(10, { execute } as never)).resolves.toEqual([]);
  });
});

describe("StorageTrackingRepository.listOrphans", () => {
  it("finds uploaded objects past the cutoff that no live file or version references", async () => {
    const executor = createExecuteExecutor([{ storageKey: "uploads/orphan.png" }]);
    const repository = new StorageTrackingRepository({} as never);
    const cutoff = new Date("2026-01-01T00:00:00.000Z");

    await expect(repository.listOrphans(cutoff, 50, executor.client as never)).resolves.toEqual([
      "uploads/orphan.png",
    ]);

    const { sql: rendered, params } = render(executor.execute.mock.calls[0]![0]);

    expect(rendered).toContain("FROM t_storage_objects");
    expect(rendered).toContain("so.status = 'UPLOADED'");
    expect(rendered).toContain("so.updated_at < $1");
    // Both reference checks must be present: a key still used by the current
    // file row or by any version is not an orphan.
    expect(rendered).toContain("FROM m_files");
    expect(rendered).toContain("FROM t_file_versions");
    expect(rendered.toLowerCase()).toContain("not exists");
    expect(rendered).toContain("deleted_at IS NULL");
    expect(rendered).toContain("ORDER BY so.updated_at ASC");
    expect(rendered).toContain("LIMIT $2");
    expect(params).toEqual([cutoff, 50]);
  });

  it("returns no keys when the sweep finds nothing", async () => {
    const repository = new StorageTrackingRepository({} as never);

    await expect(
      repository.listOrphans(new Date(), 10, createExecuteExecutor([]).client as never),
    ).resolves.toEqual([]);
  });
});

describe("StorageTrackingRepository delete outbox writes", () => {
  it("enqueues a retry without resetting the attempt counter", async () => {
    const executor = createWriteExecutor();
    const repository = new StorageTrackingRepository({} as never);

    await repository.enqueueDelete("uploads/a.png", executor.client as never);

    expect(executor.values).toHaveBeenCalledWith({ storageKey: "uploads/a.png" });
    const [config] = executor.onConflictDoUpdate.mock.calls[0]! as [
      { target: unknown; set: Record<string, unknown> },
    ];
    expect(config.target).toBe(storageDeleteOutbox.storageKey);
    // Only status/updatedAt are reset — `attempts` keeps its backoff progress.
    expect(Object.keys(config.set).sort()).toEqual(["status", "updatedAt"]);
    expect(config.set.status).toBe("PENDING");
  });

  it("marks a claimed row done and clears the stored error", async () => {
    const executor = createWriteExecutor();
    const repository = new StorageTrackingRepository({} as never);

    await repository.markDeleteDone("row-1", executor.client as never);

    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "DONE", errorMessage: null }),
    );
  });

  it("increments attempts and parks the row once the budget is spent", async () => {
    const executor = createWriteExecutor();
    const repository = new StorageTrackingRepository({} as never);

    await repository.markDeleteFailed("row-1", "storage offline", executor.client as never);

    const values = executor.set.mock.calls[0]![0] as { status: unknown; attempts: unknown };
    // The terminal decision is made in SQL against max_attempts, so a retry
    // cannot exceed the row's own budget.
    const status = dialect.sqlToQuery(values.status as SQL).sql;
    const attempts = dialect.sqlToQuery(values.attempts as SQL).sql;
    expect(status).toContain("attempts + 1 >= max_attempts");
    expect(status).toContain("'FAILED'");
    expect(status).toContain("'PENDING'");
    expect(attempts).toBe("attempts + 1");
  });
});
