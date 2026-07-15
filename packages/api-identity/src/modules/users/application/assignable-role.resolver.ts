import type { TransactionExecutor } from '@repo/api-core';

import { AppError, ERROR_CODES } from '@repo/api-core';

import type { AccessControlService } from '../../access-control/application/access-control.service';
import type { RolePolicyTarget } from '../../access-control/domain/role-assignment.policy';
import type { AssignableRoleName } from './users.types';

import { ROLE_NAMES } from '../../access-control/access-control.constants';

export async function resolveAssignableRole(
  accessControlService: AccessControlService,
  roleName: AssignableRoleName,
  organizationId: string | null,
  executor?: TransactionExecutor,
): Promise<{ id: string; target: RolePolicyTarget }> {
  const isSystemRole = roleName === ROLE_NAMES.USER || roleName === ROLE_NAMES.ADMIN;

  if (roleName === ROLE_NAMES.USER) {
    const role = await accessControlService.getRoleByName(
      ROLE_NAMES.USER,
      null,
      executor,
    );

    if (!role) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'USER role is missing',
        500,
      );
    }

    return {
      id: role.id,
      target: {
        name: role.name,
        organizationId: role.organizationId,
        isSystem: role.isSystem,
      },
    };
  }

  if (roleName === ROLE_NAMES.ADMIN || !isSystemRole) {
    if (!organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        `organizationId is required when assigning ${roleName}`,
        400,
      );
    }

    const role = isSystemRole
      ? await accessControlService.getOrganizationRoleByName(ROLE_NAMES.ADMIN, organizationId, executor)
      : await accessControlService.getRoleByName(roleName, organizationId, executor);

    if (!role) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        `Role ${roleName} not found for organization ${organizationId}`,
        500,
      );
    }

    return {
      id: role.id,
      target: {
        name: role.name,
        organizationId: role.organizationId,
        isSystem: role.isSystem,
      },
    };
  }

  throw new AppError(
    ERROR_CODES.VALIDATION_FAILED,
    `Unknown role: ${roleName}`,
    400,
  );
}
