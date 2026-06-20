import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { ExportJobsRepository } from '../../infrastructure/export-jobs.repository';
import { ExportsMapper } from '../exports.mapper';

@Injectable()
export class GetExportUseCase {
  constructor(private readonly exportJobsRepository: ExportJobsRepository) {}

  async execute(actor: AuthenticatedRequestUser, jobId: string) {
    const job = await this.exportJobsRepository.findById(jobId);

    if (job?.createdById !== actor.userId) {
      throw new AppError(
        ERROR_CODES.EXPORT_JOB_NOT_FOUND,
        'Export job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return ExportsMapper.toDto(job);
  }
}
