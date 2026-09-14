import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, ACTION, perm } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../../services/file-access.service";
import { ListFileVersionsUseCase } from "../list-file-versions.use-case";

const file = {
  id: "file-1",
  organizationId: "org-1",
  storageKey: "uploads/user-1/abc.png",
  originalName: "abc.png",
  mimeType: "image/png",
  sizeBytes: 100,
  checksum: "abc",
  latestVersion: 2,
  kind: FILE_KIND.DEFAULT,
  visibility: FILE_VISIBILITY.PRIVATE,
  uploadedById: "user-1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const version = {
  id: "version-2",
  fileId: "file-1",
  organizationId: "org-1",
  versionNumber: 2,
  // Per-version keys stay server-side too.
  storageKey: "uploads/user-1/v2.png",
  mimeType: "image/png",
  sizeBytes: 120,
  checksum: "def",
  createdById: "user-1",
  createdAt: new Date("2026-01-03T00:00:00.000Z"),
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

function buildUseCase(versions: unknown[] = [version]) {
  const filesRepository = {
    findById: vi.fn(async () => file),
    listVersions: vi.fn(async () => versions),
  };
  return {
    filesRepository,
    useCase: new ListFileVersionsUseCase(
      new FileAccessService(filesRepository as never),
      filesRepository as never,
    ),
  };
}

describe("ListFileVersionsUseCase", () => {
  it("maps the version timeline with ISO timestamps", async () => {
    const { useCase } = buildUseCase();

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual([
      {
        id: "version-2",
        fileId: "file-1",
        versionNumber: 2,
        mimeType: "image/png",
        sizeBytes: 120,
        checksum: "def",
        createdById: "user-1",
        createdAt: "2026-01-03T00:00:00.000Z",
      },
    ]);
  });

  it("keeps every version's storage key server-side", async () => {
    const { useCase } = buildUseCase();

    const [result] = await useCase.execute(actor, "file-1");

    expect(result).not.toHaveProperty("storageKey");
    expect(JSON.stringify(result)).not.toContain("v2.png");
  });

  it("lists versions for the accessible file id the gate resolved", async () => {
    const { useCase, filesRepository } = buildUseCase([]);

    await useCase.execute(actor, "file-1");

    expect(filesRepository.listVersions).toHaveBeenCalledWith("file-1");
  });

  it("refuses to list versions of a file the actor cannot access", async () => {
    const { useCase, filesRepository } = buildUseCase();

    await expect(useCase.execute({ ...actor, userId: "user-2" }, "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    expect(filesRepository.listVersions).not.toHaveBeenCalled();
  });

  it("reports a missing file as FILE_NOT_FOUND", async () => {
    const filesRepository = {
      findById: vi.fn(async () => null),
      listVersions: vi.fn(async () => []),
    };
    const useCase = new ListFileVersionsUseCase(
      new FileAccessService(filesRepository as never),
      filesRepository as never,
    );

    await expect(useCase.execute(actor, "file-1")).rejects.toMatchObject({ statusCode: 404 });
    expect(filesRepository.listVersions).not.toHaveBeenCalled();
  });

  it("returns an empty timeline for a file with no versions", async () => {
    const { useCase } = buildUseCase([]);

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual([]);
  });
});
