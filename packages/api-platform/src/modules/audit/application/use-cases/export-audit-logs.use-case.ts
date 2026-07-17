import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { requireOrganizationId, toCsv } from '@repo/api-core';
import { randomUUID } from 'node:crypto';

import type { ExportAuditLogsQuery } from '../audit.types';

import { FILES_REPOSITORY, type FilesRepositoryPort } from '../../../files/application/ports/files.repository.port';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';
import { RecordAuditLogUseCase } from './record-audit-log.use-case';

const CSV_HEADER = [
  'id',
  'actorId',
  'action',
  'entityType',
  'entityId',
  'metadata',
  'ipAddress',
  'requestId',
  'createdAt',
];

// Safety bound on a single synchronous export; large historical exports should
// be paginated by date range rather than asking for everything at once.
const MAX_EXPORT_ROWS = 5000;

@Injectable()
export class ExportAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    query: ExportAuditLogsQuery,
    requestContext?: RequestContext,
  ): Promise<{ fileId: string; rowCount: number; totalMatching: number; truncated: boolean }> {
    const organizationId = requireOrganizationId(actor);
    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');

    const fullQuery = {
      ...query,
      ...(isSuperAdmin ? {} : { organizationId }),
    };

    const [rows, totalResult] = await Promise.all([
      this.auditRepository.listForExport({
        ...fullQuery,
        limit: MAX_EXPORT_ROWS,
      }),
      this.auditRepository.count(fullQuery),
    ]);

    const totalMatching = totalResult;
    const truncated = totalMatching > MAX_EXPORT_ROWS;

    const csv = toCsv(
      CSV_HEADER,
      rows.map((row) => [
        row.id,
        row.actorId ?? '',
        row.action,
        row.entityType,
        row.entityId ?? '',
        row.metadata ? JSON.stringify(row.metadata) : '',
        row.ipAddress ?? '',
        row.requestId ?? '',
        row.createdAt.toISOString(),
      ]),
    );

    const storageKey = `exports/audit/${randomUUID()}.csv`;
    const body = Buffer.from(csv, 'utf8');

    await this.objectStorage.upload({
      key: storageKey,
      body,
      mimeType: 'text/csv',
    });

    let fileId: string;

    try {
      const file = await this.filesRepository.create({
        organizationId,
        storageKey,
        originalName: `audit-logs-export-${Date.now()}.csv`,
        mimeType: 'text/csv',
        sizeBytes: body.length,
        uploadedById: actor.userId,
      });

      if (!file) {
        throw new Error('Audit export file insert returned no rows');
      }

      fileId = file.id;
    } catch (error) {
      await this.objectStorage.delete(storageKey).catch(() => undefined);
      throw error;
    }

    await this.recordAuditLogUseCase.execute({
      actorId: actor.userId,
      action: 'audit.exported',
      entityType: 'audit_log',
      organizationId,
      metadata: { rowCount: rows.length, fileId, filters: { ...query } },
      requestContext,
    });

    return { fileId, rowCount: rows.length, totalMatching, truncated };
  }
}
