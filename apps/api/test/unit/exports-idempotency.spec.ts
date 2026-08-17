import { Test } from '@nestjs/testing';
import { TRANSACTION_PORT } from '@repo/api-core';
import { ImportExportAdapterRegistry } from '@repo/api-platform';
import { CreateExportUseCase } from '@repo/api-platform/modules/exports/application/use-cases/create-export.use-case';
import { GetExportUseCase } from '@repo/api-platform/modules/exports/application/use-cases/get-export.use-case';
import { EXPORT_JOBS_REPOSITORY } from '@repo/api-platform/modules/exports/application/ports/export-jobs.repository.port';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import { describe, expect, it, vi } from 'vitest';

const actor = {
  userId: '11111111-1111-4111-8111-111111111111',
  sessionId: '55555555-5555-4555-8555-555555555555',
  organizationId: '22222222-2222-4222-8222-222222222222',
  email: 'admin@example.com',
  displayName: 'Admin User',
  status: 'ACTIVE' as const,
  roles: ['ADMIN'],
  permissions: ['exports.create'],
};

const existingJob = {
  id: '33333333-3333-4333-8333-333333333333',
  organizationId: actor.organizationId,
  type: 'users',
  status: 'COMPLETED' as const,
  fileId: '44444444-4444-4444-8444-444444444444',
  filters: null,
  createdById: actor.userId,
  idempotencyKey: 'export-attempt-1',
  completedAt: new Date('2026-06-17T10:00:00.000Z'),
  createdAt: new Date('2026-06-17T10:00:00.000Z'),
  updatedAt: new Date('2026-06-17T10:00:00.000Z'),
};

describe('CreateExportUseCase idempotency', () => {
  it('returns an existing export job when the idempotency key matches', async () => {
    const exportJobsRepository = {
      createIdempotent: vi.fn().mockResolvedValue({
        value: existingJob,
        created: false,
      }),
      create: vi.fn(),
      update: vi.fn(),
      findById: vi.fn().mockResolvedValue(existingJob),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateExportUseCase,
        GetExportUseCase,
        { provide: EXPORT_JOBS_REPOSITORY, useValue: exportJobsRepository },
        {
          provide: ImportExportAdapterRegistry,
          useValue: {
            resolve: vi.fn(),
            getExportPermissions: vi.fn(() => ['exports.create']),
          },
        },
        {
          provide: AuditService,
          useValue: { log: vi.fn() },
        },
        {
          provide: TRANSACTION_PORT,
          useValue: {
            withTenant: vi.fn((_ctx: unknown, fn: (tx: unknown) => unknown) =>
              fn({}),
            ),
          },
        },
      ],
    }).compile();

    const createExport = moduleRef.get(CreateExportUseCase);
    const result = await createExport.execute(actor, {
      type: 'users',
      idempotencyKey: 'export-attempt-1',
    });

    expect(exportJobsRepository.createIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: actor.userId,
        idempotencyKey: 'export-attempt-1',
      }),
      expect.anything(),
    );
    expect(exportJobsRepository.create).not.toHaveBeenCalled();
    // Replay resolves through GetExportUseCase -> the existing completed job.
    expect(exportJobsRepository.findById).toHaveBeenCalledWith(existingJob.id);
    expect(result).toMatchObject({
      id: existingJob.id,
      status: 'COMPLETED',
      fileId: existingJob.fileId,
    });
  });
});
