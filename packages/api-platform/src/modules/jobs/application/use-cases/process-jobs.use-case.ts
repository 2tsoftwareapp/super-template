import { Inject, Injectable } from '@nestjs/common';
import { isJsonObject, redactSensitive } from '@repo/api-core';
import {
  tenantContextForJob,
  TenantContextService,
  withTenantContext,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-database';

import { JobObservabilityRepository } from '../../infrastructure/job-observability.repository';
import {
  type JobRecord,
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';
import { JobHandlersRegistry } from '../services/job-handlers.registry';

@Injectable()
export class ProcessJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly tenantContextService: TenantContextService,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
    private readonly jobObservabilityRepository: JobObservabilityRepository,
  ) {}

  async execute(): Promise<void> {
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

  private async processJob(job: JobRecord) {
    const organizationId = job.organizationId ?? null;
    const attempt = await withTenantContext(
      this.jobsRepository.client,
      WORKER_DISPATCH_CONTEXT,
      (transaction) =>
        this.jobObservabilityRepository.startAttempt(
          { jobId: job.id, organizationId, attemptNumber: job.attempts },
          transaction,
        ),
    );
    await withTenantContext(
      this.jobsRepository.client,
      WORKER_DISPATCH_CONTEXT,
      (transaction) =>
        this.jobObservabilityRepository.recordEvent(
          { jobId: job.id, organizationId, attemptId: attempt.id, type: 'claimed' },
          transaction,
        ),
    );

    const handler = this.jobHandlersRegistry.getHandler(job.type);

    if (!handler) {
      const message = `No handler registered for job type "${job.type}"`;

      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobsRepository.markFailed(job.id, message, transaction);
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'FAILED', errorMessage: message },
            transaction,
          );
          await this.jobObservabilityRepository.recordEvent(
            {
              jobId: job.id,
              organizationId,
              attemptId: attempt.id,
              type: 'no_handler',
              message,
            },
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
        organizationId,
        createdById: job.createdById ?? null,
      });
      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobsRepository.markCompleted(job.id, transaction);
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'COMPLETED' },
            transaction,
          );
          await this.jobObservabilityRepository.recordEvent(
            { jobId: job.id, organizationId, attemptId: attempt.id, type: 'completed' },
            transaction,
          );
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      const redactedPayload = redactSensitive(job.payload);
      const metadata = isJsonObject(redactedPayload)
        ? { payload: redactedPayload }
        : null;

      await withTenantContext(
        this.jobsRepository.client,
        WORKER_DISPATCH_CONTEXT,
        async (transaction) => {
          await this.jobObservabilityRepository.finishAttempt(
            attempt.id,
            { status: 'FAILED', errorMessage: message },
            transaction,
          );

          if (job.attempts < job.maxAttempts) {
            await this.jobsRepository.requeueForRetry(
              job.id,
              new Date(Date.now() + 60_000),
              message,
              transaction,
            );
            await this.jobObservabilityRepository.recordEvent(
              {
                jobId: job.id,
                organizationId,
                attemptId: attempt.id,
                type: 'retry_scheduled',
                message,
                metadata,
              },
              transaction,
            );
            return;
          }

          await this.jobsRepository.markFailed(job.id, message, transaction);
          await this.jobObservabilityRepository.recordEvent(
            {
              jobId: job.id,
              organizationId,
              attemptId: attempt.id,
              type: 'failed',
              message,
              metadata,
            },
            transaction,
          );
        },
      );
    }
  }
}
