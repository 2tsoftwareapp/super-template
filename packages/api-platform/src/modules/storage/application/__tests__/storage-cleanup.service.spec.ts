import { describe, expect, it, vi } from "vitest";

import { StorageCleanupService } from "../storage-cleanup.service";

function createService(overrides?: Record<string, unknown>) {
  const tracking = {
    listOrphans: vi.fn(async () => []),
    claimPendingDeletes: vi.fn(async () => []),
    markDeleteDone: vi.fn(async () => undefined),
    markDeleteFailed: vi.fn(async () => undefined),
    ...((overrides?.tracking as Record<string, unknown>) ?? {}),
  };

  const objectStorage = {
    delete: vi.fn(async () => undefined),
    ...((overrides?.objectStorage as Record<string, unknown>) ?? {}),
  };

  const platformTransactionPort = {
    run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>): Promise<unknown> => cb({})),
    ...((overrides?.platformTransactionPort as Record<string, unknown>) ?? {}),
  };

  const logger = {
    warn: vi.fn(),
    error: vi.fn(),
    ...((overrides?.logger as Record<string, unknown>) ?? {}),
  };

  const errorReporter = {
    reportException: vi.fn(),
    reportMessage: vi.fn(),
    ...((overrides?.errorReporter as Record<string, unknown>) ?? {}),
  };

  const service = new StorageCleanupService(
    tracking as never,
    objectStorage as never,
    platformTransactionPort as never,
    logger as never,
    errorReporter as never,
  );

  return { service, tracking, objectStorage, platformTransactionPort, logger, errorReporter };
}

describe("StorageCleanupService", () => {
  it("sweeps orphaned objects and marks them deleted", async () => {
    const { service, tracking, objectStorage, platformTransactionPort } = createService({
      tracking: {
        listOrphans: vi
          .fn()
          .mockResolvedValueOnce(["uploads/orphan-1.png", "uploads/orphan-2.png"])
          .mockResolvedValueOnce([]),
        claimPendingDeletes: vi.fn(async () => []),
      },
    });

    await service.runCleanup();

    expect(platformTransactionPort.run).toHaveBeenCalled();
    expect(objectStorage.delete).toHaveBeenCalledWith("uploads/orphan-1.png");
    expect(objectStorage.delete).toHaveBeenCalledWith("uploads/orphan-2.png");
    expect(tracking.listOrphans).toHaveBeenCalledTimes(2);
  });

  it("continues sweeping when an orphan delete fails (retry via outbox)", async () => {
    const { service, objectStorage, logger } = createService({
      tracking: {
        listOrphans: vi
          .fn()
          .mockResolvedValueOnce(["uploads/orphan-1.png", "uploads/orphan-2.png"])
          .mockResolvedValueOnce([]),
        claimPendingDeletes: vi.fn(async () => []),
      },
      objectStorage: {
        delete: vi
          .fn()
          .mockRejectedValueOnce(new Error("storage unreachable"))
          .mockResolvedValueOnce(undefined),
      },
    });

    await service.runCleanup();

    expect(objectStorage.delete).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("swept 1 orphaned object(s)"));
  });

  it("processes pending delete retries and marks them done", async () => {
    const { service, tracking, objectStorage } = createService({
      tracking: {
        listOrphans: vi.fn(async () => []),
        claimPendingDeletes: vi
          .fn()
          .mockResolvedValueOnce([
            { id: "row-1", storageKey: "uploads/a.png", attempts: 0, maxAttempts: 5 },
          ])
          .mockResolvedValueOnce([]),
        markDeleteDone: vi.fn(async () => undefined),
      },
    });

    await service.runCleanup();

    expect(objectStorage.delete).toHaveBeenCalledWith("uploads/a.png");
    expect(tracking.markDeleteDone).toHaveBeenCalledWith("row-1");
    expect(tracking.markDeleteFailed).not.toHaveBeenCalled();
  });

  it("marks a failed retry and logs when attempts are exhausted", async () => {
    const { service, tracking, logger } = createService({
      tracking: {
        listOrphans: vi.fn(async () => []),
        claimPendingDeletes: vi
          .fn()
          .mockResolvedValueOnce([
            { id: "row-1", storageKey: "uploads/a.png", attempts: 4, maxAttempts: 5 },
          ])
          .mockResolvedValueOnce([]),
        markDeleteFailed: vi.fn(async () => undefined),
      },
      objectStorage: {
        delete: vi.fn(async () => {
          throw new Error("still unreachable");
        }),
      },
    });

    await service.runCleanup();

    expect(tracking.markDeleteFailed).toHaveBeenCalledWith("row-1", "still unreachable");
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("exhausted retries"),
      expect.objectContaining({ error: "still unreachable" }),
    );
  });

  it("reports and logs when a cleanup phase throws", async () => {
    const { service, logger, errorReporter } = createService({
      tracking: {
        listOrphans: vi.fn(async () => {
          throw new Error("query failed");
        }),
      },
    });

    await service.runCleanup();

    expect(logger.error).toHaveBeenCalledWith(
      "Storage cleanup failed",
      expect.objectContaining({ error: "query failed" }),
    );
    expect(errorReporter.reportException).toHaveBeenCalled();
  });

  it("does not re-enter while a previous run is still in flight", async () => {
    const { service, tracking } = createService({
      tracking: {
        listOrphans: vi.fn(() => new Promise((resolve) => setTimeout(() => resolve([]), 5))),
        claimPendingDeletes: vi.fn(async () => []),
      },
    });

    const first = service.runCleanup();
    await service.runCleanup();
    await first;

    expect(tracking.listOrphans).toHaveBeenCalledTimes(1);
  });
});
