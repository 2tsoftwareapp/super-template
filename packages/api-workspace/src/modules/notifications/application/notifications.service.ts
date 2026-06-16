import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';
import { requireOrganizationId } from '@repo/api-core';
import { AuditService } from '@repo/api-platform/modules/audit/application/audit.service';
import { UsersRepository } from '@repo/api-identity/modules/users/infrastructure/users.repository';
import {
  PUSH_NOTIFIER,
  type PushNotifier,
} from '../application/push.interface';
import { DeviceTokensRepository } from '../infrastructure/device-tokens.repository';
import { NotificationJobsRepository } from '../infrastructure/notification-jobs.repository';
import { NotificationStreamService } from '../infrastructure/notification-stream.service';
import { NotificationsRepository } from '../infrastructure/notifications.repository';
import type {
  NotificationJobsQueryDto,
  NotificationsQueryDto,
  RegisterDeviceDto,
  SendNotificationDto,
  SendNotificationRequestDto,
} from '../presentation/notifications.dto';

export type NotificationDto = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationJobDto = {
  id: string;
  actorId: string | null;
  audience: 'USER' | 'USERS' | 'ALL';
  targetUserId: string | null;
  userIds: string[] | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  scheduledAt: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  recipientCount: number | null;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const DUE_JOB_BATCH_SIZE = 20;
const RECIPIENT_BATCH_SIZE = 100;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationJobsRepository: NotificationJobsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly deviceTokensRepository: DeviceTokensRepository,
    private readonly notificationStreamService: NotificationStreamService,
    @Inject(PUSH_NOTIFIER) private readonly pushNotifier: PushNotifier,
    private readonly auditService: AuditService,
  ) {}

  async sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendNotificationDto,
    requestContext?: RequestContext,
    executor?: DatabaseExecutor,
    options?: { deferDispatch?: boolean },
  ) {
    const resolvedOrganizationId =
      actor?.organizationId ?? input.organizationId ?? null;

    if (!resolvedOrganizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'organizationId is required to send notifications',
        HttpStatus.BAD_REQUEST,
      );
    }

    const notification = await this.notificationsRepository.create(
      {
        organizationId: resolvedOrganizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data ?? null,
      },
      executor,
    );

    if (!notification) {
      throw new Error('Notification insert returned no rows');
    }

    if (actor) {
      await this.auditService.log(
        {
          actorId: actor.userId,
          action: 'notification.sent',
          entityType: 'notification',
          entityId: notification.id,
          metadata: {
            userId: input.userId,
            type: input.type,
          },
          requestContext,
        },
        executor,
      );
    }

    const dto = this.toNotificationDto(notification);

    if (!options?.deferDispatch) {
      void this.dispatch(dto);
    }

    return dto;
  }

  async createDeliveryJob(
    actor: AuthenticatedRequestUser,
    input: SendNotificationRequestDto,
    requestContext?: RequestContext,
  ) {
    this.assertAudiencePayload(input);

    const scheduledAt = input.scheduledAt
      ? new Date(input.scheduledAt)
      : new Date();

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'scheduledAt must be a valid ISO-8601 datetime',
        HttpStatus.BAD_REQUEST,
      );
    }

    const job = await this.notificationJobsRepository.create({
      organizationId: requireOrganizationId(actor),
      actorId: actor.userId,
      audience: input.audience,
      targetUserId: input.audience === 'USER' ? (input.userId ?? null) : null,
      userIds: input.audience === 'USERS' ? (input.userIds ?? null) : null,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      scheduledAt,
      status: 'PENDING',
    });

    if (!job) {
      throw new Error('Notification job insert returned no rows');
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'notification.job.created',
      entityType: 'notification_job',
      entityId: job.id,
      metadata: {
        audience: input.audience,
        scheduledAt: scheduledAt.toISOString(),
      },
      requestContext,
    });

    const jobDto = this.toNotificationJobDto(job);

    if (scheduledAt.getTime() <= Date.now()) {
      await this.processJob(job.id);
      const processed = await this.notificationJobsRepository.findById(job.id);
      return processed ? this.toNotificationJobDto(processed) : jobDto;
    }

    return jobDto;
  }

  async listJobs(query: NotificationJobsQueryDto) {
    const result = await this.notificationJobsRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status } : {}),
    });

    return {
      rows: result.rows.map((row) => this.toNotificationJobDto(row)),
      total: result.total,
    };
  }

  async getJob(jobId: string) {
    const job = await this.notificationJobsRepository.findById(jobId);

    if (!job) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
        'Notification job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toNotificationJobDto(job);
  }

  async cancelJob(actor: AuthenticatedRequestUser, jobId: string) {
    const cancelled =
      await this.notificationJobsRepository.markCancelled(jobId);

    if (!cancelled) {
      const existing = await this.notificationJobsRepository.findById(jobId);

      if (!existing) {
        throw new AppError(
          ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
          'Notification job not found',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_CANCELLABLE,
        'Only pending notification jobs can be cancelled',
        HttpStatus.CONFLICT,
      );
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'notification.job.cancelled',
      entityType: 'notification_job',
      entityId: jobId,
    });

    return this.toNotificationJobDto(cancelled);
  }

  async processDueJobs() {
    const dueJobs =
      await this.notificationJobsRepository.listDue(DUE_JOB_BATCH_SIZE);

    for (const job of dueJobs) {
      await this.processJob(job.id);
    }
  }

  async processJob(jobId: string) {
    const locked = await this.notificationJobsRepository.markProcessing(jobId);

    if (!locked) {
      return;
    }

    try {
      const recipientIds = await this.resolveRecipientIds(locked);

      if (recipientIds.length === 0) {
        await this.notificationJobsRepository.markCompleted(jobId, 0);
        return;
      }

      let deliveredCount = 0;
      const organizationId = locked.organizationId;

      if (!organizationId) {
        throw new Error('Notification job is missing organizationId');
      }

      for (
        let offset = 0;
        offset < recipientIds.length;
        offset += RECIPIENT_BATCH_SIZE
      ) {
        const batch = recipientIds.slice(offset, offset + RECIPIENT_BATCH_SIZE);
        const notifications = await this.notificationsRepository.createMany(
          batch.map((userId) => ({
            organizationId,
            userId,
            type: locked.type,
            title: locked.title,
            body: locked.body,
            data: locked.data ?? null,
          })),
        );

        for (const notification of notifications) {
          void this.dispatch(this.toNotificationDto(notification));
        }

        deliveredCount += notifications.length;
      }

      await this.notificationJobsRepository.markCompleted(
        jobId,
        deliveredCount,
      );
    } catch (error) {
      await this.notificationJobsRepository.markFailed(
        jobId,
        error instanceof Error ? error.message : 'Unknown processing error',
      );
    }
  }

  async dispatch(notification: NotificationDto) {
    this.notificationStreamService.emit(notification.userId, notification);

    try {
      await this.pushNotifier.sendToUser(notification.userId, {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    } catch {
      // Push delivery is best-effort; inbox state remains the source of truth.
    }
  }

  async registerDevice(
    user: AuthenticatedRequestUser,
    input: RegisterDeviceDto,
  ) {
    const deviceToken = await this.deviceTokensRepository.upsert({
      userId: user.userId,
      token: input.token,
      platform: input.platform,
    });

    if (!deviceToken) {
      throw new Error('Device token upsert returned no rows');
    }

    return {
      id: deviceToken.id,
      platform: deviceToken.platform,
      token: deviceToken.token,
      lastUsedAt: deviceToken.lastUsedAt.toISOString(),
    };
  }

  async unregisterDevice(user: AuthenticatedRequestUser, token: string) {
    const deviceToken = await this.deviceTokensRepository.deleteByToken(
      user.userId,
      token,
    );

    if (!deviceToken) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_DEVICE_NOT_FOUND,
        'Device token not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async listForUser(
    user: AuthenticatedRequestUser,
    query: NotificationsQueryDto,
  ) {
    const result = await this.notificationsRepository.listForUser(
      user.userId,
      query,
    );

    return {
      rows: result.rows.map((row) => this.toNotificationDto(row)),
      total: result.total,
    };
  }

  async unreadCount(user: AuthenticatedRequestUser) {
    return this.notificationsRepository.getUnreadCount(user.userId);
  }

  async markRead(user: AuthenticatedRequestUser, notificationId: string) {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.notificationsRepository.markRead(notificationId);
    return this.toNotificationDto(updated ?? notification);
  }

  async markAllRead(user: AuthenticatedRequestUser) {
    await this.notificationsRepository.markAllRead(user.userId);
  }

  async delete(user: AuthenticatedRequestUser, notificationId: string) {
    const notification =
      await this.notificationsRepository.findById(notificationId);

    if (!notification || notification.userId !== user.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_NOT_FOUND,
        'Notification not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.notificationsRepository.delete(notificationId);
  }

  private assertAudiencePayload(input: SendNotificationRequestDto) {
    if (input.audience === 'USER' && !input.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_INVALID_AUDIENCE,
        'userId is required when audience is USER',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      input.audience === 'USERS' &&
      (!input.userIds || input.userIds.length === 0)
    ) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_INVALID_AUDIENCE,
        'userIds is required when audience is USERS',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async resolveRecipientIds(
    job: Awaited<
      ReturnType<NotificationJobsRepository['findById']>
    > extends infer T
      ? Exclude<T, null>
      : never,
  ) {
    if (job.audience === 'USER') {
      if (!job.targetUserId) {
        return [];
      }

      const user = await this.usersRepository.findById(job.targetUserId);
      return user && user.status === 'ACTIVE' ? [user.id] : [];
    }

    if (job.audience === 'USERS') {
      return this.usersRepository.filterExistingUserIds(job.userIds ?? []);
    }

    return this.usersRepository.listDeliverableUserIds();
  }

  private toNotificationDto(
    notification: Awaited<
      ReturnType<NotificationsRepository['findById']>
    > extends infer T
      ? Exclude<T, null>
      : never,
  ): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data ?? null,
      readAt: notification.readAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  private toNotificationJobDto(
    job: Awaited<
      ReturnType<NotificationJobsRepository['findById']>
    > extends infer T
      ? Exclude<T, null>
      : never,
  ): NotificationJobDto {
    return {
      id: job.id,
      actorId: job.actorId,
      audience: job.audience,
      targetUserId: job.targetUserId,
      userIds: job.userIds ?? null,
      type: job.type,
      title: job.title,
      body: job.body,
      data: job.data ?? null,
      scheduledAt: job.scheduledAt.toISOString(),
      status: job.status,
      recipientCount: job.recipientCount,
      processedAt: job.processedAt?.toISOString() ?? null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
