import { Test } from '@nestjs/testing';
import { ImportExportAdapterRegistry } from '@repo/api-core';
import { ExportsService } from '@repo/api-platform/modules/exports/application/exports.service';
import { ExportJobsRepository } from '@repo/api-platform/modules/exports/infrastructure/export-jobs.repository';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import { FilesRepository } from '@repo/api-platform/modules/files/infrastructure/files.repository';
import { OBJECT_STORAGE } from '@repo/api-platform/modules/storage/application/object-storage.interface';
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
  type: 'projects',
  status: 'COMPLETED' as const,
  fileId: '44444444-4444-4444-8444-444444444444',
  filters: null,
  createdById: actor.userId,
  idempotencyKey: 'export-attempt-1',
  completedAt: new Date('2026-06-17T10:00:00.000Z'),
  createdAt: new Date('2026-06-17T10:00:00.000Z'),
  updatedAt: new Date('2026-06-17T10:00:00.000Z'),
};

describe('ExportsService idempotency', () => {
  it('returns an existing export job when the idempotency key matches', async () => {
    const exportJobsRepository = {
      createIdempotent: vi.fn().mockResolvedValue({
        value: existingJob,
        created: false,
      }),
      create: vi.fn(),
      update: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: ExportJobsRepository, useValue: exportJobsRepository },
        { provide: FilesRepository, useValue: {} },
        {
          provide: ImportExportAdapterRegistry,
          useValue: { resolve: vi.fn() },
        },
        {
          provide: OBJECT_STORAGE,
          useValue: { upload: vi.fn(), delete: vi.fn() },
        },
        {
          provide: AuditService,
          useValue: { log: vi.fn() },
        },
      ],
    }).compile();

    const service = moduleRef.get(ExportsService);
    const result = await service.create(actor, {
      type: 'projects',
      idempotencyKey: 'export-attempt-1',
    });

    expect(exportJobsRepository.createIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: actor.userId,
        idempotencyKey: 'export-attempt-1',
      }),
    );
    expect(exportJobsRepository.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      id: existingJob.id,
      status: 'COMPLETED',
      fileId: existingJob.fileId,
    });
  });
});
