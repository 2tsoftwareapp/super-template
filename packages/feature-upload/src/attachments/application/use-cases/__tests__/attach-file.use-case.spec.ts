import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";
import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { FileAccessService } from "../../../../files/application/services/file-access.service";
import { FILE_ERROR_CODES } from "../../../../public/error-codes";
import { AttachFileUseCase } from "../attach-file.use-case";

const actor = {
  userId: "user-1",
  organizationId: "org-1",
  roles: ["USER"],
  permissions: [],
} as unknown as AuthenticatedRequestUser;

const input = {
  fileId: "file-1",
  entityType: "project",
  entityId: "project-1",
};

const buildFile = (overrides: Record<string, unknown> = {}) => ({
  id: "file-1",
  organizationId: "org-1",
  storageKey: "files/file-1",
  originalName: "report.pdf",
  mimeType: "application/pdf",
  sizeBytes: 10,
  checksum: null,
  latestVersion: 1,
  kind: "GENERIC",
  visibility: "PRIVATE",
  uploadedById: "user-1",
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildAttachment = () => ({
  id: "att-1",
  fileId: "file-1",
  entityType: "project",
  entityId: "project-1",
  label: null,
  createdById: "user-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
});

/** Wires the real FileAccessService so the spec exercises the production policy. */
function buildUseCase(file: ReturnType<typeof buildFile> | null) {
  const filesRepository = { findById: vi.fn(async () => file) };
  const attachmentsRepository = { create: vi.fn(async () => buildAttachment()) };
  const auditWriter = { log: vi.fn(async () => undefined) };
  const activityEmitter = { emit: vi.fn(async () => undefined) };
  const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as never)) };

  return {
    useCase: new AttachFileUseCase(
      attachmentsRepository as never,
      new FileAccessService(filesRepository as never),
      transactionPort as never,
      activityEmitter as never,
      auditWriter as never,
    ),
    attachmentsRepository,
    auditWriter,
  };
}

describe("AttachFileUseCase", () => {
  it("throws FILE_NOT_FOUND when the file does not exist", async () => {
    const { useCase, attachmentsRepository } = buildUseCase(null);

    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: FILE_ERROR_CODES.FILE_NOT_FOUND,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("creates the attachment scoped to the file organization and audits it", async () => {
    const { useCase, attachmentsRepository, auditWriter } = buildUseCase(buildFile());

    const result = await useCase.execute(actor, input);

    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        fileId: "file-1",
        createdById: "user-1",
      }),
      expect.anything(),
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attachment.created" }),
      expect.anything(),
    );
    expect(result).toMatchObject({ id: "att-1", fileId: "file-1" });
  });

  it("rejects an actor without access to the file (same rule as the read path)", async () => {
    const { useCase, attachmentsRepository } = buildUseCase(
      // Owned by another user, not visible to the plain USER actor.
      buildFile({ uploadedById: "someone-else" }),
    );

    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
      statusCode: 403,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a file from another organization", async () => {
    const { useCase, attachmentsRepository } = buildUseCase(
      buildFile({ organizationId: "org-2", uploadedById: "user-1" }),
    );

    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("rejects a RESTRICTED file for an actor without audit.read", async () => {
    const { useCase, attachmentsRepository } = buildUseCase(
      buildFile({ visibility: "RESTRICTED" }),
    );

    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("still refuses platform-scoped (global) files for a privileged actor", async () => {
    const superAdmin = {
      ...actor,
      organizationId: null,
      roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN],
    } as unknown as AuthenticatedRequestUser;
    const { useCase, attachmentsRepository } = buildUseCase(buildFile({ organizationId: null }));

    await expect(useCase.execute(superAdmin, input)).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("allows an ADMIN to attach another member's organization file", async () => {
    const admin = {
      ...actor,
      roles: ["ADMIN"],
    } as unknown as AuthenticatedRequestUser;
    const { useCase, attachmentsRepository } = buildUseCase(
      buildFile({ uploadedById: "someone-else" }),
    );

    await useCase.execute(admin, input);

    expect(attachmentsRepository.create).toHaveBeenCalled();
  });
});
