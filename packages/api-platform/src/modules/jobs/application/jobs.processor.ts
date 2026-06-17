import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
} from '@repo/api-core';

import { JobsService } from './jobs.service';

@Injectable()
export class JobsProcessor {
  private processing = false;

  constructor(
    private readonly jobsService: JobsService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
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
      this.logger.error('Failed to process due jobs', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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
}
