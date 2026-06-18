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
  type NotificationMessage,
  USER_NOTIFICATION_SENDER,
  type UserNotificationSender,
} from '@repo/api-core';
import { runInTransaction } from '@repo/api-database';

import type { ProjectView, UpdateProjectCommand } from './projects.types';

import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
} from '../../activities/application/activity-emitter.port';
import {
  assertCanMutateProject,
  resolveProjectOwnerId,
} from '../domain/project-access.policy';
import { ProjectsMapper } from './projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from './projects.repository.port';

@Injectable()
export class UpdateProjectUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
    @Inject(USER_NOTIFICATION_SENDER)
    private readonly notificationSender: UserNotificationSender,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    projectId: string,
    input: UpdateProjectCommand,
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
    const ownerId = input.ownerId
      ? resolveProjectOwnerId(user, input.ownerId)
      : project.ownerId;

    if (input.name && input.name !== project.name) {
      const existing = await this.projectsRepository.findActiveByOwnerAndName(
        ownerId,
        input.name,
      );

      if (existing && existing.id !== project.id) {
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          'A project with this name already exists',
          HttpStatus.CONFLICT,
        );
      }
    }

    const result = await runInTransaction(
      this.projectsRepository.client,
      async (transaction) => {
        const updated = await this.projectsRepository.update(
          projectId,
          {
            name: input.name ?? project.name,
            description: input.description ?? project.description,
            status: input.status ?? project.status,
            ownerId,
            updatedById: user.userId,
          },
          transaction,
        );

        if (!updated) {
          throw new AppError(
            ERROR_CODES.PROJECT_NOT_FOUND,
            'Project not found',
            HttpStatus.NOT_FOUND,
          );
        }

        let notificationToDispatch: NotificationMessage | null = null;

        if (ownerId !== project.ownerId) {
          notificationToDispatch = await this.notificationSender.sendToUser(
            user,
            {
              userId: ownerId,
              type: 'project.reassigned',
              title: 'Project reassigned',
              body: `${user.displayName} reassigned project ${updated.name} to you.`,
            },
            requestContext,
            transaction,
            { deferDispatch: true },
          );
        }

        await this.auditWriter.log(
          {
            actorId: user.userId,
            action: 'project.updated',
            entityType: 'project',
            entityId: projectId,
            requestContext,
          },
          transaction,
        );

        await this.activityEmitter.emit(
          {
            organizationId: updated.organizationId,
            summary: `Project "${updated.name}" was updated`,
            entityType: 'project',
            entityId: projectId,
            actorId: user.userId,
          },
          transaction,
        );

        return {
          project: this.projectsMapper.toProjectView(updated),
          notificationToDispatch,
        };
      },
    );

    if (result.notificationToDispatch) {
      void this.notificationSender.dispatch(result.notificationToDispatch);
    }

    return result.project;
  }
}
