import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { ACTION, hasPermission, perm } from "@repo/api-runtime";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import { isPrivilegedRoleName, ROLE_NAMES } from "../access-control.constants";

export interface RolePolicyTarget {
  name: string;
  organizationId: string | null;
  isSystem: boolean;
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

export function assertCanAssignRoles(
  actor: AuthenticatedRequestUser,
  targetRoleNames: string[],
  desiredRoleNames: string[],
): void {
  const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
  const targetIsPrivileged = targetRoleNames.some(isPrivilegedRoleName);
  const assigningPrivilegedRole = desiredRoleNames.some(isPrivilegedRoleName);

  if (!actorIsSuperAdmin && (targetIsPrivileged || assigningPrivilegedRole)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Only SUPER_ADMIN can manage privileged accounts or roles",
      403,
    );
  }

  if (!actorIsSuperAdmin) {
    const privilegedRole = desiredRoleNames.find(isPrivilegedRoleName);

    if (privilegedRole) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "Admins can only assign the USER role or custom roles",
        403,
      );
    }
  }

  if (
    desiredRoleNames.includes(ROLE_NAMES.SUPER_ADMIN) ||
    (!actorIsSuperAdmin && desiredRoleNames.includes(ROLE_NAMES.ADMIN))
  ) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "This role cannot be assigned through the API",
      403,
    );
  }

  if (!actor.permissions.includes(perm("roles", ACTION.UPDATE)) && !actorIsSuperAdmin) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "You do not have permission to manage roles",
      403,
    );
  }
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

export function assertCanManageCustomRoleCatalog(actor: AuthenticatedRequestUser): void {
  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  const canManage =
    hasPermission(actor.permissions, "roles", ACTION.CREATE) ||
    hasPermission(actor.permissions, "roles", ACTION.UPDATE) ||
    hasPermission(actor.permissions, "roles", ACTION.DELETE);

  if (!canManage) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "You do not have permission to manage roles",
      403,
    );
  }
}

export function assertCanCreateCustomRole(
  actor: AuthenticatedRequestUser,
  organizationId: string | null,
): void {
  assertCanManageCustomRoleCatalog(actor);

  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  if (!organizationId || organizationId !== actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Custom roles can only be created within your organization",
      403,
    );
  }
}

export function assertCanModifyCustomRole(
  actor: AuthenticatedRequestUser,
  role: RolePolicyTarget,
): void {
  if (role.isSystem) {
    throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, "System roles cannot be modified", 403);
  }

  assertCanManageCustomRoleCatalog(actor);

  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  if (!role.organizationId || role.organizationId !== actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "You can only manage custom roles in your organization",
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
