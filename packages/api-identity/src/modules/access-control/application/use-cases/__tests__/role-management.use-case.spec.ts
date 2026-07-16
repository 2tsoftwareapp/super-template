import { describe, expect, it, vi } from 'vitest';
import { ACTION, ERROR_CODES, ROLE_NAMES } from '@repo/api-core';

import { AccessControlMapper } from '../../access-control.mapper';
import { RoleManagementUseCase } from '../role-management.use-case';

const TX = 'tx' as unknown;

describe('RoleManagementUseCase', () => {
  const buildTransactionPort = () => ({
    run: vi.fn().mockImplementation(async (fn: unknown) =>
      (fn as (tx: unknown) => unknown)(TX),
    ),
  });

  const buildMockRepository = () => ({
    findRoleByName: vi.fn(),
    findPermissionsByIds: vi.fn(),
    createRole: vi.fn(),
    replaceRolePermissions: vi.fn(),
    findRoleById: vi.fn(),
    updateRole: vi.fn(),
    findUserIdsForRole: vi.fn(),
    deleteRole: vi.fn(),
    findPermissionIdsForRole: vi.fn(),
    findPermissionsByNames: vi.fn(),
    assignUserRole: vi.fn(),
  });

  const buildActor = (overrides: Record<string, unknown> = {}) => ({
    userId: 'actor-1',
    sessionId: 's1',
    email: 'actor@test.com',
    displayName: 'Actor',
    status: 'ACTIVE' as const,
    roles: [ROLE_NAMES.SUPER_ADMIN],
    permissions: ['users.read', 'users.create'],
    organizationId: 'org-1',
    ...overrides,
  });

  const buildOrgAdmin = () =>
    buildActor({
      roles: [ROLE_NAMES.ADMIN],
      permissions: ['users.read', 'users.create', 'roles.create', 'roles.update'],
      organizationId: 'org-1',
    });

  const PERM_USERS_READ = {
    id: 'perm-1',
    name: 'users.read',
    description: null,
    isSystem: true,
  };

  const PERM_SETTINGS_UPDATE = {
    id: 'perm-2',
    name: 'settings.update',
    description: null,
    isSystem: true,
  };

  const buildUseCase = (
    overrides: {
      repository?: ReturnType<typeof buildMockRepository>;
      transactionPort?: ReturnType<typeof buildTransactionPort>;
      auditWriter?: { log: ReturnType<typeof vi.fn> };
      accessProfileUseCase?: { invalidateUsersForRole: ReturnType<typeof vi.fn>; invalidateAccessProfile: ReturnType<typeof vi.fn> };
    } = {},
  ) => {
    const repo = overrides.repository ?? buildMockRepository();
    const txPort = overrides.transactionPort ?? buildTransactionPort();
    const audit = overrides.auditWriter ?? { log: vi.fn() };
    const profile = overrides.accessProfileUseCase ?? {
      invalidateUsersForRole: vi.fn(),
      invalidateAccessProfile: vi.fn(),
    };

    return {
      useCase: new RoleManagementUseCase(
        repo as never,
        txPort as never,
        audit as never,
        profile as never,
        new AccessControlMapper(),
      ),
      repo,
      txPort,
      audit,
      profile,
    };
  };

  describe('createCustomRole', () => {
    it('creates a custom role with normalized name (trim + uppercase)', async () => {
      const { useCase, repo, audit, txPort } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.createRole.mockResolvedValue({
        id: 'role-1',
        name: 'FINANCE_MANAGER',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });

      const result = await useCase.createCustomRole(
        buildActor(),
        { name: '  finance_manager  ', permissionIds: ['perm-1'] },
      );

      expect(repo.createRole).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'FINANCE_MANAGER' }),
        TX,
      );
      expect(result.name).toBe('FINANCE_MANAGER');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'role.created' }),
        TX,
      );
      expect(txPort.run).toHaveBeenCalled();
    });

    it('rejects fixed role names regardless of case or whitespace', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);

      await expect(
        useCase.createCustomRole(buildActor(), { name: '  admin  ', permissionIds: ['perm-1'] }),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });

      expect(repo.createRole).not.toHaveBeenCalled();
    });

    it('rejects duplicate role names in the same organization', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleByName.mockResolvedValue({
        id: 'existing',
        name: 'FINANCE_MANAGER',
        organizationId: 'org-1',
      });

      await expect(
        useCase.createCustomRole(buildActor(), { name: 'Finance Manager', permissionIds: ['perm-1'] }),
      ).rejects.toMatchObject({ code: ERROR_CODES.RESOURCE_CONFLICT });

      expect(repo.createRole).not.toHaveBeenCalled();
    });

    it('rejects non-existent permission IDs', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([]);

      await expect(
        useCase.createCustomRole(buildActor(), { name: 'Test Role', permissionIds: ['missing'] }),
      ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });
    });

    it('rolls back when replaceRolePermissions fails (atomicity)', async () => {
      const { useCase, repo, txPort } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.createRole.mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.replaceRolePermissions.mockRejectedValue(new Error('DB failure'));

      await expect(
        useCase.createCustomRole(buildActor(), { name: 'Test Role', permissionIds: ['perm-1'] }),
      ).rejects.toThrow('DB failure');

      expect(txPort.run).toHaveBeenCalled();
    });

    it('org admin cannot assign platform-scoped permissions', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_SETTINGS_UPDATE]);

      await expect(
        useCase.createCustomRole(
          buildOrgAdmin(),
          { name: 'Test Role', permissionIds: ['perm-2'] },
        ),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });
    });

    it('org admin cannot delegate permissions they do not own', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      const actor = buildOrgAdmin();
      actor.permissions = ['roles.create']; // has roles.create but NOT users.read

      await expect(
        useCase.createCustomRole(actor, { name: 'Test Role', permissionIds: ['perm-1'] }),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });
    });

    it('writes audit log on success', async () => {
      const { useCase, repo, audit } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.createRole.mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });

      await useCase.createCustomRole(buildActor(), { name: 'Test Role', permissionIds: ['perm-1'] });

      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'role.created',
          entityId: 'role-1',
          metadata: expect.objectContaining({ name: 'TEST ROLE' }),
        }),
        TX,
      );
    });

    it('writes nothing to audit on failure', async () => {
      const { useCase, repo, audit } = buildUseCase();

      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([]);

      await expect(
        useCase.createCustomRole(buildActor(), { name: 'X', permissionIds: ['missing'] }),
      ).rejects.toThrow();

      expect(audit.log).not.toHaveBeenCalled();
    });
  });

  describe('updateCustomRole', () => {
    it('normalizes name on update', async () => {
      const { useCase, repo, audit } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'FINANCE_MANAGER',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.updateRole.mockResolvedValue({
        id: 'role-1',
        name: 'AUDITOR',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findPermissionIdsForRole.mockResolvedValue(['perm-1']);

      await useCase.updateCustomRole(
        buildActor(),
        'role-1',
        { name: '  auditor  ' },
      );

      expect(repo.updateRole).toHaveBeenCalledWith(
        'role-1',
        expect.objectContaining({ name: 'AUDITOR' }),
        TX,
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'role.updated' }),
        TX,
      );
    });

    it('rolls back name change if repository update fails', async () => {
      const { useCase, repo, txPort } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.updateRole.mockResolvedValue(null); // returns null = failure

      await expect(
        useCase.updateCustomRole(buildActor(), 'role-1', { name: 'NEW_NAME' }),
      ).rejects.toMatchObject({ code: ERROR_CODES.INTERNAL_ERROR });

      expect(txPort.run).toHaveBeenCalled();
    });

    it('rolls back when permission validation fails for org admin', async () => {
      const { useCase, repo, audit } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.updateRole.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findPermissionsByIds.mockResolvedValue([PERM_SETTINGS_UPDATE]);
      const actor = buildOrgAdmin();

      await expect(
        useCase.updateCustomRole(actor, 'role-1', { permissionIds: ['perm-2'] }),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });

      expect(audit.log).not.toHaveBeenCalled();
    });

    it('invalidates user profiles when permissions change', async () => {
      const { useCase, repo, profile } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findRoleByName.mockResolvedValue(null);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);
      repo.updateRole.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });

      await useCase.updateCustomRole(buildActor(), 'role-1', { permissionIds: ['perm-1'] });

      expect(profile.invalidateUsersForRole).toHaveBeenCalledWith('role-1', TX);
    });

    it('does not invalidate profiles when only name changes', async () => {
      const { useCase, repo, profile } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'OLD_NAME',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findRoleByName.mockResolvedValue(null);
      repo.updateRole.mockResolvedValue({
        id: 'role-1',
        name: 'NEW_NAME',
        description: '',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findPermissionIdsForRole.mockResolvedValue(['perm-1']);
      repo.findPermissionsByIds.mockResolvedValue([PERM_USERS_READ]);

      await useCase.updateCustomRole(buildActor(), 'role-1', { name: 'NEW_NAME' });

      expect(profile.invalidateUsersForRole).not.toHaveBeenCalled();
    });
  });

  describe('deleteCustomRole', () => {
    it('deletes a custom role with no assigned users', async () => {
      const { useCase, repo, audit } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findUserIdsForRole.mockResolvedValue([]);

      await useCase.deleteCustomRole(buildActor(), 'role-1');

      expect(repo.deleteRole).toHaveBeenCalledWith('role-1', TX);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'role.deleted' }),
        TX,
      );
    });

    it('rejects deletion when role has assigned users', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findUserIdsForRole.mockResolvedValue(['user-1']);

      await expect(
        useCase.deleteCustomRole(buildActor(), 'role-1'),
      ).rejects.toMatchObject({ code: ERROR_CODES.RESOURCE_CONFLICT });

      expect(repo.deleteRole).not.toHaveBeenCalled();
    });

    it('rejects deletion of system roles', async () => {
      const { useCase, repo } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-admin',
        name: 'ADMIN',
        organizationId: null,
        isSystem: true,
      });

      await expect(
        useCase.deleteCustomRole(buildActor(), 'role-admin'),
      ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });

      expect(repo.deleteRole).not.toHaveBeenCalled();
    });

    it('runs deletion inside transaction', async () => {
      const { useCase, repo, txPort } = buildUseCase();

      repo.findRoleById.mockResolvedValue({
        id: 'role-1',
        name: 'TEST_ROLE',
        organizationId: 'org-1',
        isSystem: false,
      });
      repo.findUserIdsForRole.mockResolvedValue([]);

      await useCase.deleteCustomRole(buildActor(), 'role-1');

      expect(txPort.run).toHaveBeenCalled();
    });
  });
});
