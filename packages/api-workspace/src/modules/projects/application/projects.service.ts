import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core/common/types/request-context';
import { requireOrganizationId } from '@repo/api-core/common/utils/require-organization';
import { runInTransaction } from '@repo/api-database/transaction';
import { PERMISSION_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { ActivitiesService } from '../../activities/application/activities.service';
import { AttachmentsRepository } from '@repo/api-platform/modules/attachments/infrastructure/attachments.repository';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import type { NotificationDto } from '../../notifications/application/notifications.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { UsersRepository } from '@repo/api-identity/modules/users/infrastructure/users.repository';
import { ProjectsRepository } from '../infrastructure/projects.repository';
import type {
  CreateProjectDto,
  ProjectsQueryDto,
  UpdateProjectDto,
} from '../presentation/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
    private readonly activitiesService: ActivitiesService,
    private readonly attachmentsRepository: AttachmentsRepository,
  ) {}

  async list(user: AuthenticatedRequestUser, query: ProjectsQueryDto) {
    const canReadAll =
      user.permissions.includes(PERMISSION_NAMES.PROJECTS_READ) &&
      !user.roles.includes('USER');
    const organizationId = requireOrganizationId(user);
    const result = await this.projectsRepository.list(
      canReadAll
        ? {
            ...query,
            organizationId,
          }
        : {
            ...query,
            ownerId: user.userId,
            organizationId,
          },
    );

    return {
      rows: result.rows.map((row) => this.toProjectDto(row)),
      total: result.total,
    };
  }

  async getById(user: AuthenticatedRequestUser, projectId: string) {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertCanAccessProject(user, project.ownerId);
    return this.toProjectDto(project);
  }

  async create(
    user: AuthenticatedRequestUser,
    input: CreateProjectDto,
    requestContext?: RequestContext,
  ) {
    const ownerId = this.resolveOwnerId(user, input.ownerId);
    const owner = await this.usersRepository.findById(ownerId);

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

    const organizationId = requireOrganizationId(user);
    const projectDto = await runInTransaction(
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

        let notificationToDispatch: NotificationDto | null = null;

        if (ownerId !== user.userId) {
          notificationToDispatch = await this.notificationsService.sendToUser(
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

        await this.auditService.log(
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

        await this.activitiesService.emit(
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
          project: this.toProjectDto(project),
          notificationToDispatch,
        };
      },
    );

    if (projectDto.notificationToDispatch) {
      void this.notificationsService.dispatch(
        projectDto.notificationToDispatch,
      );
    }

    return projectDto.project;
  }

  async update(
    user: AuthenticatedRequestUser,
    projectId: string,
    input: UpdateProjectDto,
    requestContext?: RequestContext,
  ) {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertCanMutateProject(user, project.ownerId);
    const ownerId = input.ownerId
      ? this.resolveOwnerId(user, input.ownerId)
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

    const projectDto = await runInTransaction(
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

        let notificationToDispatch: NotificationDto | null = null;

        if (ownerId !== project.ownerId) {
          notificationToDispatch = await this.notificationsService.sendToUser(
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

        await this.auditService.log(
          {
            actorId: user.userId,
            action: 'project.updated',
            entityType: 'project',
            entityId: projectId,
            requestContext,
          },
          transaction,
        );

        await this.activitiesService.emit(
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
          project: this.toProjectDto(updated),
          notificationToDispatch,
        };
      },
    );

    if (projectDto.notificationToDispatch) {
      void this.notificationsService.dispatch(
        projectDto.notificationToDispatch,
      );
    }

    return projectDto.project;
  }

  async remove(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ) {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertCanMutateProject(user, project.ownerId);
    const updated = await this.projectsRepository.update(projectId, {
      deletedAt: new Date(),
      updatedById: user.userId,
    });

    await this.auditService.log({
      actorId: user.userId,
      action: 'project.deleted',
      entityType: 'project',
      entityId: projectId,
      requestContext,
    });

    await this.activitiesService.emit({
      organizationId: project.organizationId,
      summary: `Project "${project.name}" was deleted`,
      entityType: 'project',
      entityId: projectId,
      actorId: user.userId,
    });

    return this.toProjectDto(updated ?? project);
  }

  async restore(
    user: AuthenticatedRequestUser,
    projectId: string,
    requestContext?: RequestContext,
  ) {
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

    this.assertCanMutateProject(user, project.ownerId);
    const updated = await this.projectsRepository.update(projectId, {
      deletedAt: null,
      updatedById: user.userId,
    });

    await this.auditService.log({
      actorId: user.userId,
      action: 'project.restored',
      entityType: 'project',
      entityId: projectId,
      requestContext,
    });

    return this.toProjectDto(updated ?? project);
  }

  async listAttachments(user: AuthenticatedRequestUser, projectId: string) {
    const project = await this.projectsRepository.findById(projectId);

    if (!project) {
      throw new AppError(
        ERROR_CODES.PROJECT_NOT_FOUND,
        'Project not found',
        HttpStatus.NOT_FOUND,
      );
    }

    this.assertCanAccessProject(user, project.ownerId);

    const attachments = await this.attachmentsRepository.listByEntity(
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

  private resolveOwnerId(
    user: AuthenticatedRequestUser,
    requestedOwnerId?: string,
  ) {
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

  private assertCanAccessProject(
    user: AuthenticatedRequestUser,
    ownerId: string,
  ) {
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

  private assertCanMutateProject(
    user: AuthenticatedRequestUser,
    ownerId: string,
  ) {
    this.assertCanAccessProject(user, ownerId);

    if (!user.permissions.includes(PERMISSION_NAMES.PROJECTS_UPDATE)) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot modify this project',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private toProjectDto(
    project: Awaited<ReturnType<ProjectsRepository['findById']>> extends infer T
      ? Exclude<T, null>
      : never,
  ) {
    return {
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      status: project.status,
      ownerId: project.ownerId,
      createdById: project.createdById,
      updatedById: project.updatedById ?? null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      deletedAt: project.deletedAt?.toISOString() ?? null,
    };
  }
}
