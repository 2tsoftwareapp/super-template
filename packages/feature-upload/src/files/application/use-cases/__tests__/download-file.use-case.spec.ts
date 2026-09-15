import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ACTION, ERROR_CODES, perm } from "@repo/api-runtime";
import { FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../../services/file-access.service";
import { DownloadFileUseCase } from "../download-file.use-case";

const file = {
  id: "file-1",
  organizationId: "org-1",
  storageKey: "uploads/user-1/abc.png",
  originalName: "abc.png",
  mimeType: "image/png",
  sizeBytes: 4,
  checksum: "abc",
  latestVersion: 1,
  kind: FILE_KIND.DEFAULT,
  visibility: FILE_VISIBILITY.PRIVATE,
  uploadedById: "user-1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const content = Buffer.from("data");

const actor = {
  userId: "user-1",
  sessionId: "session-1",
  email: "user@example.local",
  displayName: "User",
  status: "ACTIVE",
  // "USER" is owned by feature-access-control; the literal keeps this spec import-free.
  roles: ["USER"],
  permissions: [perm("files", ACTION.READ)],
  organizationId: "org-1",
} as AuthenticatedRequestUser;

function buildUseCase(options: { local?: boolean; record?: unknown } = {}) {
  const { local = true, record = file } = options;
  const filesRepository = { findById: vi.fn(async () => record) };
  const objectStorage = { read: vi.fn(async () => content) };
  const localFileDownloadUrlService = {
    isEnabled: vi.fn(() => local),
    expiresInSeconds: 3600,
    assertValidToken: vi.fn(),
  };

  return {
    filesRepository,
    objectStorage,
    localFileDownloadUrlService,
    useCase: new DownloadFileUseCase(
      new FileAccessService(filesRepository as never),
      objectStorage as never,
      localFileDownloadUrlService as never,
    ),
  };
}

describe("DownloadFileUseCase", () => {
  it("reads the object after validating the token on the local driver", async () => {
    const { useCase, objectStorage, localFileDownloadUrlService } = buildUseCase();

    await expect(useCase.execute(actor, "file-1", "1700000000000.sig")).resolves.toEqual({
      content,
      file,
    });

    // The token is bound to the file id and storage key the gate resolved.
    expect(localFileDownloadUrlService.assertValidToken).toHaveBeenCalledWith(
      "file-1",
      "uploads/user-1/abc.png",
      "1700000000000.sig",
    );
    expect(objectStorage.read).toHaveBeenCalledWith("uploads/user-1/abc.png");
  });

  it("refuses to read the object when the local token is rejected", async () => {
    const { useCase, objectStorage, localFileDownloadUrlService } = buildUseCase();
    localFileDownloadUrlService.assertValidToken.mockImplementation(() => {
      throw new Error("Download token is invalid or expired");
    });

    await expect(useCase.execute(actor, "file-1", "forged")).rejects.toThrow(
      "Download token is invalid or expired",
    );

    // No bytes leave storage when the token does not verify.
    expect(objectStorage.read).not.toHaveBeenCalled();
  });

  it("does not require a token when a remote driver serves the download", async () => {
    const { useCase, objectStorage, localFileDownloadUrlService } = buildUseCase({ local: false });

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual({ content, file });

    expect(localFileDownloadUrlService.assertValidToken).not.toHaveBeenCalled();
    expect(objectStorage.read).toHaveBeenCalledWith("uploads/user-1/abc.png");
  });

  it("applies the access gate before validating any token", async () => {
    const { useCase, localFileDownloadUrlService, objectStorage } = buildUseCase();

    await expect(
      useCase.execute({ ...actor, userId: "user-2" }, "file-1", "token"),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });

    expect(localFileDownloadUrlService.assertValidToken).not.toHaveBeenCalled();
    expect(objectStorage.read).not.toHaveBeenCalled();
  });

  it("reports a missing file as FILE_NOT_FOUND", async () => {
    const { useCase, objectStorage } = buildUseCase({ record: null });

    await expect(useCase.execute(actor, "file-1", "token")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(objectStorage.read).not.toHaveBeenCalled();
  });
});
