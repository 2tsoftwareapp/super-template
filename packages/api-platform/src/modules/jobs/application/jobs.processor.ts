import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  APP_LOGGER,
  type AppLogger,
} from '@repo/api-core/common/logging/logger.interface';
import { JobsService } from './jobs.service';

@Injectable()
export class JobsProcessor {
  private processing = false;

  constructor(
    private readonly jobsService: JobsService,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
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
    } finally {
      this.processing = false;
    }
  }
}
