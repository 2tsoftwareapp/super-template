import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { requireOrganizationId, ROLE_NAMES, FILE_KIND } from '@repo/api-core';

import { FilesMapper } from '../files.mapper';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';

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
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, query: ListFilesQuery) {
    const organizationId = requireOrganizationId(actor);
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const result = await this.filesRepository.list({
      ...query,
      organizationId,
      ...(!isSuperAdmin ? { excludeKinds: [FILE_KIND.AUDIT_EXPORT] } : {}),
    });

    return {
      rows: result.rows.map((row) => FilesMapper.toFileDto(row)),
      total: result.total,
    };
  }
}
