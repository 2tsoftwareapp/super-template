import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
  TRANSACTION_PORT,
  type TransactionPort,
  WORKER_DISPATCH_CONTEXT,
} from '@repo/api-core';

import {
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
      const recovered = await this.transactionPort.withTenant(
        WORKER_DISPATCH_CONTEXT,
        (tx) => this.jobsRepository.recoverStaleProcessing(10, 5, tx),
      );

      if (recovered.length > 0) {
        this.logger.info('Recovered stale processing jobs', {
          count: String(recovered.length),
          workerId: WORKER_ID,
        });
      }
    } catch (error) {
      this.logger.error('Failed to recover stale processing jobs', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}