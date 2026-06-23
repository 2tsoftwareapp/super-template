import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Injectable } from '@nestjs/common';
import { requireOrganizationId } from '@repo/api-core';

import { FilesRepository } from '../../infrastructure/files.repository';
import { FilesMapper } from '../files.mapper';

export interface ListFilesQuery {
  page: number;
  limit: number;
  sortField: 'createdAt' | 'originalName' | 'sizeBytes';
  sortOrder: 'asc' | 'desc';
  search?: string;
  mimeType?: string;
  uploadedById?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ListFilesUseCase {
  constructor(private readonly filesRepository: FilesRepository) {}

  async execute(actor: AuthenticatedRequestUser, query: ListFilesQuery) {
    const organizationId = requireOrganizationId(actor);
    const result = await this.filesRepository.list({
      ...query,
      organizationId,
    });

    return {
      rows: result.rows.map((row) => FilesMapper.toFileDto(row)),
      total: result.total,
    };
  }
}
