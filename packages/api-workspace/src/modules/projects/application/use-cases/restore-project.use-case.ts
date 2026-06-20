import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import type { ProjectView } from '../projects.types';

import { assertCanMutateProject } from '../../domain/project-access.policy';
import { ProjectsMapper } from '../projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from '../projects.repository.port';

@Injectable()
export class RestoreProjectUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ): Promise<ProjectView> {
    const project = await this.projectsRepository.findById(
      projectId,
      undefined,
      true,
    );

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanMutateProject(user, project.ownerId);
    const updated = await this.projectsRepository.update(projectId, {
      deletedAt: null,
      updatedById: user.userId,
    });

    await this.auditWriter.log({
      actorId: user.userId,
      action: 'project.restored',
      entityType: 'project',
      entityId: projectId,
      requestContext,
    });

    return this.projectsMapper.toProjectView(updated ?? project);
  }
}
