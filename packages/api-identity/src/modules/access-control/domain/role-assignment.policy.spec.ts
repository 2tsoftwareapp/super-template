import { describe, expect, it } from 'vitest';
import { AppError } from '@repo/api-core';
import { PERMISSION_NAMES, ROLE_NAMES } from '@repo/api-core';

import {
  assertCanAssignRoles,
  assertCanManagePrivilegedAccount,
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
});
