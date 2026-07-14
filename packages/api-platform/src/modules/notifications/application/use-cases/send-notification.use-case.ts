import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  ORGANIZATION_LOOKUP,
  type OrganizationLookup,
} from '@repo/api-core';

import type {
  NotificationView,
  SendNotificationCommand,
} from '../notifications.types';

import { NotificationsMapper } from '../notifications.mapper';
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from '../ports/notifications.repository.port';
import { NotificationDispatchService } from '../services/notification-dispatch.service';

@Injectable()
export class SendNotificationUseCase {
  private readonly notificationsMapper = new NotificationsMapper();

  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookup,
    private readonly dispatchService: NotificationDispatchService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser | null,
    input: SendNotificationCommand,
    requestContext?: RequestContext,
    executor?: TransactionExecutor,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationView> {
    const recipientOrganizationId = input.userId
      ? await this.organizationLookup.findPrimaryOrganizationId(
          input.userId,
          executor,
        )
      : null;
    const resolvedOrganizationId =
      input.organizationId ??
      recipientOrganizationId ??
      actor?.organizationId ??
      null;

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
      await this.auditWriter.log(
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

    const view = this.notificationsMapper.toNotificationView(notification);

    if (!options?.deferDispatch) {
      this.dispatchService.dispatch(view);
    }

    return view;
  }
}
