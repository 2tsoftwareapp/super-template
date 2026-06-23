import type { AuthenticatedRequestUser, RequestContext } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { ExportAuditLogsQuery, ListAuditLogsQuery } from './audit.types';
import type { AuditInput } from './use-cases/record-audit-log.use-case';

import { ExportAuditLogsUseCase } from './use-cases/export-audit-logs.use-case';
import { GetAuditLogUseCase } from './use-cases/get-audit-log.use-case';
import { ListAuditLogsUseCase } from './use-cases/list-audit-logs.use-case';
import { RecordAuditLogUseCase } from './use-cases/record-audit-log.use-case';

@Injectable()
export class AuditService {
  constructor(
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
    private readonly getAuditLogUseCase: GetAuditLogUseCase,
    private readonly exportAuditLogsUseCase: ExportAuditLogsUseCase,
  ) {}

  async log(input: AuditInput, executor?: DatabaseExecutor) {
    return this.recordAuditLogUseCase.execute(input, executor);
  }

  async listAuditLogs(query: ListAuditLogsQuery) {
    return this.listAuditLogsUseCase.execute(query);
  }

  async getAuditLog(id: string) {
    return this.getAuditLogUseCase.execute(id);
  }

  async exportAuditLogs(
    actor: AuthenticatedRequestUser,
    query: ExportAuditLogsQuery,
    requestContext?: RequestContext,
  ) {
    return this.exportAuditLogsUseCase.execute(actor, query, requestContext);
  }
}
