import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES } from '@repo/api-core';

import { ConfirmImportUseCase } from './confirm-import.use-case';

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
      update: vi.fn(async (_, data) => ({ ...importJob, ...data })),
    };

    const filesRepository = {
      findById: vi.fn(async () => file),
    };

    const adapter = {
      importRow: vi.fn(async (row) => {
        if (row.name === 'Row 2 Error') {
          throw new Error('Constraint violation');
        }
      }),
    };

    const importExportAdapters = {
      resolve: vi.fn(() => adapter),
    };

    const importFileParser = {
      parseImportFile: vi.fn(async () => parsedData),
    };

    const auditService = {
      log: vi.fn(async () => undefined),
    };

    const transactionPort = {
      run: vi.fn(async (cb) => cb({} as any)),
      withSavepoint: vi.fn(async (_, __, cb) => cb()),
    };

    const useCase = new ConfirmImportUseCase(
      importJobsRepository as never,
      filesRepository as never,
      importExportAdapters as never,
      importFileParser as never,
      auditService as never,
      transactionPort as never,
    );

    const result = await useCase.execute(actor, 'job-1');

    expect(importJobsRepository.findById).toHaveBeenCalledWith('job-1');
    expect(filesRepository.findById).toHaveBeenCalledWith('file-1');
    expect(importFileParser.parseImportFile).toHaveBeenCalledWith('users', 'imports/file.csv');
    
    // Check that importRow was called 3 times
    expect(adapter.importRow).toHaveBeenCalledTimes(3);
    
    // Check savepoints
    expect(transactionPort.withSavepoint).toHaveBeenCalledTimes(3);

    // Check final job status
    expect(importJobsRepository.update).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        status: 'FAILED', // because at least one row failed
        successCount: 2,
        errorCount: 1,
        errors: [
          { row: 2, message: 'Constraint violation' },
        ],
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
    
    expect(result.status).toBe('FAILED');
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(1);
  });
});
