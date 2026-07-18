import { describe, expect, it, vi } from 'vitest';

import { AppError, ERROR_CODES } from '@repo/api-core';

import { CreateFileVersionUseCase } from './create-file-version.use-case';

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

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]);

const buildFile = (overrides: Partial<{ buffer: Buffer; size: number }> = {}) => ({
  buffer: pngHeader,
  mimetype: 'image/png',
  originalname: 'photo.png',
  size: pngHeader.length,
  ...overrides,
});

describe('CreateFileVersionUseCase', () => {
  it('uploads a new version, bumps the version number, and updates the current pointer', async () => {
    const existingFile = {
      id: 'file-1',
      latestVersion: 1,
      storageKey: 'uploads/old-key.png',
    };
    const fileAccessService = {
      findAccessibleFile: vi.fn(async () => existingFile),
    };
    const filesRepository = {
      createVersion: vi.fn(async () => ({ id: 'version-2' })),
      setCurrentVersion: vi.fn(async () => ({
        id: 'file-1',
        latestVersion: 2,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      })),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: 'uploads/new-key.png' })),
      delete: vi.fn(async () => undefined),
    };
    const auditService = { log: vi.fn(async () => undefined) };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };

    const useCase = new CreateFileVersionUseCase(
      fileAccessService as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      auditService as never,
    );

    const result = await useCase.execute(actor, 'file-1', buildFile());

    expect(filesRepository.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file-1',
        organizationId: 'org-1',
        versionNumber: 2,
        createdById: 'user-1',
      }),
      expect.anything(),
    );
    expect(filesRepository.setCurrentVersion).toHaveBeenCalledWith(
      'file-1',
      expect.objectContaining({ latestVersion: 2 }),
      expect.anything(),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'file.version_uploaded',
        entityId: 'file-1',
        metadata: { versionNumber: 2 },
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ id: 'file-1', latestVersion: 2 });
  });

  it('rejects files over the size limit without touching storage', async () => {
    const fileAccessService = {
      findAccessibleFile: vi.fn(async () => ({
        id: 'file-1',
        latestVersion: 1,
      })),
    };
    const filesRepository = { createVersion: vi.fn(), setCurrentVersion: vi.fn() };
    const objectStorage = { upload: vi.fn(), delete: vi.fn() };
    const auditService = { log: vi.fn() };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };

    const useCase = new CreateFileVersionUseCase(
      fileAccessService as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      auditService as never,
    );

    await expect(
      useCase.execute(
        actor,
        'file-1',
        buildFile({ size: 11 * 1024 * 1024 }),
      ),
    ).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_FAILED,
    });

    expect(objectStorage.upload).not.toHaveBeenCalled();
  });

  it('cleans up the uploaded blob if persisting the new version fails', async () => {
    const fileAccessService = {
      findAccessibleFile: vi.fn(async () => ({
        id: 'file-1',
        latestVersion: 1,
      })),
    };
    const filesRepository = {
      createVersion: vi.fn(async () => {
        throw new Error('insert failed');
      }),
      setCurrentVersion: vi.fn(),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: 'uploads/new-key.png' })),
      delete: vi.fn(async () => undefined),
    };
    const auditService = { log: vi.fn() };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };

    const useCase = new CreateFileVersionUseCase(
      fileAccessService as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      auditService as never,
    );

    await expect(useCase.execute(actor, 'file-1', buildFile())).rejects.toThrow(
      'insert failed',
    );
    expect(objectStorage.delete).toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });
});
