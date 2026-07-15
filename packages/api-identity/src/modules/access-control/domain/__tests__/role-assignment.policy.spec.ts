import { describe, expect, it } from 'vitest';
import { ACTION, AppError, perm, ROLE_NAMES } from '@repo/api-core';

import {
  assertCanAssignRoles,
  assertCanAssignRoleTargets,
  assertCanManagePrivilegedAccount,
  assertRoleScopeCanBeAssigned,
} from '../role-assignment.policy';

describe('RoleAssignmentPolicy', () => {
  const superAdmin = {
    userId: 'super',
    sessionId: 's1',
    email: 'super@test.com',
    displayName: 'Super',
    status: 'ACTIVE' as const,
    roles: [ROLE_NAMES.SUPER_ADMIN],
    permissions: [],
    organizationId: 'org-1',
  };

  const admin = {
    ...superAdmin,
    userId: 'admin',
    roles: [ROLE_NAMES.ADMIN],
    permissions: [perm('roles', ACTION.UPDATE)],
  };

  const user = {
    ...superAdmin,
    userId: 'user',
    roles: [ROLE_NAMES.USER],
    permissions: [],
  };

  it('blocks non-super-admins from managing privileged accounts', () => {
    expect(() =>
      assertCanManagePrivilegedAccount(admin, [ROLE_NAMES.SUPER_ADMIN]),
    ).toThrow(AppError);
  });

  it('allows super admin to assign ADMIN and USER roles', () => {
    expect(() =>
      assertCanAssignRoles(superAdmin, [ROLE_NAMES.USER], [ROLE_NAMES.ADMIN]),
    ).not.toThrow();
  });

  it('requires roles.update for non-super-admin role changes', () => {
    expect(() =>
      assertCanAssignRoles(user, [ROLE_NAMES.USER], [ROLE_NAMES.USER]),
    ).toThrow(AppError);
  });

  it('allows org admins to assign only the platform USER role', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        { name: ROLE_NAMES.USER, organizationId: null, isSystem: true },
      ]),
    ).not.toThrow();
  });

  it('allows org admins to assign organization custom roles', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        {
          name: 'Project Manager',
          organizationId: 'org-1',
          isSystem: false,
        },
      ]),
    ).not.toThrow();
  });

  it('blocks org admins from assigning custom roles in another organization', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        {
          name: 'Project Manager',
          organizationId: 'org-2',
          isSystem: false,
        },
      ]),
    ).toThrow(AppError);
  });

  it('blocks org admins from assigning ADMIN', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        {
          name: ROLE_NAMES.ADMIN,
          organizationId: 'org-1',
          isSystem: true,
        },
      ]),
    ).toThrow(AppError);
  });

  it('blocks org admins from assigning roles outside USER', () => {
    expect(() =>
      assertCanAssignRoles(admin, [ROLE_NAMES.USER], [ROLE_NAMES.ADMIN]),
    ).toThrow(AppError);
  });

  it('blocks platform ADMIN role assignment for non-super-admins', () => {
    expect(() =>
      assertRoleScopeCanBeAssigned({
        name: ROLE_NAMES.ADMIN,
        organizationId: 'org-1',
        isSystem: true,
      }),
    ).toThrow(AppError);

    expect(() =>
      assertRoleScopeCanBeAssigned(
        {
          name: ROLE_NAMES.ADMIN,
          organizationId: 'org-1',
          isSystem: true,
        },
        admin,
      ),
    ).toThrow(AppError);
  });

  it('allows super admin to assign organization ADMIN during user management', () => {
    expect(() =>
      assertRoleScopeCanBeAssigned(
        {
          name: ROLE_NAMES.ADMIN,
          organizationId: 'org-1',
          isSystem: true,
        },
        superAdmin,
      ),
    ).not.toThrow();
  });

  it('blocks SUPER_ADMIN assignment outside system initialization', () => {
    expect(() =>
      assertRoleScopeCanBeAssigned({
        name: ROLE_NAMES.SUPER_ADMIN,
        organizationId: null,
        isSystem: true,
      }),
    ).toThrow(AppError);
  });
});
