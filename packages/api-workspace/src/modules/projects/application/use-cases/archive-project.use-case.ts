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
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
} from '@workspace/modules/activities/application/activity-emitter.port';

import type { ProjectView } from '../projects.types';

import { assertCanMutateProject } from '../../domain/project-access.policy';
import { ProjectsMapper } from '../projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from '../projects.repository.port';

@Injectable()
export class ArchiveProjectUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ): Promise<ProjectView> {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanMutateProject(user, project.ownerId);
    const updated = await this.projectsRepository.update(projectId, {
      deletedAt: new Date(),
      updatedById: user.userId,
    });

    await this.auditWriter.log({
      actorId: user.userId,
      action: 'project.deleted',
      entityType: 'project',
      entityId: projectId,
      requestContext,
    });

    await this.activityEmitter.emit({
      organizationId: project.organizationId,
      summary: `Project "${project.name}" was deleted`,
      entityType: 'project',
      entityId: projectId,
      actorId: user.userId,
    });

    return this.projectsMapper.toProjectView(updated ?? project);
  }
}
