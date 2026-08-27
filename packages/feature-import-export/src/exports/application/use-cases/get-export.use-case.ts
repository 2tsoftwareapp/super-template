import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-runtime";

import { ExportsMapper } from "../exports.mapper";
import {
  EXPORT_JOBS_REPOSITORY,
  type ExportJobsRepositoryPort,
} from "../ports/export-jobs.repository.port";

@Injectable()
export class GetExportUseCase {
  constructor(
    @Inject(EXPORT_JOBS_REPOSITORY) private readonly exportJobsRepository: ExportJobsRepositoryPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, jobId: string) {
    const job = await this.exportJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        IMPORT_EXPORT_ERROR_CODES.EXPORT_JOB_NOT_FOUND,
        "Export job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return ExportsMapper.toDto(job);
  }
}

import { IMPORT_EXPORT_ERROR_CODES } from "@repo/feature-import-export/contracts";
