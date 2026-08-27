import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  ERROR_CODES,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import {
  ORGANIZATION_LOOKUP,
  type OrganizationLookup,
} from "@repo/feature-organizations/contracts";

import type { NotificationView, SendNotificationCommand } from "../notifications.types";

import { NotificationsMapper } from "../notifications.mapper";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "../ports/notifications.repository.port";
import { NotificationDispatchService } from "../services/notification-dispatch.service";

@Injectable()
export class SendNotificationUseCase {
  constructor(
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    @Inject(ORGANIZATION_LOOKUP)
    private readonly organizationLookup: OrganizationLookup,
    private readonly dispatchService: NotificationDispatchService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(TRANSACTION_PORT)
    private readonly transactionPort: TransactionPort,
    private readonly notificationsMapper: NotificationsMapper,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser | null,
    input: SendNotificationCommand,
    requestContext?: RequestContext,
    executor?: TransactionExecutor,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationView> {
    const recipientOrganizationId = input.userId
      ? await this.organizationLookup.findPrimaryOrganizationId(input.userId, executor)
      : null;
    const resolvedOrganizationId =
      input.organizationId ?? recipientOrganizationId ?? actor?.organizationId ?? null;

    if (!resolvedOrganizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "organizationId is required to send notifications",
        HttpStatus.BAD_REQUEST,
      );
    }

    let isExisting = false;

    const persist = async (tx: TransactionExecutor) => {
      const notification = await this.notificationsRepository.create(
        {
          organizationId: resolvedOrganizationId,
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          data: input.data ?? null,
          sourceBackgroundJobId: input.sourceBackgroundJobId ?? null,
        },
        tx,
      );

      if (!notification) {
        if (input.sourceBackgroundJobId) {
          const existing = await this.notificationsRepository.findBySourceBackgroundJobId(
            input.sourceBackgroundJobId,
            tx,
          );
          if (existing) {
            isExisting = true;
            return existing;
          }
        }
        throw new Error("Notification insert returned no rows");
      }

      if (actor) {
        await this.auditWriter.log(
          {
            actorId: actor.userId,
            action: "notification.sent",
            entityType: "notification",
            entityId: notification.id,
            metadata: {
              userId: input.userId,
              type: input.type,
            },
            requestContext,
            ...(resolvedOrganizationId
              ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: resolvedOrganizationId }
              : { scope: SYSTEM_SCOPE.PLATFORM }),
          },
          tx,
        );
      }

      // Upsert delivery rows inside the same transaction so a crash after
      // commit never leaves a notification with no delivery rows (T-002).
      const view = this.notificationsMapper.toNotificationView(notification);
      await this.dispatchService.upsertDeliveriesForNotification(view, tx);

      return notification;
    };

    const notification = executor
      ? await persist(executor)
      : await this.transactionPort.run(persist);

    const view = this.notificationsMapper.toNotificationView(notification);

    // Only emit SSE for newly created notifications, not for idempotent
    // replays of existing ones (M-001). Background handlers should also
    // pass deferDispatch: true to avoid duplicate live events on retry.
    if (!options?.deferDispatch && !isExisting) {
      this.dispatchService.emitSSE(view, resolvedOrganizationId);
    }

    return view;
  }
}
