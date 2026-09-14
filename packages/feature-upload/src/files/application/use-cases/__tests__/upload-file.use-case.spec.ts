import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import { MAX_FILE_SIZE_BYTES } from "../../../domain/upload-policy";
import { UploadFileUseCase } from "../upload-file.use-case";

const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);

const actor = {
  userId: "user-1",
  sessionId: "session-1",
  email: "user@example.local",
  displayName: "User",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: "org-1",
} as AuthenticatedRequestUser;

const uploadedFile = (overrides: Record<string, unknown> = {}) => ({
  buffer: pngBuffer,
  mimetype: "image/png",
  originalname: "photo.png",
  size: pngBuffer.length,
  ...overrides,
});

const storedRecord = {
  id: "file-1",
  organizationId: "org-1",
  storageKey: "uploads/user-1/generated.png",
  originalName: "photo.png",
  mimeType: "image/png",
  sizeBytes: pngBuffer.length,
  checksum: "abc",
  latestVersion: 1,
  kind: "DEFAULT",
  visibility: "PRIVATE",
  uploadedById: "user-1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

function buildUseCase(options: { createResult?: unknown } = {}) {
  const { createResult = storedRecord } = options;
  const filesRepository = {
    create: vi.fn(async () => createResult),
    createVersion: vi.fn(async () => ({ id: "version-1" })),
  };
  const objectStorage = {
    upload: vi.fn(async ({ key }: { key: string }) => ({ key })),
    delete: vi.fn(async () => undefined),
  };
  const transactionPort = {
    withTenant: vi.fn(async (_ctx: unknown, run: (tx: unknown) => Promise<unknown>) => run("tx")),
  };
  const activityEmitter = { emit: vi.fn(async () => undefined) };
  const auditWriter = { log: vi.fn(async () => undefined) };

  return {
    filesRepository,
    objectStorage,
    transactionPort,
    activityEmitter,
    auditWriter,
    useCase: new UploadFileUseCase(
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      activityEmitter as never,
      auditWriter as never,
    ),
  };
}

describe("UploadFileUseCase", () => {
  it("stores the blob, then persists the file, its first version, audit and activity", async () => {
    const {
      useCase,
      filesRepository,
      objectStorage,
      activityEmitter,
      auditWriter,
      transactionPort,
    } = buildUseCase();

    const result = await useCase.execute(actor, uploadedFile());

    const [{ key, body, mimeType }] = objectStorage.upload.mock.calls[0]! as unknown as [
      { key: string; body: Buffer; mimeType: string },
    ];
    expect(key).toMatch(/^uploads\/user-1\/[0-9a-f-]{36}\.png$/);
    expect(body).toBe(pngBuffer);
    expect(mimeType).toBe("image/png");

    expect(transactionPort.withTenant).toHaveBeenCalledWith(
      { tenantId: "org-1", userId: "user-1" },
      expect.any(Function),
    );

    expect(filesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        originalName: "photo.png",
        mimeType: "image/png",
        latestVersion: 1,
        uploadedById: "user-1",
        storageKey: key,
        // Checksum is the SHA-256 of the exact bytes that were stored.
        checksum: createHash("sha256").update(pngBuffer).digest("hex"),
      }),
      "tx",
    );

    expect(filesRepository.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({ fileId: "file-1", organizationId: "org-1", versionNumber: 1 }),
      "tx",
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "file.uploaded", entityId: "file-1" }),
      "tx",
    );
    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: "file", entityId: "file-1", organizationId: "org-1" }),
      "tx",
    );

    // The response is the public DTO: no storage key.
    expect(result).toMatchObject({ id: "file-1", originalName: "photo.png" });
    expect(result).not.toHaveProperty("storageKey");
  });

  it("rejects a request with no file buffer", async () => {
    const { useCase, objectStorage } = buildUseCase();

    await expect(useCase.execute(actor, {} as never)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });

    expect(objectStorage.upload).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit without uploading it", async () => {
    const { useCase, objectStorage } = buildUseCase();

    await expect(
      useCase.execute(actor, uploadedFile({ size: MAX_FILE_SIZE_BYTES + 1 })),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

    expect(objectStorage.upload).not.toHaveBeenCalled();
  });

  it("rejects content whose bytes do not match an allowed type", async () => {
    const { useCase, objectStorage } = buildUseCase();

    // A .png name over plain text: the magic-byte probe refuses it.
    await expect(
      useCase.execute(actor, uploadedFile({ buffer: Buffer.from("not an image"), size: 12 })),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

    expect(objectStorage.upload).not.toHaveBeenCalled();
  });

  it("deletes the uploaded blob when persisting the file fails", async () => {
    const { useCase, objectStorage, filesRepository } = buildUseCase();
    filesRepository.create.mockRejectedValueOnce(new Error("insert failed"));

    await expect(useCase.execute(actor, uploadedFile())).rejects.toThrow("insert failed");

    // A dangling blob would be an orphan never referenced by any row.
    expect(objectStorage.delete).toHaveBeenCalledWith(objectStorage.upload.mock.calls[0]![0].key);
  });

  it("deletes the uploaded blob when the insert returns no rows", async () => {
    const { useCase, objectStorage, filesRepository } = buildUseCase({ createResult: null });

    await expect(useCase.execute(actor, uploadedFile())).rejects.toThrow(
      "File insert returned no rows",
    );

    expect(objectStorage.delete).toHaveBeenCalled();
    expect(filesRepository.createVersion).not.toHaveBeenCalled();
  });

  it("cleans up the blob when the actor has no active organization", async () => {
    const { useCase, objectStorage, filesRepository } = buildUseCase();

    await expect(
      useCase.execute({ ...actor, organizationId: null }, uploadedFile()),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });

    expect(objectStorage.delete).toHaveBeenCalled();
    expect(filesRepository.create).not.toHaveBeenCalled();
  });

  it("propagates a cleanup failure without masking the original error", async () => {
    const { useCase, objectStorage, filesRepository } = buildUseCase();
    filesRepository.create.mockRejectedValueOnce(new Error("insert failed"));
    objectStorage.delete.mockRejectedValueOnce(new Error("storage offline"));

    await expect(useCase.execute(actor, uploadedFile())).rejects.toThrow("insert failed");
  });
});
