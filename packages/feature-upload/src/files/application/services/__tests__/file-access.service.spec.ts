import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, perm, ACTION } from "@repo/api-runtime";
import { FILE_ERROR_CODES, FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { FileAccessService } from "../file-access.service";

const orgFile = {
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

const fileWith = (overrides: Partial<Record<keyof typeof orgFile, unknown>> = {}) =>
  ({ ...orgFile, ...overrides }) as typeof orgFile;

function buildActor(overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser {
  return {
    userId: "user-1",
    sessionId: "session-1",
    email: "user@example.local",
    displayName: "User",
    status: "ACTIVE",
    // "USER"/"ADMIN" are owned by feature-access-control; the literals keep this spec import-free.
    roles: ["USER"],
    permissions: [perm("files", ACTION.READ)],
    organizationId: "org-1",
    ...overrides,
  } as AuthenticatedRequestUser;
}

function buildService(file: unknown = orgFile) {
  const filesRepository = { findById: vi.fn(async () => file) };
  return { filesRepository, service: new FileAccessService(filesRepository as never) };
}

describe("FileAccessService.findAccessibleFile", () => {
  it("returns the file for its uploader", async () => {
    const { service } = buildService();

    await expect(service.findAccessibleFile(buildActor(), "file-1")).resolves.toEqual(orgFile);
  });

  it("reports a missing file as FILE_NOT_FOUND", async () => {
    const { service } = buildService(null);

    try {
      await service.findAccessibleFile(buildActor(), "file-1");
      throw new Error("expected findAccessibleFile to throw");
    } catch (error) {
      expect(error).toMatchObject({ code: FILE_ERROR_CODES.FILE_NOT_FOUND, statusCode: 404 });
    }
  });

  it("denies another USER in the same organization", async () => {
    const { service } = buildService();

    await expect(
      service.findAccessibleFile(buildActor({ userId: "user-2" }), "file-1"),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
  });

  it("denies a file owned by another organization", async () => {
    const { service } = buildService(fileWith({ organizationId: "org-2" }));

    await expect(service.findAccessibleFile(buildActor(), "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
  });

  it("allows an ADMIN of the file's organization", async () => {
    const { service } = buildService();

    await expect(
      service.findAccessibleFile(buildActor({ userId: "admin-1", roles: ["ADMIN"] }), "file-1"),
    ).resolves.toEqual(orgFile);
  });

  it("allows a SUPER_ADMIN to cross organizations", async () => {
    const foreignFile = fileWith({ organizationId: "org-2" });
    const { service } = buildService(foreignFile);

    await expect(
      service.findAccessibleFile(
        buildActor({
          userId: "root",
          roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN],
          organizationId: "org-1",
        }),
        "file-1",
      ),
    ).resolves.toEqual(foreignFile);
  });

  it("keeps RESTRICTED files behind audit.read even for the uploader", async () => {
    const restricted = fileWith({ visibility: FILE_VISIBILITY.RESTRICTED });
    const { service } = buildService(restricted);

    await expect(service.findAccessibleFile(buildActor(), "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    await expect(
      service.findAccessibleFile(
        buildActor({ permissions: [perm("files", ACTION.READ), perm("audit", ACTION.READ)] }),
        "file-1",
      ),
    ).resolves.toEqual(restricted);
  });

  it("keeps AUDIT_EXPORT files behind audit.read for an ADMIN", async () => {
    const auditExport = fileWith({ kind: FILE_KIND.AUDIT_EXPORT });
    const { service } = buildService(auditExport);
    const admin = buildActor({ userId: "admin-1", roles: ["ADMIN"] });

    await expect(service.findAccessibleFile(admin, "file-1")).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    await expect(
      service.findAccessibleFile(
        { ...admin, permissions: [...admin.permissions, perm("audit", ACTION.READ)] },
        "file-1",
      ),
    ).resolves.toEqual(auditExport);
  });

  it("asks the repository for the file exactly once", async () => {
    const { service, filesRepository } = buildService();

    await service.findAccessibleFile(buildActor(), "file-1");

    expect(filesRepository.findById).toHaveBeenCalledTimes(1);
    expect(filesRepository.findById).toHaveBeenCalledWith("file-1");
  });
});
