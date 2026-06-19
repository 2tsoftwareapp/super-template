import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
} from '@repo/api-core';

import { NotificationsService } from '../application/notifications.service';

@Injectable()
export class NotificationJobsProcessor {
  private processing = false;

  constructor(
    private readonly notificationsService: NotificationsService,
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
      await this.notificationsService.processDueJobs();
    } catch (error) {
      const logContext: Record<string, string> = {
        error: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        logContext.stack = error.stack;
      }
      this.logger.error('Failed to process due notification jobs', logContext);
      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: 'NOTIFICATION_JOB_PROCESSING_FAILED',
          tags: { job: 'notification-due-jobs' },
        });
      } else {
        this.errorReporter.reportMessage(
          'Failed to process due notification jobs',
          {
            errorCode: 'NOTIFICATION_JOB_PROCESSING_FAILED',
            tags: { job: 'notification-due-jobs' },
          },
        );
      }
    } finally {
      this.processing = false;
    }
  }
}
