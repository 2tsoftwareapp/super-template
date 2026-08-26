import { describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { ERROR_CODES } from "@repo/api-runtime";

import { AttachFileUseCase } from "../attach-file.use-case";

const actor = {
  userId: "user-1",
  organizationId: "org-1",
} as unknown as AuthenticatedRequestUser;

const input = {
  fileId: "file-1",
  entityType: "project",
  entityId: "project-1",
};

describe("AttachFileUseCase", () => {
  it("throws FILE_NOT_FOUND when the file does not exist", async () => {
    const filesRepository = { findById: vi.fn(async () => null) };
    const attachmentsRepository = { create: vi.fn() };
    const auditService = { log: vi.fn() };
    const activityEmitter = { emit: vi.fn() };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const useCase = new AttachFileUseCase(
      attachmentsRepository as never,
      filesRepository as never,
      transactionPort as never,
      activityEmitter as never,
      auditService as never,
    );

    await expect(useCase.execute(actor, input)).rejects.toMatchObject({
      code: ERROR_CODES.FILE_NOT_FOUND,
    });
    expect(attachmentsRepository.create).not.toHaveBeenCalled();
  });

  it("creates the attachment scoped to the file organization and audits it", async () => {
    const filesRepository = {
      findById: vi.fn(async () => ({
        id: "file-1",
        organizationId: "org-9",
        originalName: "report.pdf",
      })),
    };
    const attachment = {
      id: "att-1",
      fileId: "file-1",
      entityType: "project",
      entityId: "project-1",
      label: null,
      createdById: "user-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const attachmentsRepository = { create: vi.fn(async () => attachment) };
    const auditService = { log: vi.fn(async () => undefined) };
    const activityEmitter = { emit: vi.fn(async () => undefined) };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const useCase = new AttachFileUseCase(
      attachmentsRepository as never,
      filesRepository as never,
      transactionPort as never,
      activityEmitter as never,
      auditService as never,
    );

    const result = await useCase.execute(actor, input);

    expect(attachmentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-9",
        fileId: "file-1",
        createdById: "user-1",
      }),
      expect.anything(),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "attachment.created" }),
      expect.anything(),
    );
    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-9",
        summary: expect.stringContaining("attached to project"),
        entityType: "attachment",
        entityId: "att-1",
        actorId: "user-1",
        metadata: {
          fileId: "file-1",
          targetEntityType: "project",
          targetEntityId: "project-1",
        },
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ id: "att-1", fileId: "file-1" });
  });
});
