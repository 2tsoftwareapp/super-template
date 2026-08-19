import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER, type AppLogger } from "@repo/api-core";

import {
  EXPORT_JOBS_REPOSITORY,
  type ExportJobsRepositoryPort,
} from "../ports/export-jobs.repository.port";

// Exports run synchronously inside the originating request; anything still
// PROCESSING after this long lost its request (crash / deploy) and can never
// finish on its own.
const EXPORT_JOB_STALE_MS = 30 * 60 * 1000;

@Injectable()
export class ExportJobsRecoveryService {
  constructor(
    @Inject(EXPORT_JOBS_REPOSITORY)
    private readonly exportJobsRepository: ExportJobsRepositoryPort,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async recoverStaleExportJobs(): Promise<void> {
    const cutoff = new Date(Date.now() - EXPORT_JOB_STALE_MS);

    try {
      const recovered = await this.exportJobsRepository.recoverStaleProcessing(cutoff);

      if (recovered > 0) {
        this.logger.warn(
          `Marked ${recovered} stale export job(s) as FAILED (request died before completion)`,
        );
      }
    } catch (error) {
      this.logger.error("Stale export job recovery failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
