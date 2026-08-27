import type { TransactionExecutor } from "@repo/api-kernel";

import { Global, Module } from "@nestjs/common";

import { AUDIT_REPOSITORY } from "./application/ports/audit.repository.port";
import { RecordAuditLogUseCase } from "./application/use-cases/record-audit-log.use-case";
import { AuditRepository } from "./infrastructure/audit.repository";
import { AUDIT_WRITER, type AuditLogInput, type AuditWriter } from "./public/audit-writer.port";

/**
 * Audit writer core: the only surface other features need (AUDIT_WRITER).
 * Deliberately free of feature-upload coupling so consumers never pull the
 * audit export/file-storage stack transitively.
 */
@Global()
@Module({
  providers: [
    AuditRepository,
    {
      provide: AUDIT_REPOSITORY,
      useExisting: AuditRepository,
    },
    RecordAuditLogUseCase,
    {
      provide: AUDIT_WRITER,
      useFactory: (recordAuditLog: RecordAuditLogUseCase): AuditWriter => ({
        async log(input: AuditLogInput, executor?: TransactionExecutor): Promise<void> {
          await recordAuditLog.execute(input, executor);
        },
      }),
      inject: [RecordAuditLogUseCase],
    },
  ],
  exports: [AUDIT_WRITER, AUDIT_REPOSITORY, RecordAuditLogUseCase],
})
export class AuditCoreModule {}
