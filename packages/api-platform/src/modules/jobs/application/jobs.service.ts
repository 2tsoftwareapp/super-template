import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core/common/constants/error-codes';
import { AppError } from '@repo/api-core/common/errors/app-error';
import type { AuthenticatedRequestUser } from '@repo/api-core/common/types/request-context';
import { AuthRepository } from '@repo/api-identity/modules/auth/infrastructure/auth.repository';
import { MailService } from '../../mail/application/mail.service';
import { NotificationsService } from '@repo/api-workspace/modules/notifications/application/notifications.service';
import { JobsRepository } from '../infrastructure/jobs.repository';

export type JobHandler = {
  type: string;
  handle: (payload: Record<string, unknown>) => Promise<void>;
};

@Injectable()
export class JobsService {
  private readonly handlers = new Map<string, JobHandler['handle']>();

  constructor(
    private readonly jobsRepository: JobsRepository,
    private readonly mailService: MailService,
    private readonly authRepository: AuthRepository,
    private readonly notificationsService: NotificationsService,
  ) {
    this.registerHandler('mail.send', async (payload) => {
      const templateKey = String(payload.templateKey ?? '');
      const to = String(payload.to ?? '');
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
      await this.authRepository.cleanupExpiredTokens();
    });

    this.registerHandler('notification.send', async (payload) => {
      const userId = String(payload.userId ?? '');
      const type = String(payload.type ?? '');
      const title = String(payload.title ?? '');
      const body = String(payload.body ?? '');

      if (!userId || !type || !title || !body) {
        throw new Error(
          'notification.send requires userId, type, title, and body',
        );
      }

      await this.notificationsService.sendToUser(null, {
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
    maxAttempts?: number;
  }) {
    const job = await this.jobsRepository.create({
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt ?? new Date(),
      priority: input.priority ?? 0,
      createdById: input.createdById ?? null,
      maxAttempts: input.maxAttempts ?? 3,
      status: 'PENDING',
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
    const dueJobs = await this.jobsRepository.claimDueJobs(20);

    for (const job of dueJobs) {
      await this.processJob(job);
    }
  }

  private async processJob(
    job: NonNullable<Awaited<ReturnType<JobsRepository['findById']>>>,
  ) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      await this.jobsRepository.markFailed(
        job.id,
        `No handler registered for job type "${job.type}"`,
      );
      return;
    }

    try {
      await handler(job.payload);
      await this.jobsRepository.markCompleted(job.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';

      if (job.attempts < job.maxAttempts) {
        await this.jobsRepository.requeueForRetry(
          job.id,
          new Date(Date.now() + 60_000),
          message,
        );
        return;
      }

      await this.jobsRepository.markFailed(job.id, message);
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
