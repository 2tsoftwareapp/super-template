import type { AuthenticatedRequestUser } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";
import { requireOrganizationId } from "@repo/api-core";

import { listFilesAccessScope } from "../../domain/file-access.policy";
import { FilesMapper } from "../files.mapper";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";

export interface ListFilesQuery {
  page: number;
  limit: number;
  sortField: "createdAt" | "originalName" | "sizeBytes";
  sortOrder: "asc" | "desc";
  search?: string;
  mimeType?: string;
  uploadedById?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class ListFilesUseCase {
  constructor(@Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort) {}

  async execute(actor: AuthenticatedRequestUser, query: ListFilesQuery) {
    const organizationId = requireOrganizationId(actor);
    const accessScope = listFilesAccessScope({
      userId: actor.userId,
      organizationId: actor.organizationId,
      roles: actor.roles,
      permissions: actor.permissions,
    });

    const result = await this.filesRepository.list({
      ...query,
      organizationId,
      ...accessScope,
      // Explicit uploadedById from the query wins only for privileged scopes.
      ...(query.uploadedById !== undefined && !accessScope.uploadedById
        ? { uploadedById: query.uploadedById }
        : {}),
    });

    return {
      rows: result.rows.map((row) => FilesMapper.toFileDto(row)),
      total: result.total,
    };
  }
}
