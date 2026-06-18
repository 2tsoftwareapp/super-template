import type {
  AuthenticatedRequestUser,
  ProjectLookup,
} from '@repo/api-core';

import { HttpStatus } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  PERMISSION_NAMES,
  requireOrganizationId,
} from '@repo/api-core';

export async function assertCanInvite(
  actor: AuthenticatedRequestUser,
  entityType: string,
  entityId: string,
  projectLookup: ProjectLookup,
): Promise<void> {
  if (!actor.permissions.includes(PERMISSION_NAMES.INVITATIONS_CREATE)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      'You do not have permission to create invitations',
      HttpStatus.FORBIDDEN,
    );
  }

  if (entityType === 'project') {
    if (!actor.permissions.includes(PERMISSION_NAMES.PROJECTS_INVITE)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have permission to invite project collaborators',
        HttpStatus.FORBIDDEN,
      );
    }

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
