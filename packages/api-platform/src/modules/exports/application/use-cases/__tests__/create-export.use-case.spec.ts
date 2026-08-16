import { describe, expect, it, vi } from 'vitest';

import { CreateExportUseCase } from '../create-export.use-case';

const createActor = (permissions: string[] = []) => ({
  userId: 'user-1',
  sessionId: 'session-1',
  email: 'admin@example.local',
  displayName: 'Admin',
  status: 'ACTIVE' as const,
  roles: ['ADMIN'],
  permissions,
  organizationId: 'org-1',
});

function createUseCase(overrides?: Record<string, unknown>) {
  const mockAdapter = {
    type: 'users',
    csvHeader: ['email', 'displayName', 'avatarUrl'],
    listForExport: vi.fn(async () => [
      { email: 'a@b.com', displayName: 'A' },
      { email: 'c@d.com', displayName: 'C' },
    ]),
    toCsvRow: vi.fn((row: Record<string, string>) => [
      row.email,
      row.displayName,
    ]),
  };

  const exportJobsRepository = {
    create: vi.fn(async (values: Record<string, unknown>) => ({
      id: 'export-1',
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    createIdempotent: vi.fn(),
    update: vi.fn(async (id: string, _data: Record<string, unknown>) => ({
      id,
      status: 'COMPLETED',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...(overrides?.exportJobsRepository as Record<string, unknown> ?? {}),
  };

  const filesRepository = {
    create: vi.fn(async (values: Record<string, unknown>) => ({
      id: 'file-export-1',
      ...values,
    })),
    ...(overrides?.filesRepository as Record<string, unknown> ?? {}),
  };

  const mockObjectStorage = {
    upload: vi.fn(),
    delete: vi.fn(),
    ...(overrides?.objectStorage as Record<string, unknown> ?? {}),
  };

  const importExportAdapters = {
    resolve: vi.fn(() => mockAdapter),
    getExportPermissions: vi.fn(() => []),
    ...(overrides?.importExportAdapters as Record<string, unknown> ?? {}),
  };

  const auditService = {
    log: vi.fn(async () => undefined),
    ...(overrides?.auditService as Record<string, unknown> ?? {}),
  };

  const transactionPort = {
    run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
    ...(overrides?.transactionPort as Record<string, unknown> ?? {}),
  };

  const activityEmitter = {
    emit: vi.fn(async () => undefined),
    ...(overrides?.activityEmitter as Record<string, unknown> ?? {}),
  };

  const useCase = new CreateExportUseCase(
    exportJobsRepository as never,
    filesRepository as never,
    importExportAdapters as never,
    mockObjectStorage as never,
    auditService as never,
    transactionPort as never,
    activityEmitter as never,
  );

  return {
    useCase,
    exportJobsRepository,
    filesRepository,
    importExportAdapters,
    mockObjectStorage,
    auditService,
    transactionPort,
    activityEmitter,
    mockAdapter,
  };
}

describe('CreateExportUseCase', () => {
  it('creates an export job, calls listForExport, and uploads CSV', async () => {
    const {
      useCase,
      exportJobsRepository,
      mockObjectStorage,
      auditService,
      mockAdapter,
    } = createUseCase();

    const result = await useCase.execute(
      createActor(),
      { type: 'users' },
    );

    expect(exportJobsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'users',
        organizationId: 'org-1',
        status: 'PROCESSING',
        createdById: 'user-1',
      }),
    );

    expect(mockAdapter.listForExport).toHaveBeenCalledWith({
      organizationId: 'org-1',
      ownerId: 'user-1',
      limit: 50001,
    });

    expect(mockObjectStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: 'text/csv',
      }),
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'export.created',
      }),
      expect.anything(),
    );

    expect(result.status).toBe('COMPLETED');
  });

  it('fails the export when the row cap is exceeded', async () => {
    const { useCase, exportJobsRepository, mockObjectStorage } = createUseCase({
      mockAdapter: {
        type: 'users',
        csvHeader: ['email'],
        listForExport: vi.fn(async () =>
          Array.from({ length: 50001 }, (_, i) => ({ email: `u${i}@x.com` })),
        ),
        toCsvRow: vi.fn((row: { email: string }) => [row.email]),
      },
      importExportAdapters: {
        resolve: vi.fn(() => ({
          type: 'users',
          csvHeader: ['email'],
          listForExport: vi.fn(async () =>
            Array.from({ length: 50001 }, (_, i) => ({
              email: `u${i}@x.com`,
            })),
          ),
          toCsvRow: vi.fn((row: { email: string }) => [row.email]),
        })),
        getExportPermissions: vi.fn(() => []),
      },
    });

    await expect(
      useCase.execute(createActor(), { type: 'users' }),
    ).rejects.toThrow(/exceeds the maximum of 50000 rows/);

    // No CSV was uploaded and the job was marked FAILED.
    expect(mockObjectStorage.upload).not.toHaveBeenCalled();
    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      'export-1',
      expect.objectContaining({ status: 'FAILED' }),
    );
  });

  it('emits an activity when the export completes', async () => {
    const { useCase, activityEmitter } = createUseCase();

    await useCase.execute(createActor(), { type: 'users' });

    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        summary: expect.stringContaining('Export "users" completed'),
        entityType: 'export_job',
        entityId: 'export-1',
        actorId: 'user-1',
        metadata: expect.objectContaining({ rowCount: 2 }),
      }),
      expect.anything(),
    );
  });

  it('does not emit an activity when the export is idempotently returned', async () => {
    const { useCase, activityEmitter } = createUseCase({
      exportJobsRepository: {
        create: vi.fn(),
        createIdempotent: vi.fn(async () => ({
          value: {
            id: 'export-existing',
            type: 'users',
            organizationId: 'org-1',
            status: 'COMPLETED',
            createdById: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          created: false,
        })),
        update: vi.fn(),
      },
    });

    await useCase.execute(
      createActor(),
      { type: 'users', idempotencyKey: 'idem-456' },
    );

    expect(activityEmitter.emit).not.toHaveBeenCalled();
  });

  it('rejects when actor lacks required export permissions', async () => {
    const { useCase } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(),
        getExportPermissions: vi.fn(() => ['users.read']),
      },
    });

    await expect(
      useCase.execute(createActor([]), { type: 'users' }),
    ).rejects.toThrow('Missing required permission: users.read');
  });

  it('allows when actor has required export permissions', async () => {
    const { useCase, exportJobsRepository } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(() => ({
          type: 'users',
          csvHeader: ['email'],
          listForExport: vi.fn(async () => []),
          toCsvRow: vi.fn(),
        })),
        getExportPermissions: vi.fn(() => ['users.read']),
      },
    });

    const actor = createActor(['users.read']);
    const result = await useCase.execute(actor, { type: 'users' });

    expect(exportJobsRepository.create).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  it('supports idempotency key', async () => {
    const { useCase, exportJobsRepository } = createUseCase({
      exportJobsRepository: {
        create: vi.fn(),
        createIdempotent: vi.fn(async () => ({
          value: {
            id: 'export-existing',
            type: 'users',
            organizationId: 'org-1',
            status: 'COMPLETED',
            createdById: 'user-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          created: false,
        })),
        update: vi.fn(),
      },
    });

    const result = await useCase.execute(
      createActor(),
      { type: 'users', idempotencyKey: 'idem-456' },
    );

    expect(exportJobsRepository.createIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'idem-456' }),
    );
    expect(exportJobsRepository.create).not.toHaveBeenCalled();
    expect(result.status).toBe('COMPLETED');
  });

  it('cleans up storage on failure', async () => {
    const { useCase, mockObjectStorage, exportJobsRepository } = createUseCase({
      mockAdapter: {
        type: 'users',
        csvHeader: ['email'],
        listForExport: vi.fn(async () => {
          throw new Error('Export failed');
        }),
        toCsvRow: vi.fn(),
      },
      importExportAdapters: {
        resolve: vi.fn(() => ({
          type: 'users',
          csvHeader: ['email'],
          listForExport: vi.fn(async () => {
            throw new Error('Export failed');
          }),
          toCsvRow: vi.fn(),
        })),
        getExportPermissions: vi.fn(() => []),
      },
    });

    await expect(
      useCase.execute(createActor(), { type: 'users' }),
    ).rejects.toThrow('Export failed');

    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      'export-1',
      expect.objectContaining({ status: 'FAILED' }),
    );
  });
});
