import { describe, expect, it, vi } from "vitest";

import { AppError } from "@repo/api-kernel";
import { FILE_ERROR_CODES } from "@repo/feature-upload/contracts";

import { DownloadLocalFileUseCase } from "../download-local-file.use-case";

const file = {
  id: "file-1",
  organizationId: "org-1",
  storageKey: "uploads/user-1/report.csv",
  originalName: "report.csv",
  mimeType: "text/csv",
  sizeBytes: 12,
  checksum: null,
  latestVersion: 1,
  kind: "default",
  visibility: "private",
  uploadedById: "user-1",
  deletedAt: null as Date | null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function createHarness(
  options: {
    enabled?: boolean;
    storedFile?: typeof file | null;
    tokenError?: Error;
  } = {},
) {
  const filesRepository = {
    findById: vi.fn(async () => (options.storedFile === undefined ? file : options.storedFile)),
  };
  const objectStorage = { read: vi.fn(async () => Buffer.from("a,b\n1,2\n")) };
  const platformTransactionPort = {
    run: vi.fn(async (operation: (tx: unknown) => Promise<unknown>) => operation({})),
  };
  const localFileDownloadUrlService = {
    isEnabled: vi.fn(() => options.enabled ?? true),
    assertValidToken: vi.fn(() => {
      if (options.tokenError) {
        throw options.tokenError;
      }
    }),
  };

  const useCase = new DownloadLocalFileUseCase(
    filesRepository as never,
    objectStorage as never,
    platformTransactionPort as never,
    localFileDownloadUrlService as never,
  );

  return { useCase, filesRepository, objectStorage, localFileDownloadUrlService };
}

describe("DownloadLocalFileUseCase", () => {
  it("reads the object after validating the capability token", async () => {
    const { useCase, objectStorage, localFileDownloadUrlService } = createHarness();

    const result = await useCase.execute("file-1", "token-value");

    expect(localFileDownloadUrlService.assertValidToken).toHaveBeenCalledWith(
      "file-1",
      file.storageKey,
      "token-value",
    );
    expect(objectStorage.read).toHaveBeenCalledWith(file.storageKey);
    expect(result.file.id).toBe("file-1");
  });

  it("rejects an invalid or expired token", async () => {
    const tokenError = new AppError("AUTH_FORBIDDEN", "Download token is invalid", 403);
    const { useCase, objectStorage } = createHarness({ tokenError });

    await expect(useCase.execute("file-1", "stale")).rejects.toBe(tokenError);
    expect(objectStorage.read).not.toHaveBeenCalled();
  });

  it("fails closed when the driver is not local", async () => {
    const { useCase, filesRepository } = createHarness({ enabled: false });

    await expect(useCase.execute("file-1", "token")).rejects.toBeInstanceOf(AppError);
    expect(filesRepository.findById).not.toHaveBeenCalled();
  });

  it("returns not found for a deleted file", async () => {
    const { useCase } = createHarness({ storedFile: { ...file, deletedAt: new Date() } });

    await expect(useCase.execute("file-1", "token")).rejects.toMatchObject({
      code: FILE_ERROR_CODES.FILE_NOT_FOUND,
    });
  });

  it("returns not found when the row is missing", async () => {
    const { useCase } = createHarness({ storedFile: null });

    await expect(useCase.execute("file-1", "token")).rejects.toMatchObject({
      code: FILE_ERROR_CODES.FILE_NOT_FOUND,
    });
  });

  it("uses the platform transaction so the token check does not depend on a request tenant", async () => {
    const { useCase, filesRepository } = createHarness();

    await useCase.execute("file-1", "token");

    expect(filesRepository.findById).toHaveBeenCalledWith("file-1", {});
  });
});
