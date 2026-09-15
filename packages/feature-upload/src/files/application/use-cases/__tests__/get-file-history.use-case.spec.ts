import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ACTION, ERROR_CODES, perm } from "@repo/api-runtime";
import { FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../../services/file-access.service";
import { GetFileHistoryUseCase } from "../get-file-history.use-case";

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

const version = (overrides: Record<string, unknown> = {}) => ({
  id: "version-1",
  fileId: "file-1",
  organizationId: "org-1",
  versionNumber: 1,
  storageKey: "uploads/user-1/v1.png",
  mimeType: "image/png",
  sizeBytes: 100,
  checksum: "abc",
  createdById: "user-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

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

function buildUseCase(versions: unknown[]) {
  const filesRepository = {
    findById: vi.fn(async () => file),
    listVersions: vi.fn(async () => versions),
  };
  return {
    filesRepository,
    useCase: new GetFileHistoryUseCase(
      new FileAccessService(filesRepository as never),
      filesRepository as never,
    ),
  };
}

describe("GetFileHistoryUseCase", () => {
  it("labels the first version as the upload event", async () => {
    const { useCase } = buildUseCase([version()]);

    await expect(useCase.execute(actor, "file-1")).resolves.toEqual([
      {
        type: "version",
        action: "file.uploaded",
        actorId: "user-1",
        metadata: { versionNumber: 1, sizeBytes: 100, checksum: "abc" },
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("labels later versions as version uploads", async () => {
    const { useCase } = buildUseCase([
      version({ id: "version-2", versionNumber: 2, sizeBytes: 140, checksum: "def" }),
    ]);

    const [event] = await useCase.execute(actor, "file-1");

    expect(event).toMatchObject({
      type: "version",
      action: "file.version_uploaded",
      metadata: { versionNumber: 2, sizeBytes: 140, checksum: "def" },
    });
  });

  it("preserves the repository's ordering and carries a null actor through", async () => {
    const { useCase } = buildUseCase([
      version({ id: "v2", versionNumber: 2, createdById: null }),
      version({ id: "v1", versionNumber: 1 }),
    ]);

    const events = await useCase.execute(actor, "file-1");

    expect(events.map((event) => event.action)).toEqual(["file.version_uploaded", "file.uploaded"]);
    expect(events[0]!.actorId).toBeNull();
  });

  it("does not leak per-version storage keys into history", async () => {
    const { useCase } = buildUseCase([version()]);

    const events = await useCase.execute(actor, "file-1");

    expect(JSON.stringify(events)).not.toContain("v1.png");
  });

  it("refuses to build history for a file the actor cannot access", async () => {
    const { useCase, filesRepository } = buildUseCase([version()]);

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
    const useCase = new GetFileHistoryUseCase(
      new FileAccessService(filesRepository as never),
      filesRepository as never,
    );

    await expect(useCase.execute(actor, "file-1")).rejects.toMatchObject({ statusCode: 404 });
  });
});
