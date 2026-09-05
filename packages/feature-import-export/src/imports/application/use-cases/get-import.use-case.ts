import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";

import type { ImportJobView } from "../imports.types";

import { canAccessImportJob } from "../../domain/import-access.policy";
import { ImportsMapper } from "../imports.mapper";
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from "../ports/imports.repository.port";

@Injectable()
export class GetImportUseCase {
  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
    private readonly importsMapper: ImportsMapper,
  ) {}

  async execute(actor: AuthenticatedRequestUser, jobId: string): Promise<ImportJobView> {
    const job = await this.importJobsRepository.findById(jobId);

    if (
      !job ||
      !canAccessImportJob({
        actor: {
          userId: actor.userId,
          organizationId: actor.organizationId,
          roles: actor.roles,
        },
        job: {
          createdById: job.createdById,
          organizationId: job.organizationId,
        },
      })
    ) {
      throw new AppError(
        IMPORT_EXPORT_ERROR_CODES.IMPORT_JOB_NOT_FOUND,
        "Import job not found",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.importsMapper.toImportJobView(job);
  }
}

import { IMPORT_EXPORT_ERROR_CODES } from "@repo/feature-import-export/contracts";
