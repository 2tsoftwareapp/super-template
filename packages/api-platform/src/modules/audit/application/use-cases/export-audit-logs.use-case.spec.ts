import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES } from '@repo/api-core';

import { ExportAuditLogsUseCase } from './export-audit-logs.use-case';

const actor = {
  userId: 'user-1',
  sessionId: 'session-1',
  email: 'admin@example.local',
  displayName: 'Admin',
  status: 'ACTIVE' as const,
  roles: ['ADMIN'],
  permissions: [],
  organizationId: 'org-1',
};

const auditRow = {
  id: 'log-1',
  organizationId: 'org-1',
  actorId: 'user-2',
  action: 'project.created',
  entityType: 'project',
  entityId: 'project-1',
  metadata: { name: 'Demo' },
  ipAddress: '127.0.0.1',
  requestId: 'req-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ExportAuditLogsUseCase', () => {
  it('exports matching rows to CSV, uploads them, and records the export', async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
    };
    const filesRepository = {
      create: vi.fn(async () => ({ id: 'file-1' })),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: 'exports/audit/some-key.csv' })),
      delete: vi.fn(async () => undefined),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      recordAuditLogUseCase as never,
    );

    const result = await useCase.execute(actor, { action: 'project.created' });

    expect(auditRepository.listForExport).toHaveBeenCalledWith({
      action: 'project.created',
      limit: 5000,
    });
    expect(objectStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: 'text/csv' }),
    );
    expect(filesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        uploadedById: 'user-1',
        mimeType: 'text/csv',
      }),
    );
    expect(recordAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'audit.exported',
        actorId: 'user-1',
        metadata: expect.objectContaining({ rowCount: 1, fileId: 'file-1' }),
      }),
    );
    expect(result).toEqual({ fileId: 'file-1', rowCount: 1 });
  });

  it('rejects when the actor has no active organization', async () => {
    const auditRepository = { listForExport: vi.fn() };
    const filesRepository = { create: vi.fn() };
    const objectStorage = { upload: vi.fn(), delete: vi.fn() };
    const recordAuditLogUseCase = { execute: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      recordAuditLogUseCase as never,
    );

    await expect(
      useCase.execute({ ...actor, organizationId: null }, {}),
    ).rejects.toMatchObject<Partial<AppError>>({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    expect(auditRepository.listForExport).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object and rethrows if the file record fails to persist', async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
    };
    const filesRepository = {
      create: vi.fn(async () => {
        throw new Error('insert failed');
      }),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: 'exports/audit/some-key.csv' })),
      delete: vi.fn(async () => undefined),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      recordAuditLogUseCase as never,
    );

    await expect(useCase.execute(actor, {})).rejects.toThrow('insert failed');

    expect(objectStorage.delete).toHaveBeenCalledWith(
      expect.stringContaining('exports/audit/'),
    );
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });
});
