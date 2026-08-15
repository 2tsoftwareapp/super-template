import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
  ErrorReporterService,
} from '@repo/api-core';

import { NotificationsService } from '../notifications.service';
import { NOTIFICATION_JOBS_REPOSITORY, type NotificationJobsRepositoryPort } from '../ports/notification-jobs.repository.port';

const JOB_STALE_TIMEOUT_MINUTES = 10;
const JOB_MAX_ATTEMPTS = 3;
const JOB_RECOVERY_INTERVAL = 5; // Run stale recovery every Nth tick (~5min at 1min interval)

@Injectable()
export class NotificationJobsProcessor {
  private processing = false;
  private tickCount = 0;

  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(NOTIFICATION_JOBS_REPOSITORY)
    private readonly notificationJobsRepository: NotificationJobsRepositoryPort,
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
      // Periodically recover jobs stuck in PROCESSING (e.g. process crashed
      // after claimDue but before markCompleted/markFailed).
      this.tickCount++;
      if (this.tickCount >= JOB_RECOVERY_INTERVAL) {
        this.tickCount = 0;
        try {
          const { recovered, failed } =
            await this.notificationJobsRepository.recoverStaleProcessing(
              JOB_STALE_TIMEOUT_MINUTES,
              JOB_MAX_ATTEMPTS,
            );
          if (recovered.length > 0) {
            this.logger.warn(
              `Recovered ${recovered.length} stale notification job(s) to PENDING`,
            );
          }
          if (failed.length > 0) {
            this.logger.warn(
              `Exhausted ${failed.length} stale notification job(s) → FAILED (max attempts reached)`,
            );
          }
        } catch (recoveryError) {
          this.logger.error('Stale notification job recovery failed', {
            error:
              recoveryError instanceof Error
                ? recoveryError.message
                : String(recoveryError),
          });
        }
      }

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
