import { Inject, Injectable } from '@nestjs/common';
import {
  tenantContextForJob,
  TenantContextService,
  withTenantContext,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-database';

import { JobHandlersRegistry } from './job-handlers.registry';
import {
  type JobRecord,
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from './jobs.repository.port';

@Injectable()
export class ProcessJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly tenantContextService: TenantContextService,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
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
    const handler = this.jobHandlersRegistry.getHandler(job.type);

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
}
