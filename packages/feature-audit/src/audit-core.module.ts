import { Global, Module } from "@nestjs/common";
import { AUDIT_WRITER } from "@repo/api-runtime";

import { AUDIT_REPOSITORY } from "./application/ports/audit.repository.port";
import { RecordAuditLogUseCase } from "./application/use-cases/record-audit-log.use-case";
import { AuditRepository } from "./infrastructure/audit.repository";

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
      useFactory: (recordAuditLog: RecordAuditLogUseCase) => ({
        log: (input: Parameters<RecordAuditLogUseCase["execute"]>[0], executor?: unknown) =>
          recordAuditLog.execute(input, executor),
      }),
      inject: [RecordAuditLogUseCase],
    },
  ],
  exports: [AUDIT_WRITER, AUDIT_REPOSITORY, RecordAuditLogUseCase],
})
export class AuditCoreModule {}
