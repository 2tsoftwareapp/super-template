import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, ACTION, perm } from "@repo/api-runtime";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { FILE_KIND, FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { ListFilesUseCase, type ListFilesQuery } from "../list-files.use-case";

const query: ListFilesQuery = {
  page: 2,
  limit: 10,
  sortField: "createdAt",
  sortOrder: "desc",
};

const row = {
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

function buildUseCase(rows: unknown[] = [row], total = rows.length) {
  const filesRepository = {
    list: vi.fn(async () => ({ rows, total })),
  };
  return { filesRepository, useCase: new ListFilesUseCase(filesRepository as never) };
}

function buildActor(overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser {
  return {
    userId: "user-1",
    sessionId: "session-1",
    email: "user@example.local",
    displayName: "User",
    status: "ACTIVE",
    roles: [ROLE_NAMES.USER],
    permissions: [perm("files", ACTION.READ)],
    organizationId: "org-1",
    ...overrides,
  } as AuthenticatedRequestUser;
}

describe("ListFilesUseCase", () => {
  it("scopes the query to the actor's organization and maps the rows", async () => {
    const { useCase, filesRepository } = buildUseCase([row], 5);

    const result = await useCase.execute(buildActor(), query);

    expect(filesRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", page: 2, limit: 10 }),
    );
    expect(result.total).toBe(5);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ id: "file-1", latestVersion: 1 });
    // The storage key stays server-side.
    expect(result.rows[0]).not.toHaveProperty("storageKey");
  });

  it("confines a plain USER to their own uploads even when the query asks otherwise", async () => {
    const { useCase, filesRepository } = buildUseCase();

    await useCase.execute(buildActor(), { ...query, uploadedById: "user-2" });

    const [params] = filesRepository.list.mock.calls[0]! as unknown as [Record<string, unknown>];
    // The actor's own id wins: a USER cannot enumerate another user's files.
    expect(params.uploadedById).toBe("user-1");
    expect(params.excludeKinds).toEqual([FILE_KIND.AUDIT_EXPORT]);
    expect(params.excludeVisibilities).toEqual([FILE_VISIBILITY.RESTRICTED]);
  });

  it("honours an explicit uploader filter for an ADMIN", async () => {
    const { useCase, filesRepository } = buildUseCase();

    await useCase.execute(
      buildActor({
        userId: "admin-1",
        roles: [ROLE_NAMES.ADMIN],
        permissions: [perm("files", ACTION.READ), perm("audit", ACTION.READ)],
      }),
      { ...query, uploadedById: "user-2" },
    );

    const [params] = filesRepository.list.mock.calls[0]! as unknown as [Record<string, unknown>];
    expect(params.uploadedById).toBe("user-2");
    // audit.read lifts the restricted-visibility exclusion.
    expect(params.excludeVisibilities).toBeUndefined();
    // AUDIT_EXPORT is still excluded for a non-SUPER_ADMIN.
    expect(params.excludeKinds).toEqual([FILE_KIND.AUDIT_EXPORT]);
  });

  it("drops every exclusion for a SUPER_ADMIN", async () => {
    const { useCase, filesRepository } = buildUseCase([]);

    await useCase.execute(buildActor({ roles: [ROLE_NAMES.SUPER_ADMIN] }), query);

    const [params] = filesRepository.list.mock.calls[0]! as unknown as [Record<string, unknown>];
    expect(params.excludeKinds).toBeUndefined();
    expect(params.excludeVisibilities).toBeUndefined();
    expect(params.uploadedById).toBeUndefined();
  });

  it("refuses to list without an active organization", async () => {
    const { useCase, filesRepository } = buildUseCase();

    await expect(
      useCase.execute(buildActor({ organizationId: null }), query),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });

    expect(filesRepository.list).not.toHaveBeenCalled();
  });

  it("returns an empty page when the repository finds nothing", async () => {
    const { useCase } = buildUseCase([], 0);

    await expect(useCase.execute(buildActor(), query)).resolves.toEqual({ rows: [], total: 0 });
  });
});
