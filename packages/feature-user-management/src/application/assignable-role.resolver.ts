import type { TransactionExecutor } from "@repo/api-kernel";
import type { UserAccessControl } from "@repo/feature-access-control/contracts";
import type { AssignableRoleName } from "@repo/feature-users/contracts";

import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ROLE_NAMES, type RolePolicyTarget } from "@repo/feature-access-control/contracts";

export async function resolveAssignableRole(
  accessControlService: UserAccessControl,
  roleName: AssignableRoleName,
  organizationId: string | null,
  executor?: TransactionExecutor,
): Promise<{ id: string; target: RolePolicyTarget }> {
  const isSystemRole = roleName === ROLE_NAMES.USER || roleName === ROLE_NAMES.ADMIN;

  if (roleName === ROLE_NAMES.USER) {
    const role = await accessControlService.getRoleByName(ROLE_NAMES.USER, null, executor);

    if (!role) {
      throw new AppError(ERROR_CODES.INTERNAL_ERROR, "USER role is missing", 500);
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
      ? await accessControlService.getOrganizationRoleByName(
          ROLE_NAMES.ADMIN,
          organizationId,
          executor,
        )
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

  throw new AppError(ERROR_CODES.VALIDATION_FAILED, `Unknown role: ${roleName}`, 400);
}

export async function resolveRoleById(
  accessControlService: UserAccessControl,
  roleId: string,
  executor?: TransactionExecutor,
): Promise<{ id: string; name: string; organizationId: string | null; isSystem: boolean }> {
  const role = await accessControlService.getRoleById(roleId, executor);

  if (!role) {
    throw new AppError(ERROR_CODES.VALIDATION_FAILED, `Role not found: ${roleId}`, 400);
  }

  return {
    id: role.id,
    name: role.name,
    organizationId: role.organizationId,
    isSystem: role.isSystem,
  };
}
