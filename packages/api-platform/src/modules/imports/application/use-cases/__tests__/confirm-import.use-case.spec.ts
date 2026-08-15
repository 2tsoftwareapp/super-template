import { describe, expect, it, vi } from 'vitest';

import { ConfirmImportUseCase } from '../confirm-import.use-case';

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

describe('ConfirmImportUseCase', () => {
  it('imports rows using savepoints and continues on row failure', async () => {
    const importJob = {
      id: 'job-1',
      createdById: 'user-1',
      type: 'users',
      fileId: 'file-1',
      organizationId: 'org-1',
      status: 'PENDING',
      confirmedAt: null,
      completedAt: null,
      rowCount: null,
      successCount: null,
      errorCount: null,
      errors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const file = {
      id: 'file-1',
      organizationId: 'org-1',
      storageKey: 'imports/file.csv',
    };

    const parsedData = {
      headers: ['name'],
      rows: [
        { name: 'Row 1' },
        { name: 'Row 2 Error' },
        { name: 'Row 3' },
      ],
      totalRows: 3,
    };

    const importJobsRepository = {
      findById: vi.fn(async () => importJob),
      update: vi.fn(async (_id, data) => ({ ...importJob, ...data })),
    };

    const fileAccessService = {
      findAccessibleFile: vi.fn(async () => file),
    };

    const adapter = {
      importRow: vi.fn(async (row: { name: string }) => {
        if (row.name === 'Row 2 Error') {
          throw new Error('Constraint violation');
        }
      }),
    };

    const importExportAdapters = {
      resolve: vi.fn(() => adapter),
      getImportPermissions: vi.fn(() => []),
    };

    const importFileParser = {
      parseImportFile: vi.fn(async () => parsedData),
    };

    const auditService = {
      log: vi.fn(async () => undefined),
    };

    const importsMapper = {
      toImportJobView: vi.fn((job: Record<string, unknown>) => ({
        id: String(job.id),
        type: String(job.type),
        fileId: String(job.fileId),
        status: String(job.status),
        rowCount: (job.rowCount as number | null) ?? null,
        successCount: (job.successCount as number | null) ?? null,
        errorCount: (job.errorCount as number | null) ?? null,
        errors: (job.errors as unknown[] | null) ?? null,
        createdById: String(job.createdById),
        confirmedAt:
          job.confirmedAt instanceof Date
            ? job.confirmedAt.toISOString()
            : null,
        completedAt:
          job.completedAt instanceof Date
            ? job.completedAt.toISOString()
            : null,
        createdAt:
          job.createdAt instanceof Date
            ? job.createdAt.toISOString()
            : new Date().toISOString(),
        updatedAt:
          job.updatedAt instanceof Date
            ? job.updatedAt.toISOString()
            : new Date().toISOString(),
      })),
    };

    const transactionPort = {
      run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
      withSavepoint: vi.fn(
        async (_tx: unknown, _name: string, cb: () => Promise<unknown>) =>
          cb(),
      ),
    };

    const activityEmitter = {
      emit: vi.fn(async () => undefined),
    };

    const useCase = new ConfirmImportUseCase(
      importJobsRepository as never,
      fileAccessService as never,
      importExportAdapters as never,
      importFileParser as never,
      auditService as never,
      importsMapper as never,
      transactionPort as never,
      activityEmitter as never,
    );

    const result = await useCase.execute(actor, 'job-1');

    expect(importJobsRepository.findById).toHaveBeenCalledWith('job-1');
    expect(fileAccessService.findAccessibleFile).toHaveBeenCalledWith(
      actor,
      'file-1',
    );
    expect(importFileParser.parseImportFile).toHaveBeenCalledWith(
      'users',
      'imports/file.csv',
    );

    expect(adapter.importRow).toHaveBeenCalledTimes(3);
    expect(transactionPort.withSavepoint).toHaveBeenCalledTimes(3);

    expect(importJobsRepository.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        status: 'FAILED',
        successCount: 2,
        errorCount: 1,
        errors: [{ row: 2, message: 'Constraint violation' }],
      }),
      expect.anything(),
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'import.confirmed',
        metadata: { successCount: 2, errorCount: 1 },
      }),
      expect.anything(),
    );

    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        summary: expect.stringContaining('Import "users" confirmed'),
        entityType: 'import_job',
        entityId: 'job-1',
        actorId: 'user-1',
        metadata: { successCount: 2, errorCount: 1 },
      }),
      expect.anything(),
    );

    expect(result.status).toBe('FAILED');
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(1);
  });
});
