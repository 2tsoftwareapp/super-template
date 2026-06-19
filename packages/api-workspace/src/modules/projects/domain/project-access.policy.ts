import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import { ACTION, AppError, ERROR_CODES, perm } from '@repo/api-core';

export function resolveProjectOwnerId(
  user: AuthenticatedRequestUser,
  requestedOwnerId?: string,
): string {
  if (!requestedOwnerId || requestedOwnerId === user.userId) {
    return user.userId;
  }

  if (!user.roles.includes('SUPER_ADMIN') && !user.roles.includes('ADMIN')) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You can only assign projects to yourself',
      HttpStatus.FORBIDDEN,
    );
  }

  return requestedOwnerId;
}

export function assertCanAccessProject(
  user: AuthenticatedRequestUser,
  ownerId: string,
): void {
  if (
    ownerId !== user.userId &&
    !user.roles.includes('SUPER_ADMIN') &&
    !user.roles.includes('ADMIN')
  ) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You cannot access this project',
      HttpStatus.FORBIDDEN,
    );
  }
}

export function assertCanMutateProject(
  user: AuthenticatedRequestUser,
  ownerId: string,
): void {
  assertCanAccessProject(user, ownerId);

  if (!user.permissions.includes(perm('projects', ACTION.UPDATE))) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You cannot modify this project',
      HttpStatus.FORBIDDEN,
    );
  }
}
