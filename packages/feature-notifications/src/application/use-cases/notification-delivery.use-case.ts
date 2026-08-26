import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, AUDIT_WRITER, type AuditWriter, ERROR_CODES, requireOrganizationId, SYSTEM_SCOPE, TRANSACTION_PORT, type TransactionPort } from "@repo/api-runtime";
import { tenantContextForJob, TenantContextService, WORKER_DISPATCH_CONTEXT } from "@repo/api-runtime";
import { USER_LOOKUP, type UserLookup } from "@repo/feature-users/contracts";

import type {
  ListNotificationJobsQuery,
  NotificationJobView,
  NotificationView,
  SendNotificationRequestCommand,
} from "../notifications.types";
import type { NotificationJobRecord } from "../ports/notification-jobs.repository.port";

import { NotificationsMapper } from "../notifications.mapper";
import {
  NOTIFICATION_JOBS_REPOSITORY,
  type NotificationJobsRepositoryPort,
} from "../ports/notification-jobs.repository.port";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "../ports/notifications.repository.port";
import { NotificationDispatchService } from "../services/notification-dispatch.service";

const DUE_JOB_BATCH_SIZE = 20;
const RECIPIENT_BATCH_SIZE = 100;

@Injectable()
export class NotificationDeliveryUseCase {
  constructor(
    @Inject(NOTIFICATION_JOBS_REPOSITORY)
    private readonly notificationJobsRepository: NotificationJobsRepositoryPort,
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: NotificationsRepositoryPort,
    private readonly tenantContextService: TenantContextService,
    @Inject(USER_LOOKUP) private readonly userLookup: UserLookup,
    private readonly dispatchService: NotificationDispatchService,
    private readonly notificationsMapper: NotificationsMapper,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(TRANSACTION_PORT)
    private readonly transactionPort: TransactionPort,
  ) {}

