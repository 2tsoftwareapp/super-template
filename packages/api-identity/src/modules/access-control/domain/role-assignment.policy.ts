import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  PERMISSION_NAMES,
  PRIVILEGED_ROLE_NAMES,
  ROLE_NAMES,
} from '../access-control.constants';

export interface RolePolicyTarget {
  name: string;
  organizationId: string | null;
  isSystem: boolean;
}

export function assertCanManagePrivilegedAccount(
  actor: AuthenticatedRequestUser,
  targetRoleNames: string[],
): void {
  const targetIsPrivileged = targetRoleNames.some((roleName) =>
    PRIVILEGED_ROLE_NAMES.includes(
      roleName as (typeof PRIVILEGED_ROLE_NAMES)[number],
    ),
  );

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
  const targetIsPrivileged = targetRoleNames.some((roleName) =>
    PRIVILEGED_ROLE_NAMES.includes(
      roleName as (typeof PRIVILEGED_ROLE_NAMES)[number],
    ),
  );
  const assigningPrivilegedRole = desiredRoleNames.some((roleName) =>
    PRIVILEGED_ROLE_NAMES.includes(
      roleName as (typeof PRIVILEGED_ROLE_NAMES)[number],
    ),
  );

  if (!actorIsSuperAdmin && (targetIsPrivileged || assigningPrivilegedRole)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'Only SUPER_ADMIN can manage privileged accounts or roles',
      HttpStatus.FORBIDDEN,
    );
  }

  if (
    !actor.permissions.includes(PERMISSION_NAMES.ROLES_MANAGE) &&
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
    const isCurrentOrganizationRole = role.organizationId === actor.organizationId;

    if (isPlatformUserRole || isCurrentOrganizationRole) {
      continue;
    }

    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'Admins can only assign roles in their active organization',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertCanManageRoleCatalog(
  actor: AuthenticatedRequestUser,
  target: RolePolicyTarget | null,
  organizationId: string | null,
): void {
  const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

  if (actorIsSuperAdmin) {
    return;
  }

  if (!actor.permissions.includes(PERMISSION_NAMES.ROLES_MANAGE)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You do not have permission to manage roles',
      HttpStatus.FORBIDDEN,
    );
  }

  if (!actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'An organization context is required to manage roles',
      HttpStatus.FORBIDDEN,
    );
  }

  if (!organizationId || organizationId !== actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'Admins can only manage roles in their active organization',
      HttpStatus.FORBIDDEN,
    );
  }

  if (target?.isSystem || target?.organizationId === null) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'Only SUPER_ADMIN can manage platform or system roles',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertRoleNameIsNotReserved(name: string): void {
  const normalizedName = name.trim().toUpperCase();
  const isReserved = Object.values(ROLE_NAMES).some(
    (roleName) => roleName === normalizedName,
  );

  if (isReserved) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'Reserved roles can only be created by system initialization',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertRoleScopeCanBeAssigned(role: RolePolicyTarget): void {
  if (role.name === ROLE_NAMES.ADMIN && role.organizationId === null) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'ADMIN must be assigned as an organization-scoped role',
      HttpStatus.FORBIDDEN,
    );
  }

  if (role.name === ROLE_NAMES.SUPER_ADMIN) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'SUPER_ADMIN can only be assigned during system initialization',
      HttpStatus.FORBIDDEN,
    );
  }
}
