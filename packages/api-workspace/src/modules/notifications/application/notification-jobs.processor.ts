import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
} from '@repo/api-core/common/logging/logger.interface';
import { NotificationsService } from '../application/notifications.service';

@Injectable()
export class NotificationJobsProcessor {
  private processing = false;

  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
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
      this.logger.error('Failed to process due notification jobs', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      this.processing = false;
    }
  }
}
