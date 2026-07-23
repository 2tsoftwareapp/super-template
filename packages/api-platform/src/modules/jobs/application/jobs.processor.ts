import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
  type TransactionExecutor,
  TRANSACTION_PORT,
  type TransactionPort,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-core';

import { isTerminalStatus } from '../domain/job-lifecycle';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from './ports/job-observability.repository.port';
import {
  type JobRecord,
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from './ports/jobs.repository.port';
import { JobsService } from './jobs.service';

const WORKER_ID = `worker-${Math.random().toString(36).slice(2, 10)}`;

@Injectable()
export class JobsProcessor {
  private processing = false;

  constructor(
    private readonly jobsService: JobsService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleDueJobs() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      await this.jobsService.processDueJobs();
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error('Failed to process due jobs', logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: 'JOB_PROCESSING_FAILED',
          tags: { job: 'due-jobs' },
        });
      } else {
        this.errorReporter.reportMessage('Failed to process due jobs', {
          errorCode: 'JOB_PROCESSING_FAILED',
          tags: { job: 'due-jobs' },
        });
      }
    } finally {
      this.processing = false;
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async recoverStaleJobs() {
    try {
      await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        async (tx) => {
          const recovered = await this.jobsRepository.recoverStaleProcessing(tx);

          const total = recovered.requeued.length + recovered.failed.length;
          if (total > 0) {
            this.logger.info('Recovered stale processing jobs', {
              requeued: String(recovered.requeued.length),
              failed: String(recovered.failed.length),
              workerId: WORKER_ID,
            });
          }

          for (const failed of recovered.failed) {
            await this.propagateToDependents(failed, tx);
          }
        },
      );
    } catch (error) {
      this.logger.error('Failed to recover stale processing jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async propagateToDependents(
    job: Pick<JobRecord, 'id' | 'organizationId'>,
    executor: TransactionExecutor,
  ) {
    const organizationId = job.organizationId ?? null;
    const dependents = await this.jobsRepository.listDependents(job.id, executor);
    for (const dep of dependents) {
      if (isTerminalStatus(dep.status as any)) {
        continue;
      }
      try {
        await this.jobsRepository.markBlocked(dep.jobId, `Dependency ${job.id} failed after stale recovery`, executor);
        await this.jobObservabilityRepository.recordEvent(
          { jobId: dep.jobId, organizationId, type: 'dependency_failed', message: `Dependency ${job.id} failed after stale recovery` },
          executor,
        );
      } catch (err) {
        this.logger.error('Propagation error during stale recovery', {
          sourceId: job.id,
          targetId: dep.jobId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
}