  async createDeliveryJob(
    actor: AuthenticatedRequestUser,
    input: SendNotificationRequestCommand,
    requestContext?: RequestContext,
  ): Promise<NotificationJobView> {
    this.assertAudiencePayload(input);

    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();

    if (Number.isNaN(scheduledAt.getTime())) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "scheduledAt must be a valid ISO-8601 datetime",
        HttpStatus.BAD_REQUEST,
      );
    }

    const organizationId = requireOrganizationId(actor);

    // Validate recipient membership at creation time — reject early if target users are outside the organization
    if (input.audience === "USER" && input.userId) {
      const member = await this.userLookup.findActiveUserInOrganization(
        input.userId,
        organizationId,
      );
      if (!member) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          "Target user is not an active member of this organization",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (input.audience === "USERS" && input.userIds && input.userIds.length > 0) {
      const validIds = await this.userLookup.filterActiveUserIdsInOrganization(
        input.userIds,
        organizationId,
      );
      if (validIds.length !== input.userIds.length) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          "One or more target users are not active members of this organization",
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const jobValues = {
      organizationId,
      actorId: actor.userId,
      audience: input.audience,
      targetUserId: input.audience === "USER" ? (input.userId ?? null) : null,
      userIds: input.audience === "USERS" ? (input.userIds ?? null) : null,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      scheduledAt,
      status: "PENDING" as const,
    };

    const result = await this.transactionPort.run(async (tx) => {
      const idempotentResult = input.idempotencyKey
        ? await this.notificationJobsRepository.createIdempotent(
            {
              ...jobValues,
              idempotencyKey: input.idempotencyKey,
            },
            tx,
          )
        : null;

      const job = idempotentResult
        ? idempotentResult.value
        : await this.notificationJobsRepository.create(jobValues, tx);

      if (!job) {
        throw new Error("Notification job insert returned no rows");
      }

      if (idempotentResult && !idempotentResult.created) {
        return { job, created: false };
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "notification.job.created",
          entityType: "notification_job",
          entityId: job.id,
          metadata: {
            audience: input.audience,
            scheduledAt: scheduledAt.toISOString(),
          },
          requestContext,
          ...(actor.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: actor.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );

      return { job, created: true };
    });

    if (!result.created) {
      return this.notificationsMapper.toNotificationJobView(result.job);
    }

    const jobView = this.notificationsMapper.toNotificationJobView(result.job);

    if (scheduledAt.getTime() <= Date.now()) {
      await this.processJob(result.job.id);
      const processed = await this.notificationJobsRepository.findById(result.job.id);
      return processed ? this.notificationsMapper.toNotificationJobView(processed) : jobView;
    }

    return jobView;
  }

  async listJobs(actor: AuthenticatedRequestUser, query: ListNotificationJobsQuery) {
    const organizationId = requireOrganizationId(actor);
    const result = await this.notificationJobsRepository.list({
      ...query,
      organizationId,
    });

    return {
      rows: result.rows.map((row) => this.notificationsMapper.toNotificationJobView(row)),
      total: result.total,
    };
  }

  async getJob(actor: AuthenticatedRequestUser, jobId: string): Promise<NotificationJobView> {
    const job = await this.notificationJobsRepository.findById(jobId);

    if (!job) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
        "Notification job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const organizationId = requireOrganizationId(actor);
    if (job.organizationId !== organizationId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
        "Notification job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.notificationsMapper.toNotificationJobView(job);
  }

  async cancelJob(actor: AuthenticatedRequestUser, jobId: string): Promise<NotificationJobView> {
    const organizationId = requireOrganizationId(actor);

    // Verify the job belongs to the actor's organization
    const job = await this.notificationJobsRepository.findById(jobId);

    if (!job) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
        "Notification job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    if (job.organizationId !== organizationId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_JOB_NOT_FOUND,
        "Notification job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const cancelled = await this.transactionPort.run(async (tx) => {
      const result = await this.notificationJobsRepository.markCancelled(jobId, tx);

      if (!result) {
        throw new AppError(
          ERROR_CODES.NOTIFICATION_JOB_NOT_CANCELLABLE,
          "Only pending notification jobs can be cancelled",
          HttpStatus.CONFLICT,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "notification.job.cancelled",
          entityType: "notification_job",
          entityId: jobId,
          ...(organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );

      return result;
    });

    return this.notificationsMapper.toNotificationJobView(cancelled);
  }

  async processDueJobs() {
    const dueJobs = await this.tenantContextService.runAsync(
      WORKER_DISPATCH_CONTEXT,
      // claimDue atomically transitions PENDING→PROCESSING with FOR UPDATE SKIP LOCKED
      () => this.notificationJobsRepository.claimDue(DUE_JOB_BATCH_SIZE),
    );

    for (const job of dueJobs) {
      await this.tenantContextService.runAsync(
        tenantContextForJob({
          organizationId: job.organizationId ?? null,
          actorUserId: job.actorId ?? null,
        }),
        () => this.processClaimedJob(job),
      );
    }
  }

  private async processClaimedJob(locked: NotificationJobRecord) {
    try {
      const recipientIds = await this.resolveRecipientIds(locked);

      if (recipientIds.length === 0) {
        await this.notificationJobsRepository.markCompleted(locked.id, 0, locked.attempts);
        return;
      }

      const organizationId = locked.organizationId;

      if (!organizationId) {
        throw new Error("Notification job is missing organizationId");
      }

      // Collect all notifications for SSE emission after transaction commits
      const allNotificationViews: {
        view: NotificationView;
        userId: string;
        organizationId: string;
      }[] = [];

      await this.transactionPort.run(async (tx) => {
        let deliveredCount = 0;

        for (let offset = 0; offset < recipientIds.length; offset += RECIPIENT_BATCH_SIZE) {
          const batch = recipientIds.slice(offset, offset + RECIPIENT_BATCH_SIZE);
          const inserted = await this.notificationsRepository.createMany(
            batch.map((userId) => ({
              organizationId,
              userId,
              type: locked.type,
              title: locked.title,
              body: locked.body,
              data: locked.data ?? null,
              sourceJobId: locked.id,
            })),
            tx,
          );

          // On retry, createMany returns only newly inserted rows (ON CONFLICT DO NOTHING).
          // Load any existing rows to ensure delivery rows are created for all recipients.
          const existing =
            inserted.length < batch.length
              ? await this.notificationsRepository.findBySourceJobAndUsers(locked.id, batch, tx)
              : [];

          // Dedupe by id: findBySourceJobAndUsers runs in the same transaction
          // so it also returns rows that were just inserted by createMany above.
          const allInBatch = [
            ...new Map([...inserted, ...existing].map((row) => [row.id, row])).values(),
          ];

          for (const notification of allInBatch) {
            await this.dispatchService.upsertDeliveriesForNotification(
              this.notificationsMapper.toNotificationView(notification),
              tx,
            );
            allNotificationViews.push({
              view: this.notificationsMapper.toNotificationView(notification),
              userId: notification.userId,
              organizationId: notification.organizationId ?? organizationId,
            });
          }

          deliveredCount += allInBatch.length;
        }

        await this.notificationJobsRepository.markCompleted(
          locked.id,
          deliveredCount,
          locked.attempts,
          tx,
        );
      });

      // Emit SSE after transaction commits — best-effort, inbox state is the source of truth
      for (const { view, organizationId: orgId } of allNotificationViews) {
        try {
          this.dispatchService.emitSSE(view, orgId);
        } catch {
          // SSE is best-effort; inbox state is the source of truth
        }
      }
    } catch (error) {
      await this.notificationJobsRepository.markFailed(
        locked.id,
        error instanceof Error ? error.message : "Unknown processing error",
        locked.attempts,
      );
    }
  }

  async processJob(jobId: string) {
    const locked = await this.notificationJobsRepository.markProcessing(jobId);

    if (!locked) {
      return;
    }

    await this.processClaimedJob(locked);
  }

  async resolveRecipientIds(job: NotificationJobRecord) {
    const audience = job.audience;
    const organizationId = job.organizationId;

    if (audience === "USER") {
      if (!job.targetUserId) {
        return [];
      }

      const user = await this.userLookup.findActiveUserInOrganization(
        job.targetUserId,
        organizationId ?? "",
      );
      return user ? [user.id] : [];
    }

    if (audience === "USERS") {
      return this.userLookup.filterActiveUserIdsInOrganization(
        job.userIds ?? [],
        organizationId ?? "",
      );
    }

    return this.userLookup.listDeliverableUserIdsInOrganization(organizationId ?? "");
  }

  private assertAudiencePayload(input: SendNotificationRequestCommand) {
    if (input.audience === "USER" && !input.userId) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_INVALID_AUDIENCE,
        "userId is required when audience is USER",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.audience === "USERS" && (!input.userIds || input.userIds.length === 0)) {
      throw new AppError(
        ERROR_CODES.NOTIFICATION_INVALID_AUDIENCE,
        "userIds is required when audience is USERS",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
