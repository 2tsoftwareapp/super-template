import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ACTION, ERROR_CODES, perm } from "@repo/api-runtime";
import { FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../../services/file-access.service";
import { GetFileSignedUrlUseCase } from "../get-file-signed-url.use-case";

const file = {
  id: "file-1",
  organizationId: "org-1",
  storageKey: "uploads/user-1/abc.png",
  originalName: "abc.png",
  mimeType: "image/png",
  sizeBytes: 100,
  checksum: "abc",
  latestVersion: 1,
  kind: FILE_KIND.DEFAULT,
  visibility: FILE_VISIBILITY.PRIVATE,
  uploadedById: "user-1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

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
  const objectStorage = {
    getSignedUrl: vi.fn(async () => "https://s3.example.local/signed"),
  };
  const localFileDownloadUrlService = {
    isEnabled: vi.fn(() => local),
    expiresInSeconds: 3600,
    createSignedUrl: vi.fn(() => "http://localhost:3000/api/v1/files/file-1/download?token=t"),
    assertValidToken: vi.fn(),
  };

  return {
    filesRepository,
    objectStorage,
    localFileDownloadUrlService,
    useCase: new GetFileSignedUrlUseCase(
      new FileAccessService(filesRepository as never),
      objectStorage as never,
      localFileDownloadUrlService as never,
    ),
  };
}

describe("GetFileSignedUrlUseCase", () => {
  it("mints a local download URL when the local driver is active", async () => {
    const { useCase, localFileDownloadUrlService, objectStorage } = buildUseCase();

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual({
      id: "file-1",
      url: "http://localhost:3000/api/v1/files/file-1/download?token=t",
      expiresInSeconds: 3600,
    });

    expect(localFileDownloadUrlService.createSignedUrl).toHaveBeenCalledWith(
      "file-1",
      "uploads/user-1/abc.png",
    );
    // The object-storage branch must not run for the local driver.
    expect(objectStorage.getSignedUrl).not.toHaveBeenCalled();
  });

  it("delegates to object storage with the shared TTL when the driver is remote", async () => {
    const { useCase, localFileDownloadUrlService, objectStorage } = buildUseCase({ local: false });

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual({
      id: "file-1",
      url: "https://s3.example.local/signed",
      expiresInSeconds: 3600,
    });

    expect(objectStorage.getSignedUrl).toHaveBeenCalledWith("uploads/user-1/abc.png", 3600);
    expect(localFileDownloadUrlService.createSignedUrl).not.toHaveBeenCalled();
  });

  it("refuses to sign a URL for a file the actor cannot access", async () => {
    const { useCase, objectStorage, localFileDownloadUrlService } = buildUseCase();

    await expect(useCase.execute({ ...actor, userId: "user-2" }, "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    // No URL is minted for a denied actor on either branch.
    expect(objectStorage.getSignedUrl).not.toHaveBeenCalled();
    expect(localFileDownloadUrlService.createSignedUrl).not.toHaveBeenCalled();
  });

  it("reports a missing file as FILE_NOT_FOUND", async () => {
    const { useCase } = buildUseCase({ record: null });

    await expect(useCase.execute(actor, "file-1")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
