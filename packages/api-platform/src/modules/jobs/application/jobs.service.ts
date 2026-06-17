import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUTH_TOKEN_CLEANUP,
  type AuthTokenCleanup,
  ERROR_CODES,
  USER_NOTIFICATION_SENDER,
  type UserNotificationSender,
} from '@repo/api-core';
import {
  tenantContextForJob,
  TenantContextService,
  withTenantContext,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-database';

import { MailService } from '../../mail/application/mail.service';
import { JobsRepository } from '../infrastructure/jobs.repository';

export interface JobHandler {
  type: string;
  handle: (job: {
    jobId: string;
    payload: Record<string, unknown>;
    organizationId: string | null;
    createdById: string | null;
  }) => Promise<void>;
}

@Injectable()
export class JobsService {
  private readonly handlers = new Map<string, JobHandler['handle']>();

  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly mailService: MailService,
    private readonly tenantContextService: TenantContextService,
    @Inject(AUTH_TOKEN_CLEANUP)
    private readonly authTokenCleanup: AuthTokenCleanup,
    @Inject(USER_NOTIFICATION_SENDER)
    private readonly notificationSender: UserNotificationSender,
  ) {
    this.registerHandler('mail.send', async ({ payload }) => {
      const templateKey =
        typeof payload.templateKey === 'string' ? payload.templateKey : '';
      const to = typeof payload.to === 'string' ? payload.to : '';
      const variables =
        (payload.variables as Record<string, string> | undefined) ?? {};

      if (!templateKey || !to) {
        throw new Error('mail.send requires templateKey and to');
      }

      await this.mailService.sendTemplate({
        templateKey,
        to,
        variables,
        metadata:
          (payload.metadata as Record<string, unknown> | undefined) ?? null,
      });
    });

    this.registerHandler('files.cleanup', async () => {
      // Stub: reserved for orphaned file cleanup.
    });

    this.registerHandler('auth.cleanup-tokens', async () => {
      await this.authTokenCleanup.cleanupExpiredTokens();
    });

    this.registerHandler('notification.send', async ({ payload, organizationId }) => {
      const userId = typeof payload.userId === 'string' ? payload.userId : '';
      const type = typeof payload.type === 'string' ? payload.type : '';
      const title = typeof payload.title === 'string' ? payload.title : '';
      const body = typeof payload.body === 'string' ? payload.body : '';

      if (!userId || !type || !title || !body) {
        throw new Error(
          'notification.send requires userId, type, title, and body',
        );
      }

      await this.notificationSender.sendToUser(null, {
        ...(organizationId ? { organizationId } : {}),
        userId,
        type,
        title,
        body,
        ...(payload.data
          ? { data: payload.data as Record<string, unknown> }
          : {}),
      });
    });
  }

  registerHandler(type: string, handler: JobHandler['handle']) {
    this.handlers.set(type, handler);
  }

  async enqueue(input: {
    type: string;
    payload: Record<string, unknown>;
    scheduledAt?: Date;
    priority?: number;
    createdById?: string | null;
    organizationId?: string | null;
    maxAttempts?: number;
    idempotencyKey?: string;
  }) {
    const createdById = input.createdById ?? null;

    if (input.idempotencyKey && createdById) {
      const job = await this.jobsRepository.createIdempotent({
        type: input.type,
        payload: input.payload,
        scheduledAt: input.scheduledAt ?? new Date(),
        priority: input.priority ?? 0,
        createdById,
        organizationId: input.organizationId ?? null,
        maxAttempts: input.maxAttempts ?? 3,
        status: 'PENDING',
        idempotencyKey: input.idempotencyKey,
      });

      if (!job) {
        throw new Error('Job insert returned no rows');
      }

      return this.toJobDto(job);
    }

    const job = await this.jobsRepository.create({
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt ?? new Date(),
      priority: input.priority ?? 0,
      createdById,
      organizationId: input.organizationId ?? null,
      maxAttempts: input.maxAttempts ?? 3,
      status: 'PENDING',
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    });

    if (!job) {
      throw new Error('Job insert returned no rows');
    }

    return this.toJobDto(job);
  }

  async listJobs(query: {
    page: number;
    limit: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
    type?: string;
  }) {
    const result = await this.jobsRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    });

    return {
      rows: result.rows.map((row) => this.toJobDto(row)),
      total: result.total,
    };
  }

  async cancelJob(_actor: AuthenticatedRequestUser, jobId: string) {
    const cancelled = await this.jobsRepository.markCancelled(jobId);

    if (!cancelled) {
      const existing = await this.jobsRepository.findById(jobId);

      if (!existing) {
        throw new AppError(
          ERROR_CODES.JOB_NOT_FOUND,
          'Job not found',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Only pending jobs can be cancelled',
        HttpStatus.CONFLICT,
      );
    }

    return this.toJobDto(cancelled);
  }

  async processDueJobs() {
    const dueJobs = await this.tenantContextService.runAsync(
      WORKER_DISPATCH_CONTEXT,
      () => this.jobsRepository.claimDueJobs(20),
    );

    for (const job of dueJobs) {
      await this.tenantContextService.runAsync(
        tenantContextForJob({
          organizationId: job.organizationId ?? null,
          actorUserId: job.createdById ?? null,
        }),
        () => this.processJob(job),
      );
    }
  }

  private async processJob(
    job: NonNullable<Awaited<ReturnType<JobsRepository['findById']>>>,
  ) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobsRepository.markFailed(
            job.id,
            `No handler registered for job type "${job.type}"`,
            transaction,
          );
        },
      );
      return;
    }

    try {
      await handler({
        jobId: job.id,
        payload: job.payload,
        organizationId: job.organizationId ?? null,
        createdById: job.createdById ?? null,
      });
      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobsRepository.markCompleted(job.id, transaction);
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';

      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          if (job.attempts < job.maxAttempts) {
            await this.jobsRepository.requeueForRetry(
              job.id,
              new Date(Date.now() + 60_000),
              message,
              transaction,
            );
            return;
          }

          await this.jobsRepository.markFailed(job.id, message, transaction);
        },
      );
    }
  }

  private toJobDto(
    job: NonNullable<Awaited<ReturnType<JobsRepository['findById']>>>,
  ) {
    return {
      id: job.id,
      type: job.type,
      payload: job.payload,
      status: job.status,
      scheduledAt: job.scheduledAt.toISOString(),
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      cancelledAt: job.cancelledAt?.toISOString() ?? null,
      errorMessage: job.errorMessage ?? null,
      createdById: job.createdById ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
