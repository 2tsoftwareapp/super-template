import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import type { ListAuditLogsQuery } from './audit.types';
import type { AuditInput } from './use-cases/record-audit-log.use-case';

import { ListAuditLogsUseCase } from './use-cases/list-audit-logs.use-case';
import { RecordAuditLogUseCase } from './use-cases/record-audit-log.use-case';

/**
 * Cross-module facade for audit writing (AUDIT_WRITER port via `log`) and the
 * audit-log lookup consumed by other contexts (e.g. file history). Admin read
 * endpoints inject the audit use cases directly instead of this facade.
 */
@Injectable()
export class AuditService {
  constructor(
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
    private readonly listAuditLogsUseCase: ListAuditLogsUseCase,
  ) {}

  async log(input: AuditInput, executor?: DatabaseExecutor) {
    return this.recordAuditLogUseCase.execute(input, executor);
  }

  async listAuditLogs(query: ListAuditLogsQuery) {
    return this.listAuditLogsUseCase.execute(query);
  }
}
