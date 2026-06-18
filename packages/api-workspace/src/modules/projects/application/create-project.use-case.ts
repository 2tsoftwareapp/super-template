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
  ORGANIZATION_LOOKUP,
  type OrganizationLookup,
  requireOrganizationId,
  USER_LOOKUP,
  USER_NOTIFICATION_SENDER,
  type UserLookup,
  type UserNotificationSender,
} from '@repo/api-core';
import { runInTransaction } from '@repo/api-database';

import type { CreateProjectCommand, ProjectView } from './projects.types';

import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
} from '../../activities/application/activity-emitter.port';
import { resolveProjectOwnerId } from '../domain/project-access.policy';
import { ProjectsMapper } from './projects.mapper';
import {
  PROJECTS_REPOSITORY,
  type ProjectsRepositoryPort,
} from './projects.repository.port';

@Injectable()
export class CreateProjectUseCase {
  constructor(
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepositoryPort,
    private readonly projectsMapper: ProjectsMapper,
    @Inject(USER_LOOKUP) private readonly userLookup: UserLookup,
    @Inject(USER_NOTIFICATION_SENDER)
    private readonly notificationSender: UserNotificationSender,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookup,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    input: CreateProjectCommand,
    requestContext?: RequestContext,
  ): Promise<ProjectView> {
    const ownerId = resolveProjectOwnerId(user, input.ownerId);
    const owner = await this.userLookup.findById(ownerId);

    if (!owner) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'Owner not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.projectsRepository.findActiveByOwnerAndName(
      ownerId,
      input.name,
    );

    if (existing) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'A project with this name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const actorOrganizationId = requireOrganizationId(user);
    const organizationId =
      ownerId === user.userId
        ? actorOrganizationId
        : ((await this.organizationLookup.findPrimaryOrganizationId(ownerId)) ??
          actorOrganizationId);

    const result = await runInTransaction(
      this.projectsRepository.client,
      async (transaction) => {
        const project = await this.projectsRepository.create(
          {
            organizationId,
            ownerId,
            name: input.name,
            description: input.description ?? null,
            status: input.status ?? 'DRAFT',
            createdById: user.userId,
          },
          transaction,
        );

        if (!project) {
          throw new Error('Project insert returned no rows');
        }

        let notificationToDispatch: NotificationMessage | null = null;

        if (ownerId !== user.userId) {
          notificationToDispatch = await this.notificationSender.sendToUser(
            user,
            {
              userId: ownerId,
              type: 'project.assigned',
              title: 'Project assigned',
              body: `${user.displayName} assigned you to project ${project.name}.`,
            },
            requestContext,
            transaction,
            { deferDispatch: true },
          );
        }

        await this.auditWriter.log(
          {
            actorId: user.userId,
            action: 'project.created',
            entityType: 'project',
            entityId: project.id,
            metadata: {
              ownerId,
            },
            requestContext,
          },
          transaction,
        );

        await this.activityEmitter.emit(
          {
            organizationId,
            summary: `Project "${project.name}" was created`,
            entityType: 'project',
            entityId: project.id,
            actorId: user.userId,
            metadata: { ownerId },
          },
          transaction,
        );

        return {
          project: this.projectsMapper.toProjectView(project),
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
