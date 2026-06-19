import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import { ACTION, AppError, ERROR_CODES, hasPermission, isPrivilegedRoleName, perm, ROLE_NAMES } from '@repo/api-core';

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
      'Only SUPER_ADMIN can manage privileged user accounts',
      HttpStatus.FORBIDDEN,
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
      'Only SUPER_ADMIN can manage privileged accounts or roles',
      HttpStatus.FORBIDDEN,
    );
  }

  if (!actorIsSuperAdmin) {
    const invalidRole = desiredRoleNames.find(
      (roleName) => roleName !== ROLE_NAMES.USER,
    );

    if (invalidRole) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Admins can only assign the USER role',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  if (
    desiredRoleNames.includes(ROLE_NAMES.SUPER_ADMIN) ||
    (!actorIsSuperAdmin && desiredRoleNames.includes(ROLE_NAMES.ADMIN))
  ) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'This role cannot be assigned through the API',
      HttpStatus.FORBIDDEN,
    );
  }

  if (
    !actor.permissions.includes(perm('roles', ACTION.UPDATE)) &&
    !actorIsSuperAdmin
  ) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You do not have permission to manage roles',
      HttpStatus.FORBIDDEN,
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
      'An organization context is required to assign roles',
      HttpStatus.FORBIDDEN,
    );
  }

  for (const role of desiredRoles) {
    const isPlatformUserRole =
      role.organizationId === null && role.name === ROLE_NAMES.USER;

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
      'Admins can only assign the USER role or organization custom roles',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertCanManageCustomRoleCatalog(
  actor: AuthenticatedRequestUser,
): void {
  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  const canManage =
    hasPermission(actor.permissions, 'roles', ACTION.CREATE) ||
    hasPermission(actor.permissions, 'roles', ACTION.UPDATE) ||
    hasPermission(actor.permissions, 'roles', ACTION.DELETE);

  if (!canManage) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You do not have permission to manage roles',
      HttpStatus.FORBIDDEN,
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
      'Custom roles can only be created within your organization',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertCanModifyCustomRole(
  actor: AuthenticatedRequestUser,
  role: RolePolicyTarget,
): void {
  if (role.isSystem) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'System roles cannot be modified',
      HttpStatus.FORBIDDEN,
    );
  }

  assertCanManageCustomRoleCatalog(actor);

  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  if (!role.organizationId || role.organizationId !== actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You can only manage custom roles in your organization',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertRoleScopeCanBeAssigned(
  role: RolePolicyTarget,
  actor?: Pick<AuthenticatedRequestUser, 'roles'>,
): void {
  if (role.name === ROLE_NAMES.ADMIN) {
    if (!actor?.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Only SUPER_ADMIN can assign the ADMIN role',
        HttpStatus.FORBIDDEN,
      );
    }

    if (!role.organizationId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'ADMIN must be assigned as an organization-scoped role',
        HttpStatus.FORBIDDEN,
      );
    }

    return;
  }

  if (role.name === ROLE_NAMES.SUPER_ADMIN) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'SUPER_ADMIN can only be assigned during system initialization',
      HttpStatus.FORBIDDEN,
    );
  }
}
