/** Public contracts for @repo/feature-audit. */
export { AuditModule } from "../audit.module";
export { AuditCoreModule } from "../audit-core.module";
export {
  AUDIT_WRITER,
  type AuditLogBaseInput,
  type AuditLogInput,
  type AuditWriter,
} from "./audit-writer.port";
export { AUDIT_REPOSITORY } from "../application/ports/audit.repository.port";
export type {
  AuditLogRecord,
  AuditRepositoryPort,
  CreateAuditLogInput,
  ListAuditLogsParams,
} from "../application/ports/audit.repository.port";
export type { ExportAuditLogsQuery, ListAuditLogsQuery } from "../application/audit.types";
export { AUDIT_ERROR_CODES } from "./error-codes";
