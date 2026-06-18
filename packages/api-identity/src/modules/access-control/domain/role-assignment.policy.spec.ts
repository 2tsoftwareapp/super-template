import { describe, expect, it } from 'vitest';
import { AppError } from '@repo/api-core';
import { PERMISSION_NAMES, ROLE_NAMES } from '@repo/api-core';

import {
  assertCanAssignRoles,
  assertCanAssignRoleTargets,
  assertCanManageRoleCatalog,
  assertCanManagePrivilegedAccount,
  assertRoleNameIsNotReserved,
  assertRoleScopeCanBeAssigned,
} from './role-assignment.policy';

describe('RoleAssignmentPolicy', () => {
  const superAdmin = {
    userId: 'super',
    sessionId: 's1',
    email: 'super@test.com',
    displayName: 'Super',
    status: 'ACTIVE',
    roles: [ROLE_NAMES.SUPER_ADMIN],
    permissions: [],
    organizationId: 'org-1',
  };

  const admin = {
    ...superAdmin,
    userId: 'admin',
    roles: [ROLE_NAMES.ADMIN],
    permissions: [PERMISSION_NAMES.ROLES_MANAGE],
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

  it('allows super admin to assign privileged roles', () => {
    expect(() =>
      assertCanAssignRoles(
        superAdmin,
        [ROLE_NAMES.USER],
        [ROLE_NAMES.ADMIN],
      ),
    ).not.toThrow();
  });

  it('requires roles.manage for non-super-admin role changes', () => {
    expect(() =>
      assertCanAssignRoles(user, [ROLE_NAMES.USER], [ROLE_NAMES.USER]),
    ).toThrow(AppError);
  });

  it('allows org admins to assign the platform USER role and org roles', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        { name: ROLE_NAMES.USER, organizationId: null, isSystem: true },
        { name: 'BILLING_MANAGER', organizationId: 'org-1', isSystem: false },
      ]),
    ).not.toThrow();
  });

  it('blocks org admins from assigning roles outside their organization', () => {
    expect(() =>
      assertCanAssignRoleTargets(admin, [
        { name: 'BILLING_MANAGER', organizationId: 'org-2', isSystem: false },
      ]),
    ).toThrow(AppError);
  });

  it('blocks reserved role creation outside system initialization', () => {
    expect(() => assertRoleNameIsNotReserved(ROLE_NAMES.SUPER_ADMIN)).toThrow(
      AppError,
    );
  });

  it('allows org admins to manage custom roles in their active organization', () => {
    expect(() =>
      assertCanManageRoleCatalog(
        admin,
        { name: 'BILLING_MANAGER', organizationId: 'org-1', isSystem: false },
        'org-1',
      ),
    ).not.toThrow();
  });

  it('blocks org admins from managing roles in another organization', () => {
    expect(() =>
      assertCanManageRoleCatalog(
        admin,
        { name: 'BILLING_MANAGER', organizationId: 'org-2', isSystem: false },
        'org-2',
      ),
    ).toThrow(AppError);
  });

  it('blocks org admins from managing system roles', () => {
    expect(() =>
      assertCanManageRoleCatalog(
        admin,
        { name: ROLE_NAMES.ADMIN, organizationId: null, isSystem: true },
        null,
      ),
    ).toThrow(AppError);
  });

  it('allows super admin to manage platform roles', () => {
    expect(() =>
      assertCanManageRoleCatalog(
        superAdmin,
        { name: ROLE_NAMES.ADMIN, organizationId: null, isSystem: true },
        null,
      ),
    ).not.toThrow();
  });

  it('blocks platform ADMIN role assignment', () => {
    expect(() =>
      assertRoleScopeCanBeAssigned({
        name: ROLE_NAMES.ADMIN,
        organizationId: null,
        isSystem: true,
      }),
    ).toThrow(AppError);
  });

  it('allows organization ADMIN role assignment', () => {
    expect(() =>
      assertRoleScopeCanBeAssigned({
        name: ROLE_NAMES.ADMIN,
        organizationId: 'org-1',
        isSystem: true,
      }),
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
