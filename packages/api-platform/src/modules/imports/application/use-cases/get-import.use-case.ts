import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { ImportJobView } from '../imports.types';

import { ImportsMapper } from '../imports.mapper';
import {
  IMPORT_JOBS_REPOSITORY,
  type ImportJobsRepositoryPort,
} from '../imports.repository.port';

@Injectable()
export class GetImportUseCase {
  private readonly importsMapper = new ImportsMapper();

  constructor(
    @Inject(IMPORT_JOBS_REPOSITORY)
    private readonly importJobsRepository: ImportJobsRepositoryPort,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
  ): Promise<ImportJobView> {
    const job = await this.importJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        ERROR_CODES.IMPORT_JOB_NOT_FOUND,
        'Import job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.importsMapper.toImportJobView(job);
  }
}
