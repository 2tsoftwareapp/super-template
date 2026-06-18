import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  PERMISSION_NAMES,
  PRIVILEGED_ROLE_NAMES,
  ROLE_NAMES,
} from '../access-control.constants';

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
