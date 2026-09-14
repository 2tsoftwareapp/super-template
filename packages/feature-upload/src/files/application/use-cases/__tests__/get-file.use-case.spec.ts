import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, ACTION, perm } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { FILE_ERROR_CODES, FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../../services/file-access.service";
import { GetFileUseCase } from "../get-file.use-case";

const file = {
  id: "file-1",
  organizationId: "org-1",
  // Must never reach the response: clients use signed/download URLs instead.
  storageKey: "uploads/user-1/secret-key.png",
  originalName: "photo.png",
  mimeType: "image/png",
  sizeBytes: 512,
  checksum: "sha256-abc",
  latestVersion: 3,
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
  roles: [ROLE_NAMES.USER],
  permissions: [perm("files", ACTION.READ)],
  organizationId: "org-1",
} as AuthenticatedRequestUser;

function buildUseCase(record: unknown = file) {
  const filesRepository = { findById: vi.fn(async () => record) };
  return {
    filesRepository,
    useCase: new GetFileUseCase(new FileAccessService(filesRepository as never)),
  };
}

describe("GetFileUseCase", () => {
  it("returns the file DTO for an actor who may read it", async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual({
      id: "file-1",
      originalName: "photo.png",
      mimeType: "image/png",
      sizeBytes: 512,
      checksum: "sha256-abc",
      latestVersion: 3,
      uploadedById: "user-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
  });

  it("never exposes the storage key to the client", async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute(actor, "file-1");

    expect(result).not.toHaveProperty("storageKey");
    expect(JSON.stringify(result)).not.toContain("secret-key");
  });

  it("reports a missing file as FILE_NOT_FOUND", async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute(actor, "file-1")).rejects.toMatchObject({
      code: FILE_ERROR_CODES.FILE_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("refuses to serve a file the actor cannot access", async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute({ ...actor, userId: "user-2" }, "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
      statusCode: 403,
    });
  });
});
