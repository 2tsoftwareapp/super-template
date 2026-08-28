import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { AppError, ERROR_CODES } from "@repo/api-runtime";
import { isPrivilegedRoleName, ROLE_NAMES } from "@repo/feature-access-control/contracts";

/**
 * Role-assignment policy. Duplicated from
 * @repo/feature-access-control to break the users <-> access-control
 * dependsOn cycle. Must stay in sync with the access-control copy.
 */

export interface RolePolicyTarget {
  name: string;
  organizationId: string | null;
  isSystem: boolean;
}

export function assertCanAssignRoleTargets(
  actor: AuthenticatedRequestUser,
  desiredRoles: RolePolicyTarget[],
): void {
  const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

  if (actorIsSuperAdmin) {
    return;
  }

  if (!actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "An organization context is required to assign roles",
      403,
    );
  }

  for (const role of desiredRoles) {
    const isPlatformUserRole = role.organizationId === null && role.name === ROLE_NAMES.USER;

    if (isPlatformUserRole) {
      continue;
    }

    const isOrgCustomRole =
      !role.isSystem &&
      role.organizationId !== null &&
      role.organizationId === actor.organizationId;

    if (isOrgCustomRole) {
      continue;
    }

    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Admins can only assign the USER role or organization custom roles",
      403,
    );
  }
}

export function assertRoleScopeCanBeAssigned(
  role: RolePolicyTarget,
  actor?: Pick<AuthenticatedRequestUser, "roles">,
): void {
  if (role.name === ROLE_NAMES.ADMIN) {
    if (!actor?.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Only SUPER_ADMIN can assign the ADMIN role",
        403,
      );
    }

    if (!role.organizationId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "ADMIN must be assigned as an organization-scoped role",
        403,
      );
    }

    return;
  }

  if (role.name === ROLE_NAMES.SUPER_ADMIN) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "SUPER_ADMIN can only be assigned during system initialization",
      403,
    );
  }
}

export function assertCanManagePrivilegedAccount(
  actor: AuthenticatedRequestUser,
  targetRoleNames: string[],
): void {
  const targetIsPrivileged = targetRoleNames.some(isPrivilegedRoleName);

  if (targetIsPrivileged && !actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Only SUPER_ADMIN can manage privileged user accounts",
      403,
    );
  }
}
