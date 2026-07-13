import type { AuthenticatedRequestUser, JsonObject } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import { AuditService } from '../../../audit/application/audit.service';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';
import { FileAccessService } from '../services/file-access.service';

export interface FileHistoryEvent {
  type: 'version' | 'audit';
  action: string;
  actorId: string | null;
  metadata: JsonObject | null;
  createdAt: string;
}

const AUDIT_HISTORY_LIMIT = 100;

@Injectable()
export class GetFileHistoryUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileId: string,
  ): Promise<FileHistoryEvent[]> {
    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      fileId,
    );

    const [versions, auditResult] = await Promise.all([
      this.filesRepository.listVersions(file.id),
      this.auditService.listAuditLogs({
        page: 1,
        limit: AUDIT_HISTORY_LIMIT,
        sortOrder: 'desc',
        resourceType: 'file',
        resourceId: file.id,
      }),
    ]);

    const versionEvents: FileHistoryEvent[] = versions.map((version) => ({
      type: 'version',
      action:
        version.versionNumber === 1 ? 'file.uploaded' : 'file.version_uploaded',
      actorId: version.createdById,
      metadata: {
        versionNumber: version.versionNumber,
        sizeBytes: version.sizeBytes,
        checksum: version.checksum,
      },
      createdAt: version.createdAt.toISOString(),
    }));

    const auditEvents: FileHistoryEvent[] = auditResult.rows.map((row) => ({
      type: 'audit',
      action: row.action,
      actorId: row.actorId,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    return [...versionEvents, ...auditEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
