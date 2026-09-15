import { describe, expect, it, vi } from "vitest";

import { DeleteFileUseCase } from "../delete-file.use-case";

const actor = {
  userId: "user-1",
  sessionId: "session-1",
  email: "admin@example.local",
  displayName: "Admin",
  status: "ACTIVE" as const,
  roles: ["ADMIN"],
  permissions: [],
  organizationId: "org-1",
};

const file = {
  id: "file-1",
  storageKey: "uploads/org-1/file-1/report.pdf",
  organizationId: "org-1",
};

function createUseCase(overrides: {
  objectStorage?: { delete: ReturnType<typeof vi.fn> };
  storageTracking?: { enqueueDelete: ReturnType<typeof vi.fn> };
}) {
  const fileAccessService = { findAccessibleFile: vi.fn(async () => file) };
  const filesRepository = { softDelete: vi.fn(async () => undefined) };
  const objectStorage = overrides.objectStorage ?? { delete: vi.fn(async () => undefined) };
  const storageTracking = overrides.storageTracking ?? {
    enqueueDelete: vi.fn(async () => undefined),
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const transactionPort = { run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb("tx")) };

  const useCase = new DeleteFileUseCase(
    fileAccessService as never,
    filesRepository as never,
    objectStorage as never,
    storageTracking as never,
    logger as never,
    auditWriter as never,
    transactionPort as never,
  );

  return { useCase, filesRepository, objectStorage, storageTracking, logger, auditWriter };
}

describe("DeleteFileUseCase — storage compensation", () => {
  it("soft-deletes, audits, and removes the storage object on the happy path", async () => {
    const { useCase, filesRepository, objectStorage, storageTracking, auditWriter } = createUseCase(
      {},
    );

    await useCase.execute(actor, "file-1");

    expect(filesRepository.softDelete).toHaveBeenCalledWith("file-1", "tx");
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "file.deleted", entityId: "file-1" }),
      "tx",
    );
    expect(objectStorage.delete).toHaveBeenCalledWith(file.storageKey);
    // No compensation on success.
    expect(storageTracking.enqueueDelete).not.toHaveBeenCalled();
  });

  it("logs loudly and records an outbox retry when the storage delete fails", async () => {
    const objectStorage = {
      delete: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const { useCase, storageTracking, logger } = createUseCase({ objectStorage });

    // The compensation failure must not fail the (already committed) request.
    await expect(useCase.execute(actor, "file-1")).resolves.toBeUndefined();

    expect(objectStorage.delete).toHaveBeenCalledWith(file.storageKey);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(file.storageKey),
      expect.objectContaining({ error: "storage unavailable" }),
    );
    // The orphan is recorded for StorageCleanupService instead of ignored.
    expect(storageTracking.enqueueDelete).toHaveBeenCalledWith(file.storageKey);
  });

  it("logs the outbox failure too when even recording the retry fails", async () => {
    const objectStorage = {
      delete: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const storageTracking = {
      enqueueDelete: vi.fn(async () => {
        throw new Error("outbox write failed");
      }),
    };
    const { useCase, logger } = createUseCase({ objectStorage, storageTracking });

    await expect(useCase.execute(actor, "file-1")).resolves.toBeUndefined();

    // Both compensation failures are visible — never silent.
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("enqueue delete retry"),
      expect.objectContaining({ error: "outbox write failed" }),
    );
  });
});
