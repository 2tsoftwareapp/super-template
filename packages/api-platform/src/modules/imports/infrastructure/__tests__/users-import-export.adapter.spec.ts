import { describe, expect, it, vi } from 'vitest';

import { UsersImportExportAdapter } from '../users-import-export.adapter';

vi.mock('argon2', () => ({
  hash: vi.fn(() => Promise.resolve('mocked_hash')),
}));

function createAdapter(
  overrides?: Partial<{
    usersRepository: Record<string, unknown>;
    organizationsRepository: Record<string, unknown>;
    accessControlRepository: Record<string, unknown>;
  }>,
) {
  const usersRepo = {
    list: vi.fn(),
    create: vi.fn(),
    ...overrides?.usersRepository,
  } as never;

  const orgsRepo = {
    addMember: vi.fn(),
    ...overrides?.organizationsRepository,
  } as never;

  const accessRepo = {
    findRoleByName: vi.fn(),
    assignUserRole: vi.fn(),
    ...overrides?.accessControlRepository,
  } as never;

  const adapter = new UsersImportExportAdapter(
    usersRepo,
    orgsRepo,
    accessRepo,
  );

  return { adapter, usersRepo, orgsRepo, accessRepo };
}

describe('UsersImportExportAdapter', () => {
  describe('metadata', () => {
    it('has type users', () => {
      const { adapter } = createAdapter();
      expect(adapter.type).toBe('users');
    });

    it('has csv header without password', () => {
      const { adapter } = createAdapter();
      expect(adapter.csvHeader).toEqual(['email', 'displayName', 'avatarUrl']);
    });

    it('declares import permissions', () => {
      const { adapter } = createAdapter();
      expect(adapter.importPermissions).toEqual(['users.create']);
    });

    it('declares export permissions', () => {
      const { adapter } = createAdapter();
      expect(adapter.exportPermissions).toEqual(['users.read']);
    });
  });

  describe('parseCsvRecord', () => {
    it('parses email, displayName, avatarUrl', () => {
      const { adapter } = createAdapter();
      const row = adapter.parseCsvRecord({
        email: ' user@test.com ',
        displayName: '  John Doe  ',
        avatarUrl: ' https://example.com/avatar.png ',
      });
      expect(row.email).toBe('user@test.com');
      expect(row.displayName).toBe('John Doe');
      expect(row.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('defaults missing fields to empty/undefined', () => {
      const { adapter } = createAdapter();
      const row = adapter.parseCsvRecord({});
      expect(row.email).toBe('');
      expect(row.displayName).toBe('');
      expect(row.avatarUrl).toBeUndefined();
    });
  });

  describe('validateRow', () => {
    it('returns null for valid row', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: 'user@test.com',
        displayName: 'John Doe',
      });
      expect(error).toBeNull();
    });

    it('rejects empty email', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: '',
        displayName: 'John Doe',
      });
      expect(error).toBe('Email is required');
    });

    it('rejects invalid email', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: 'not-an-email',
        displayName: 'John Doe',
      });
      expect(error).toBe('Email must be a valid email address');
    });

    it('rejects empty displayName', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: 'user@test.com',
        displayName: '',
      });
      expect(error).toBe('Display name is required');
    });

    it('rejects too short displayName', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: 'user@test.com',
        displayName: 'A',
      });
      expect(error).toBe('Display name must be between 2 and 100 characters');
    });

    it('rejects too long displayName', () => {
      const { adapter } = createAdapter();
      const error = adapter.validateRow({
        email: 'user@test.com',
        displayName: 'A'.repeat(101),
      });
      expect(error).toBe('Display name must be between 2 and 100 characters');
    });
  });

  describe('toCsvRow', () => {
    it('maps fields to string array', () => {
      const { adapter } = createAdapter();
      const result = adapter.toCsvRow({
        email: 'user@test.com',
        displayName: 'John Doe',
        avatarUrl: 'https://example.com/avatar.png',
      });
      expect(result).toEqual([
        'user@test.com',
        'John Doe',
        'https://example.com/avatar.png',
      ]);
    });

    it('handles missing avatarUrl', () => {
      const { adapter } = createAdapter();
      const result = adapter.toCsvRow({
        email: 'user@test.com',
        displayName: 'John Doe',
      });
      expect(result[2]).toBe('');
    });
  });

  describe('importRow', () => {
    const context = {
      organizationId: 'org-1',
      ownerId: 'owner-1',
      createdById: 'creator-1',
    };

    it('creates user, adds membership, and assigns USER role', async () => {
      const usersRepo = {
        create: vi.fn(async (input: Record<string, unknown>) => ({
          id: 'user-created-1',
          ...input,
        })),
      };

      const orgsRepo = { addMember: vi.fn() };
      const accessRepo = {
        findRoleByName: vi.fn(async () => ({
          id: 'user-role-id',
          name: 'USER',
          organizationId: null,
          description: null,
          isSystem: true,
        })),
        assignUserRole: vi.fn(),
      };

      const { adapter } = createAdapter({
        usersRepository: usersRepo,
        organizationsRepository: orgsRepo,
        accessControlRepository: accessRepo,
      });

      await adapter.importRow(
        {
          email: 'newuser@test.com',
          displayName: 'New User',
          avatarUrl: null,
        },
        context,
      );

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@test.com',
          displayName: 'New User',
          status: 'ACTIVE',
          mustChangePassword: true,
          emailVerifiedAt: expect.any(Date),
        }),
        undefined,
      );

      expect(orgsRepo.addMember).toHaveBeenCalledWith(
        {
          organizationId: 'org-1',
          userId: 'user-created-1',
          role: 'MEMBER',
        },
        undefined,
      );

      expect(accessRepo.findRoleByName).toHaveBeenCalledWith(
        'USER',
        null,
        undefined,
      );

      expect(accessRepo.assignUserRole).toHaveBeenCalledWith(
        'user-created-1',
        'user-role-id',
        'org-1',
        undefined,
      );
    });

    it('skips role assignment if USER role not found', async () => {
      const usersRepo = {
        create: vi.fn(async () => ({ id: 'user-2' })),
      };

      const accessRepo = {
        findRoleByName: vi.fn(async () => null),
        assignUserRole: vi.fn(),
      };

      const { adapter } = createAdapter({
        usersRepository: usersRepo,
        accessControlRepository: accessRepo,
      });

      await adapter.importRow(
        { email: 'a@b.com', displayName: 'Test User' },
        context,
      );

      expect(accessRepo.findRoleByName).toHaveBeenCalled();
      expect(accessRepo.assignUserRole).not.toHaveBeenCalled();
    });

    it('forwards the transaction executor', async () => {
      const tx = Symbol('tx');
      const usersRepo = {
        create: vi.fn(async () => ({ id: 'user-3' })),
      };
      const orgsRepo = { addMember: vi.fn() };
      const accessRepo = {
        findRoleByName: vi.fn(async () => null),
        assignUserRole: vi.fn(),
      };

      const { adapter } = createAdapter({
        usersRepository: usersRepo,
        organizationsRepository: orgsRepo,
        accessControlRepository: accessRepo,
      });

      await adapter.importRow(
        { email: 'a@b.com', displayName: 'Test' },
        context,
        tx as never,
      );

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.anything(),
        tx,
      );
      expect(orgsRepo.addMember).toHaveBeenCalledWith(
        expect.anything(),
        tx,
      );
      expect(accessRepo.findRoleByName).toHaveBeenCalledWith(
        'USER',
        null,
        tx,
      );
    });
  });

  describe('listForExport', () => {
    it('returns all users across paginated pages', async () => {
      const page1 = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        displayName: `User ${i}`,
        avatarUrl: null,
        status: 'ACTIVE' as const,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
      }));

      const page2 = Array.from({ length: 500 }, (_, i) => ({
        id: `user-${1000 + i}`,
        email: `user${1000 + i}@test.com`,
        displayName: `User ${1000 + i}`,
        avatarUrl: null,
        status: 'ACTIVE' as const,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
      }));

      const usersRepo = {
        list: vi.fn()
          .mockResolvedValueOnce({ rows: page1, total: 1500 })
          .mockResolvedValueOnce({ rows: page2, total: 1500 }),
      };

      const { adapter } = createAdapter({
        usersRepository: usersRepo,
      });

      const result = await adapter.listForExport({
        organizationId: 'org-1',
        ownerId: 'owner-1',
      });

      expect(usersRepo.list).toHaveBeenCalledTimes(2);
      expect(usersRepo.list).toHaveBeenCalledWith({
        page: 1,
        limit: 1000,
        organizationId: 'org-1',
        sort: [{ field: 'createdAt', order: 'asc' }],
      });
      expect(usersRepo.list).toHaveBeenCalledWith({
        page: 2,
        limit: 1000,
        organizationId: 'org-1',
        sort: [{ field: 'createdAt', order: 'asc' }],
      });

      expect(result).toHaveLength(1500);
      expect(result[0]!.id).toBe('user-0');
      expect(result[1499]!.id).toBe('user-1499');
    });

    it('handles single page when total fits in one request', async () => {
      const rows = Array.from({ length: 500 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@test.com`,
        displayName: `User ${i}`,
        avatarUrl: null,
        status: 'ACTIVE' as const,
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
      }));

      const usersRepo = {
        list: vi.fn().mockResolvedValueOnce({ rows, total: 500 }),
      };

      const { adapter } = createAdapter({
        usersRepository: usersRepo,
      });

      const result = await adapter.listForExport({
        organizationId: 'org-1',
        ownerId: 'owner-1',
      });

      expect(usersRepo.list).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(500);
    });
  });
});
