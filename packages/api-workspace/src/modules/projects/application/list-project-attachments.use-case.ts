import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ENTITY_ATTACHMENT_LISTING,
  type EntityAttachmentListing,
  ERROR_CODES,
} from '@repo/api-core';

import type { ProjectAttachmentView } from './projects.types';

import { assertCanAccessProject } from '../domain/project-access.policy';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from './projects.repository.port';

@Injectable()
export class ListProjectAttachmentsUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    @Inject(ENTITY_ATTACHMENT_LISTING)
    private readonly entityAttachments: EntityAttachmentListing,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    projectId: string,
  ): Promise<ProjectAttachmentView[]> {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanAccessProject(user, project.ownerId);

    const attachments = await this.entityAttachments.listByEntity(
      'project',
      projectId,
    );

    return attachments.map((attachment) => ({
      id: attachment.id,
      fileId: attachment.fileId,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      label: attachment.label,
      createdById: attachment.createdById,
      createdAt: attachment.createdAt.toISOString(),
      updatedAt: attachment.updatedAt.toISOString(),
    }));
  }
}
