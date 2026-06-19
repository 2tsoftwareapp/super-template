import type {
  AuthenticatedRequestUser,
  ProjectLookup } from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import { ACTION, AppError, ERROR_CODES, perm, requireOrganizationId } from '@repo/api-core';

export async function assertCanInvite(
  actor: AuthenticatedRequestUser,
  entityType: string,
  entityId: string,
  projectLookup: ProjectLookup,
): Promise<void> {
  if (!actor.permissions.includes(perm('invitations', ACTION.CREATE))) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You do not have permission to create invitations',
      HttpStatus.FORBIDDEN,
    );
  }

  if (entityType === 'project') {
    const project = await projectLookup.findById(entityId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      project.ownerId !== actor.userId &&
      !actor.roles.includes('ADMIN') &&
      !actor.roles.includes('SUPER_ADMIN')
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot invite collaborators to this project',
        HttpStatus.FORBIDDEN,
      );
    }
  }
}

export async function resolveInvitationOrganizationId(
  actor: AuthenticatedRequestUser,
  entityType: string,
  entityId: string,
  projectLookup: ProjectLookup,
): Promise<string> {
  if (entityType === 'project') {
    const project = await projectLookup.findById(entityId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return project.organizationId;
  }

  return requireOrganizationId(actor);
}
